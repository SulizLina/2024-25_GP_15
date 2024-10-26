import 'package:board_datetime_picker/board_datetime_picker.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/services/driver_database.dart';
import 'package:sairdriver/models/motorcycle.dart';
import 'package:sairdriver/services/motorcycle_database.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/ViolationDetail.dart';
import 'package:hugeicons/hugeicons.dart';

class Violationslist extends StatefulWidget {
  final String driverId; // DriverID passed from previous page
  const Violationslist({required this.driverId});

  @override
  State<Violationslist> createState() => _ViolationslistState();
}

class _ViolationslistState extends State<Violationslist> {
  List<DocumentSnapshot> violations = []; // List to hold violation documents
  List<DocumentSnapshot> filteredViolations =
      []; // List for filtered violations based on date
  List<bool> isHoveredList = []; // Hover state list

  List<String> plateN = []; // To store all GPS numbers from violations
  String? selectedGPS; // Selected GPS number

  driver? driverNat_Res;
  DateTime selectDate = DateTime.now(); // Selected date for filtering
  bool isFiltered = false; // Track if filtering is active

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
      await fetchViolations(); // Fetch violations when driver data is found
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

  Map<String, String?> licensePlateMap =
      {}; // Store license plates by Violation ID

  Future<void> fetchViolations({DateTime? filterDate}) async {
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Violation')
          .where('driverID', isEqualTo: driverNat_Res?.driverId)
          .get();

      // Temporarily store the fetches for all violations
      List<Future<void>> fetchTasks = [];

      for (var doc in snapshot.docs) {
        Violation violation = Violation.fromJson(doc);
        if (violation.gspNumber != null) {
          fetchTasks.add(fetchLicensePlate(violation.gspNumber!).then((plate) {
            if (plate != null && violation.Vid != null) {
              licensePlateMap[violation.Vid!] = plate;
              plateN.add(plate);
            }
          }));
        }
      }

      // Wait for all license plate fetches to complete
      await Future.wait(fetchTasks);

      setState(() {
        violations = snapshot.docs;
        plateN = plateN.toSet().toList();

        if (filterDate != null) {
          filteredViolations = violations.where((doc) {
            Violation violation = Violation.fromJson(doc);
            return violation.getFormattedDate().split(' ')[0] ==
                filterDate.toString().split(' ')[0];
          }).toList();
          isFiltered = true;
        } else {
          filteredViolations = violations;
          isFiltered = false;
        }

        isHoveredList =
            List.generate(filteredViolations.length, (index) => false);
      });
    } catch (e) {
      print("Error fetching violations: $e");
    }
  }

  // Choose date using the date picker
  void _chooseDate() async {
    if (isFiltered) {
      setState(() {
        selectDate = DateTime.now();
        isFiltered = false;
      });
      return;
    }

    final result = await showBoardDateTimePicker(
      context: context,
      pickerType: DateTimePickerType.date,
      initialDate: selectDate,
      options: BoardDateTimeOptions(
        languages: BoardPickerLanguages(
          today: 'Today',
          tomorrow: '',
          now: 'now',
        ),
        startDayOfWeek: DateTime.sunday,
        pickerFormat: PickerFormat.ymd,
        activeColor: Color.fromARGB(255, 3, 152, 85),
        backgroundDecoration: BoxDecoration(color: Colors.white),
      ),
    );

    if (result != null) {
      setState(() {
        selectDate = result;
        isFiltered = true;
      });
    } else {
      setState(() {
        isFiltered = false;
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
        toolbarHeight:
            120, // Increase the height to accommodate the dropdown and filter
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Title "My Violations"
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
                          fontSize: 24.0,
                          color: Color(0xFFF3F3F3),
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.left,
                      ),
                    ),
                    SizedBox(height: 10),
                    Row(
                      children: [
                        // Search GPS dropdown
                        Expanded(
                          child: Container(
                            padding: EdgeInsets.symmetric(
                                horizontal: 7, vertical: 0), // Adjust padding
                            decoration: BoxDecoration(
                              color: Color(0xFFF3F3F3),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.grey),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 3,
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.search,
                                    color: Colors.grey, size: 18),
                                SizedBox(width: 5),
                                Expanded(
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<String>(
                                      isExpanded: true,
                                      value: selectedGPS,
                                      icon: Icon(Icons.arrow_drop_down,
                                          color: Colors.grey,
                                          size: 20), // Dropdown arrow
                                      dropdownColor: Color(0xFFF3F3F3),
                                      style: GoogleFonts.poppins(
                                        color: Colors.black,
                                        fontSize: 14,
                                      ),
                                      hint: Text(
                                        'Filter By Licence Plate', // Placeholder text
                                        style: GoogleFonts.poppins(
                                            color: Colors.grey, fontSize: 14),
                                      ),
                                      onChanged: (String? newValue) {
                                        setState(() {
                                          selectedGPS = newValue;
                                        });
                                      },
                                      items: plateN
                                          .map<DropdownMenuItem<String>>(
                                              (String gps) {
                                        return DropdownMenuItem<String>(
                                          value: gps,
                                          child: Text(
                                            gps,
                                            style: GoogleFonts.poppins(
                                                color: Colors.black,
                                                fontSize: 13),
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        // Filter Icon
                        IconButton(
                          onPressed: () {
                            _chooseDate();
                          },
                          icon: Icon(
                            isFiltered
                                ? HugeIcons.strokeRoundedFilterRemove
                                : HugeIcons.strokeRoundedFilter,
                            size: 24,
                            color: Color(0xFFF3F3F3),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
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
            child: StreamBuilder<QuerySnapshot>(
              stream: fetchViolationsStream(),
              builder: (context, snapshot) {
                // Show a loading indicator while waiting for data
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Center(child: CircularProgressIndicator());
                }

                // Handle errors
                if (snapshot.hasError) {
                  return Center(child: Text("Error loading violations"));
                }

                // Ensure data is available and non-empty
                if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                  return Center(
                    child: Text(
                      isFiltered
                          ? "You don't have any violations\nfor the selected date."
                          : "You don't have any violations,\nride safe :)",
                      style:
                          GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
                      textAlign: TextAlign.center,
                    ),
                  );
                }

                // Get the list of violations and apply filtering
                final violations = snapshot.data!.docs;
                final filteredList = isFiltered
                    ? violations.where((doc) {
                        Violation violation = Violation.fromJson(doc);
                        return violation.getFormattedDate().split(' ')[0] ==
                            selectDate.toString().split(' ')[0];
                      }).toList()
                    : violations;

                // Update `isHoveredList` to match the filtered list length
                isHoveredList =
                    List.generate(filteredList.length, (index) => false);

                // Display message if the filtered list is empty
                if (filteredList.isEmpty) {
                  return Center(
                    child: Text(
                      "No violations found for the selected date.",
                      style:
                          GoogleFonts.poppins(fontSize: 18, color: Colors.grey),
                      textAlign: TextAlign.center,
                    ),
                  );
                }

                // Build the ListView for violations
                return ListView.separated(
                  itemBuilder: (BuildContext context, int index) {
                    // Additional safety check for out-of-bounds access
                    if (index >= filteredList.length) return Container();

                    Violation violation =
                        Violation.fromJson(filteredList[index]);
                    String formattedDate = violation.getFormattedDate();

                    return MouseRegion(
                      onEnter: (_) =>
                          setState(() => isHoveredList[index] = true),
                      onExit: (_) =>
                          setState(() => isHoveredList[index] = false),
                      child: Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          color: isHoveredList[index]
                              ? Colors.green[200]
                              : Color(0xFFF3F3F3),
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: isHoveredList[index]
                              ? [
                                  const BoxShadow(
                                      color: Colors.black26, blurRadius: 5)
                                ]
                              : [],
                        ),
                        child: ListTile(
                          title: Text(
                            'Violation ID: ${violation.Vid}',
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF211D1D),
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Date: $formattedDate',
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  color: Color(0xFF211D1D),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Licence Plate: ${licensePlateMap[violation.Vid] ?? "Loading..."}',
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  color: Color(0xFF211D1D),
                                ),
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
                                    violationId: filteredList[index].id),
                              ),
                            );
                          },
                        ),
                      ),
                    );
                  },
                  separatorBuilder: (BuildContext context, int index) {
                    return Divider(color: Colors.grey[350]);
                  },
                  itemCount: filteredList.length,
                );
              },
            )),
      ),
    );
  }
}
