import 'package:board_datetime_picker/board_datetime_picker.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/services/driver_database.dart';
import 'package:sairdriver/models/motorcycle.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/ViolationDetail.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:sairdriver/messages/CrashDialog.dart';
import 'package:sairdriver/models/crash.dart';
import 'package:sairdriver/services/crashstreambuilder.dart';
import 'package:sairdriver/globals.dart';

// ignore: must_be_immutable
class Violationslist extends StatefulWidget {
  final String driverId; // DriverID passed from previous page
  Violationslist({required this.driverId});

  @override
  State<Violationslist> createState() => _ViolationslistState();
}

class _ViolationslistState extends State<Violationslist> {
  List<DocumentSnapshot> violations = []; // List to hold violation documents
  List<DocumentSnapshot> filteredViolations =
      []; // List for filtered violations based on date
  List<bool> isHoveredList = [];

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

  Future<String?> fetchLicensePlate(String? gspNumber) async {
    if (gspNumber == null) return null;
    QuerySnapshot motorcycleSnapshot = await FirebaseFirestore.instance
        .collection('Motorcycle')
        .where('GPSnumber', isEqualTo: gspNumber)
        .get();
    if (motorcycleSnapshot.docs.isNotEmpty) {
      Motorcycle motorcycle =
          Motorcycle.fromDocument(motorcycleSnapshot.docs.first);
      return motorcycle.licensePlate;
    }
    return null;
  }

  Future<void> fetchDriverData() async {
    DriverDatabase dbD = DriverDatabase();
    driverNat_Res = await dbD.getDriversnById(widget.driverId);

    if (driverNat_Res != null) {
      print(
          "Driver data found for ID: ${widget.driverId}, driverID: ${driverNat_Res?.driverId}");
      await fetchViolations();
    } else {
      print("Driver data not found for ID: ${widget.driverId}");
    }
  }

  Stream<QuerySnapshot> fetchViolationsStream() {
    return FirebaseFirestore.instance
        .collection('Violation')
        .where('driverID', isEqualTo: driverNat_Res?.driverId)
        .snapshots();
  }

  Stream<QuerySnapshot> fetchCrashesStream() {
    return FirebaseFirestore.instance
        .collection('Crash')
        .where('driverID', isEqualTo: driverNat_Res?.driverId)
        .snapshots();
  }

  Map<String, String?> licensePlateMap = {};

  Future<void> fetchViolations({DateTime? filterDate}) async {
    try {
      print('++++++++++++++++++hi fetchViolations=+++++++++++++++++++++++++');
      // Fetch all violations for the driver from Firestore
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Violation')
          .where('driverID', isEqualTo: driverNat_Res?.driverId)
          .get();

      // Store the violations
      violations = snapshot.docs;

      // Process license plates for each violation
      List<Future<void>> fetchTasks = violations.map((doc) async {
        Violation violation = Violation.fromJson(doc);
        if (violation.gspNumber != null) {
          String? plate = await fetchLicensePlate(violation.gspNumber!);
          if (plate != null && violation.Vid != null) {
            licensePlateMap[violation.Vid!] = plate;
            plateN.add(plate);
          }
        }
      }).toList();

      await Future.wait(fetchTasks);

      setState(() {
        // Process license plates list
        if (plateN.isNotEmpty) {
          plateN = [
            "Reset",
            ...{...plateN}
          ].toSet().toList();
        } else {
          plateN = []; // Empty list when no plates
        }

        // Reset selected plate if it's not available
        if (!plateN.contains(selectedPlate)) {
          selectedPlate = null;
        }

        // Apply filters based on selectedPlate and filterDate
        filteredViolations = violations.where((doc) {
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

        // Update hover state for the violation list
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
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(left: 7),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 5),
                      child: Text(
                        "My Violations",
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
                        );
                      },
              ),
            ),
            // Filter by date
            IconButton(
              onPressed: violations.isEmpty ? null : _chooseDate,
              icon: Icon(
                isDateFiltered
                    ? HugeIcons.strokeRoundedCalendarRemove02
                    : HugeIcons.strokeRoundedCalendar03,
                size: 24,
                color: violations.isEmpty
                    ? const Color.fromARGB(255, 199, 199, 199)
                    : isDateFiltered
                        ? const Color(
                            0xFFFFC800) // Date is selected (traffic yellow)
                        : Color(0xFFF3F3F3), // No date selected
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
              // Violations StreamBuilder
              Expanded(
                child: StreamBuilder<QuerySnapshot>(
                  stream: fetchViolationsStream(),
                  builder: (context, snapshot) {
                    if (_isLoading) {
                      return Center(child: CircularProgressIndicator());
                    }

                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return Center(child: CircularProgressIndicator());
                    }

                    if (snapshot.hasError) {
                      return Center(child: Text("Error loading violations"));
                    }

                    if (snapshot.data == null || snapshot.data!.docs.isEmpty) {
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

                    final violations = snapshot.data!.docs;

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

                    // Sort filtered list by date (descending)
                    filteredList.sort((a, b) {
                      Violation violationA = Violation.fromJson(a);
                      Violation violationB = Violation.fromJson(b);
                      return violationB.time!.compareTo(
                          violationA.time!); // Sort by time, descending
                    });

                    isHoveredList =
                        List.generate(filteredList.length, (index) => false);

                    if (filteredList.isEmpty) {
                      return Center(
                        child: Text(
                          "No violations found for the selected date.",
                          style: GoogleFonts.poppins(
                              fontSize: 18, color: Colors.grey),
                          textAlign: TextAlign.center,
                        ),
                      );
                    }

                    return ListView.builder(
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
                                  Text(
                                    'Licence Plate: ${licensePlateMap[violation.Vid] ?? ""}',
                                    style:
                                        GoogleFonts.poppins(color: Colors.grey),
                                  ),
                                ],
                              ),
                              trailing: Icon(
                                HugeIcons.strokeRoundedInformationCircle,
                                color: Color.fromARGB(202, 3, 152, 85),
                                size: 20,
                              ),
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => Violationdetail(
                                      violationId: filteredList[index].id,
                                      driverid: widget.driverId,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        );
                      },
                      itemCount: filteredList.length,
                    );
                  },
                ),
              ),
              //show crash dialog if needed
              CrashStreamBuilder(driverId: widget.driverId),
            ],
          ),
        ),
      ),
    );
  }
}
