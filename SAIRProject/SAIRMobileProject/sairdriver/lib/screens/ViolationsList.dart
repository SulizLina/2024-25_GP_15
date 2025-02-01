import 'package:board_datetime_picker/board_datetime_picker.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/screens/RaiseCompliants.dart';
import 'package:sairdriver/services/driver_database.dart';
import 'package:sairdriver/models/motorcycle.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/ViolationDetail.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:sairdriver/services/crashstreambuilder.dart';
import 'package:sairdriver/services/motorcycle_database.dart';

class Violationslist extends StatefulWidget {
  final String driverId;
  final String page;
  Violationslist({required this.driverId, required this.page});

  @override
  State<Violationslist> createState() => _ViolationslistState();
}

class _ViolationslistState extends State<Violationslist> {
  List<DocumentSnapshot> violations = []; // List to hold violation documents
  List<DocumentSnapshot> filteredViolations =
      []; // List for filtered violations based on date
  List<bool> isHoveredList = [];
  Map<String, String?> licensePlateMap = {};
  Motorcycle? motorcycle;
  List<String> plateN = [];
  String? selectedPlate;
  String? mtoken = "";
  driver? driverNat_Res;
  DateTime selectDate = DateTime.now();
  bool isDateFiltered = false;
  bool isPlateFiltered = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchDriverData();
  }

  Future<String?> fetchLicensePlate(String? id) async {
    if (id == null) return 'null';
    MotorcycleDatabase mdb = MotorcycleDatabase();
    motorcycle = await mdb.getMotorcycleByIDhis(id);
    return motorcycle!.licensePlate;
  }

  Future<void> fetchDriverData() async {
    DriverDatabase dbD = DriverDatabase();
    driverNat_Res = await dbD.getDriversnById(widget.driverId);

    if (driverNat_Res != null) {
      print(
          "Driver data found for ID: ${widget.driverId}, driverID: ${driverNat_Res?.driverId}");
      await fetchViolations(page: widget.page);
    } else {
      print("Driver data not found for ID: ${widget.driverId}");
    }
  }

  Stream<List<QueryDocumentSnapshot<Object?>>> fetchViolationsStream(String? page) {
    final complaintsStream = FirebaseFirestore.instance
        .collection('Complaint')
        .where('driverID', isEqualTo: driverNat_Res?.driverId)
        .where('Status', isEqualTo: 'Accepted') // Get only Accepted complaints
        .snapshots();

    return FirebaseFirestore.instance
        .collection('Violation')
        .where('driverID', isEqualTo: driverNat_Res?.driverId)
        .snapshots()
        .asyncMap((violationsSnapshot) async {
      final complaintsSnapshot = await complaintsStream.first;

      // Extract violation IDs with accepted complaints
      final complaintViolationIds = complaintsSnapshot.docs
          .where((doc) => doc.data().containsKey('ViolationID'))
          .map((doc) => doc['ViolationID'] as String)
          .toSet();

      // Get the current date
      final now = DateTime.now();

      // Filter violations based on the page type
      final filteredViolations = violationsSnapshot.docs.where((doc) {
        final violationId =
        doc.data().containsKey('violationID') ? doc['violationID'] as String : null;

        if (violationId == null) {
          print("Skipping violation without ID: ${doc.id}");
          return false;
        }

        // Exclude violations that have an accepted complaint
        if (complaintViolationIds.contains(violationId)) {
          print("Skipping violation with accepted complaint: ${doc.id}");
          return false;
        }

        // Apply date filtering ONLY for 'complaints' page
        if (page == 'complaints') {
          if (!doc.data().containsKey('time')) {
            print("Skipping violation without time field: ${doc.id}");
            return false;
          }

          // Parse violation date
          DateTime violationDate;
          try {
            final timeField = doc['time'];
            if (timeField is String) {
              violationDate = DateTime.parse(timeField);
            } else if (timeField is int) {
              violationDate = DateTime.fromMillisecondsSinceEpoch(timeField * 1000);
            } else {
              print("Invalid type for time field in violation ${doc.id}: ${timeField.runtimeType}");
              return false;
            }
          } catch (e) {
            print("Error parsing date for violation ${doc.id}: $e");
            return false;
          }

          final isOlderThan30Days = violationDate.isBefore(now.subtract(Duration(days: 30)));

          if (isOlderThan30Days) {
            print("Skipping old violation: ${doc.id}");
            return false;
          }
        }

        return true;
      }).toList();

      print("Filtered Violations (${page} Page): ${filteredViolations.map((doc) => doc.id).toList()}");

      return filteredViolations;
    });
  }


  Future<void> fetchViolations({DateTime? filterDate, String? page}) async {
    try {
      // Fetch accepted complaints
      QuerySnapshot acceptedComplaintSnapshot = await FirebaseFirestore.instance
          .collection('Complaint')
          .where('driverID', isEqualTo: driverNat_Res?.driverId)
          .where('Status', isEqualTo: 'Accepted')
          .get();

      List<String> acceptedViolationIds = acceptedComplaintSnapshot.docs
          .map((doc) => doc.get('ViolationID') as String)
          .toList();

      // Fetch all violations
      QuerySnapshot violationSnapshot = await FirebaseFirestore.instance
          .collection('Violation')
          .where('driverID', isEqualTo: driverNat_Res?.driverId)
          .get();

      List<QueryDocumentSnapshot> allViolations = violationSnapshot.docs;

      List<QueryDocumentSnapshot> filteredResults = allViolations;

      if (page == 'complaints') {
        // Fetch complaints to exclude them from the results
        QuerySnapshot complaintSnapshot = await FirebaseFirestore.instance
            .collection('Complaint')
            .where('driverID', isEqualTo: driverNat_Res?.driverId)
            .get();

        List<String?> complaintViolationIds = complaintSnapshot.docs
            .map((doc) => doc.get('ViolationID') as String?)
            .toList();

        filteredResults = allViolations.where((violationDoc) {
          final violationId = violationDoc.get('violationID') as String?;

          return !complaintViolationIds.contains(violationId);
        }).toList();
      }

      // Process license plates for each violation
      List<Future<void>> fetchTasks = filteredResults.map((doc) async {
        Violation violation = Violation.fromJson(doc);
        if (violation.gspNumber != null) {
          String? plate = await fetchLicensePlate(violation.Vid!);
          if (plate != null && violation.Vid != null) {
            licensePlateMap[violation.Vid!] = plate;
            plateN.add(plate);
          }
        }
      }).toList();

      await Future.wait(fetchTasks);

      setState(() {
        if (plateN.isNotEmpty) {
          plateN = [
            "Reset",
            ...{...plateN}
          ].toSet().toList();
        } else {
          plateN = [];
        }

        if (!plateN.contains(selectedPlate)) {
          selectedPlate = null;
        }

        filteredViolations = filteredResults.where((doc) {
          Violation violation = Violation.fromJson(doc);

          bool dateMatch = isDateFiltered
              ? violation.getFormattedDate().split(' ')[0] ==
                  selectDate.toString().split(' ')[0]
              : true;

          bool plateMatch = selectedPlate == null
              ? true
              : licensePlateMap[violation.Vid] == selectedPlate;

          return dateMatch && plateMatch;
        }).toList();

        isHoveredList =
            List.generate(filteredViolations.length, (index) => false);
        _isLoading = false;
      });
    } catch (e) {
      print("Error fetching violations: $e");
    }
  }

  // Choose date using the date picker
  void _chooseDate() async {
    if (isDateFiltered) {
      setState(() {
        selectDate = DateTime.now();
        isDateFiltered = false;
      });
      return;
    }

    final result = await showBoardDateTimePicker(
      context: context,
      pickerType: DateTimePickerType.date,
      initialDate: selectDate,
      options: BoardDateTimeOptions(
        languages:
            BoardPickerLanguages(today: 'Today', tomorrow: '', now: 'now'),
        startDayOfWeek: DateTime.sunday,
        pickerFormat: PickerFormat.ymd,
        activeColor: Color.fromARGB(255, 3, 152, 85),
        backgroundDecoration: BoxDecoration(color: Colors.white),
      ),
    );

    if (result != null) {
      setState(() {
        selectDate = result;
        isDateFiltered = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color.fromARGB(255, 3, 152, 85),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Color.fromARGB(255, 3, 152, 85),
        toolbarHeight: 120,
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            if (widget.page == 'complaints')
              IconButton(
                icon: Icon(Icons.arrow_back,
                    color: Colors.white), // Arrow is now white
                onPressed: () {
                  Navigator.pop(context); // Navigate back
                },
              ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(left: 7),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 5),
                      child: Text(
                        widget.page == 'menu' ? "My Violations" : 'Violations',
                        style: GoogleFonts.poppins(
                          fontSize: 22,
                          color: Color(0xFFF3F3F3),
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.left,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // filter by plate
            DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                icon: Padding(
                  padding: const EdgeInsets.only(top: 5.0),
                  child: ColorFiltered(
                    colorFilter: ColorFilter.mode(
                      plateN.isEmpty
                          ? const Color.fromARGB(255, 199, 199, 199)
                          : (selectedPlate == null
                              ? const Color(0xFFF3F3F3) // no plate selected
                              : Color(
                                  0xFFFFC800)), //  plate is selected (traffic yellow)
                      BlendMode.srcIn,
                    ),
                    child: Image.asset(
                      'assets/image/licenseplate.png',
                      width: 33,
                      height: 33,
                    ),
                  ),
                ),
                dropdownColor: Color(0xFFF3F3F3),
                items: plateN.map<DropdownMenuItem<String>>((String plate) {
                  return DropdownMenuItem<String>(
                    value: plate,
                    child: Text(
                      plate,
                      style: GoogleFonts.poppins(
                          color: Colors.black, fontSize: 14),
                    ),
                  );
                }).toList(),
                onChanged: plateN.isEmpty
                    ? null
                    : (String? newValue) {
                        setState(() {
                          if (newValue == "Reset") {
                            selectedPlate = null;
                            isPlateFiltered = false;
                          } else {
                            selectedPlate = newValue;
                            isPlateFiltered = selectedPlate != null;
                          }
                          _isLoading = true;
                        });
                        fetchViolations(
                            filterDate: isDateFiltered ? selectDate : null,
                            page: widget.page);
                      },
              ),
            ),
            // Filter by date
            IconButton(
              onPressed: filteredViolations.isEmpty ? null : _chooseDate,
              icon: Icon(
                isDateFiltered
                    ? HugeIcons.strokeRoundedCalendarRemove02
                    : HugeIcons.strokeRoundedCalendar03,
                size: 24,
                color: filteredViolations.isEmpty
                    ? const Color.fromARGB(255, 199, 199, 199)
                    : isDateFiltered
                        ? const Color(0xFFFFC800)
                        : Color(0xFFF3F3F3),
              ),
            ),
          ],
        ),
      ),
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          color: Color(0xFFF3F3F3),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 15),
          child: Column(
            children: [
              if (widget.page == 'complaints')
                Text(
                  'Select a violation to submit your complaint',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Colors
                        .red, //Colors.black, //Color(0xFFFFC800) //Colors.grey[400],
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              if (widget.page == 'complaints') const SizedBox(height: 20),
              // Violations StreamBuilder
              Expanded(
                child: StreamBuilder<List<QueryDocumentSnapshot<Object?>>>(
                  stream: fetchViolationsStream(widget.page),
                  builder: (context, snapshot) {
                    if (_isLoading ||
                        snapshot.connectionState == ConnectionState.waiting) {
                      return Center(child: CircularProgressIndicator());
                    }

                    if (snapshot.hasError) {
                      return Center(child: Text("Error loading violations"));
                    }

                    if (!snapshot.hasData || snapshot.data!.isEmpty) {
                      return Center(
                        child: Text(
                          isDateFiltered || isPlateFiltered
                              ? "You don't have any violations\nfor the selected date."
                              : "You don't have any violations,\nride safe :)",
                          style: GoogleFonts.poppins(
                              fontSize: 20, color: Colors.grey),
                          textAlign: TextAlign.center,
                        ),
                      );
                    }

                    // Extract violations from snapshot
                    final violations = snapshot.data!;

                    // Filter and sort violations
                    final filteredList = violations.where((doc) {
                      Violation violation = Violation.fromJson(doc);

                      bool dateMatch = isDateFiltered
                          ? violation.getFormattedDate().split(' ')[0] ==
                              selectDate.toString().split(' ')[0]
                          : true;

                      bool plateMatch = selectedPlate != null
                          ? licensePlateMap[violation.Vid] == selectedPlate
                          : true;

                      return dateMatch && plateMatch;
                    }).toList();

                    filteredList.sort((a, b) {
                      Violation violationA = Violation.fromJson(a);
                      Violation violationB = Violation.fromJson(b);
                      return violationB.time!.compareTo(violationA.time!);
                    });

                    isHoveredList =
                        List.generate(filteredList.length, (index) => false);

                    // Check if the filtered list is empty
                    if (filteredList.isEmpty) {
                      return Center(
                        child: Text(
                          isDateFiltered && selectedPlate != null
                              ? "You don't have any violations for the selected date and license plate."
                              : isDateFiltered || selectedPlate != null
                                  ? "You don't have any violations\nfor the selected ${isDateFiltered ? 'date' : 'license plate'}."
                                  : "You don't have any violations,\nride safe :)",
                          style: GoogleFonts.poppins(
                              fontSize: 20, color: Colors.grey),
                          textAlign: TextAlign.center,
                        ),
                      );
                    }

                    // Display the filtered violations in a ListView
                    return ListView.builder(
                      itemCount: filteredList.length,
                      itemBuilder: (BuildContext context, int index) {
                        if (index >= filteredList.length) return Container();

                        Violation violation =
                            Violation.fromJson(filteredList[index]);
                        String formattedDate = violation.getFormattedDate();

                        return MouseRegion(
                          onEnter: (_) =>
                              setState(() => isHoveredList[index] = true),
                          onExit: (_) =>
                              setState(() => isHoveredList[index] = false),
                          child: Card(
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(15),
                            ),
                            margin: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            color: violation.isAuto == true
                                ? Colors.lightGreen[100]
                                : Colors.white,
                            elevation: 2,
                            child: ListTile(
                              title: Text(
                                'Violation ID: ${violation.Vid}',
                                style: GoogleFonts.poppins(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                ),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Date: $formattedDate',
                                    style:
                                        GoogleFonts.poppins(color: Colors.grey),
                                  ),
FutureBuilder<String?>(
  future: fetchLicensePlate(violation.Vid), // Fetch the data
  builder: (context, snapshot) {
   if (snapshot.connectionState == ConnectionState.waiting) {
      return Text("Loading...", style: GoogleFonts.poppins(color: Colors.grey));
    }else
     if (snapshot.hasError) {
      return Text("Error fetching plate", style: GoogleFonts.poppins(color: Colors.red));
    } else {
      return Text(
        'License Plate: ${snapshot.data ?? "Unknown"}',
        style: GoogleFonts.poppins(color: Colors.grey),
      );
    }
  },
)

                                ],
                              ),
                              trailing: Icon(
                                HugeIcons.strokeRoundedInformationCircle,
                                color: Color.fromARGB(202, 3, 152, 85),
                                size: 20,
                              ),
                              onTap: () {
                                if (widget.page == 'menu') {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => Violationdetail(
                                        violationId: filteredList[index].id,
                                        driverid: widget.driverId,
                                      ),
                                    ),
                                  );
                                }
                                if (widget.page == 'complaints') {
                                  Violation violation =
                                      Violation.fromJson(filteredList[index]);
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => Raisecomplaint(
                                          violation: violation,
                                          driverid: widget.driverId,
                                          page: "complaints"),
                                    ),
                                  );
                                }
                              },
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
              CrashStreamBuilder(driverId: widget.driverId),
            ],
          ),
        ),
      ),
    );
  }
}
