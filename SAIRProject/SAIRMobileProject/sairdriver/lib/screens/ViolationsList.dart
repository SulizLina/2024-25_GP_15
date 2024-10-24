import 'package:board_datetime_picker/board_datetime_picker.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/services/driver_database.dart';
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
  List<DocumentSnapshot> filteredViolations = []; // List for filtered violations based on date
  List<bool> isHoveredList = []; // Hover state list

  driver? driverNat_Res;
  DateTime selectDate = DateTime.now(); // Selected date for filtering
  bool isFiltered = false; // Track if filtering is active

  @override
  void initState() {
    super.initState();
    fetchDriverData();
  }

  Future<void> fetchDriverData() async {
    DriverDatabase dbD = DriverDatabase();
    driverNat_Res = await dbD.getDriversnById(widget.driverId);

    if (driverNat_Res != null) {
      print("Driver data found for ID: ${widget.driverId}, driverID: ${driverNat_Res?.driverId}");
      await fetchViolations(); // Fetch violations when driver data is found
    } else {
      print("Driver data not found for ID: ${widget.driverId}");
    }
  }

Future<void> fetchViolations({DateTime? filterDate}) async {
  print('Attempting to fetch violations for driver ID: ${driverNat_Res?.driverId}');

  if (driverNat_Res == null) {
    print('Driver data is null, unable to fetch violations.');
    return;
  }

  try {
    QuerySnapshot snapshot = await FirebaseFirestore.instance
        .collection('te2')
        .where('DriverID', isEqualTo: driverNat_Res?.driverId)
        .get();

    print("Number of violations fetched: ${snapshot.docs.length}");

      setState(() {
        violations = snapshot.docs;
        // If filterDate is provided, filter violations based on that date
        if (filterDate != null) {
          filteredViolations = violations.where((doc) {
            Violation violation = Violation.fromJson(doc);
            return violation.getFormattedDate().split(' ')[0] ==
                filterDate.toString().split(' ')[0];
          }).toList();
          isFiltered = true; // Set to true when filtering
        } else {
          filteredViolations = violations; // If no date filter, show all violations
          isFiltered = false; // Reset filtering state
        }
        // Update the hover list to match the filtered violations length
        isHoveredList = List.generate(filteredViolations.length, (index) => false);
      });
    } catch (e) {
      print("Error fetching violations: $e");
    }
  }

  // Choose date using the date picker
  void _chooseDate() async {
        if (isFiltered) {
      // Reset to show all violations if already filtered
      setState(() {
        selectDate = DateTime.now(); // Reset to current date
        filteredViolations = violations; // Show all violations
        isFiltered = false; // Mark that the filter is removed
        isHoveredList = List.generate(filteredViolations.length, (index) => false); // Reset hover list
      });
      return; // Exit early
    }

    // If no filter is applied, show the date picker
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
        backgroundDecoration: BoxDecoration(
          color: Colors.white,
        ),
      ),
    );

    if (result != null) {
      setState(() {
        selectDate = result;
      });
      fetchViolations(filterDate: selectDate); // Fetch and filter violations by the selected date
    } else {
      // Reset the filter if the result is null (user canceled)
      setState(() {
        isFiltered = false; // Reset filtering state
        filteredViolations = violations; // Show all violations
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
                child: Transform.translate(
                  offset: const Offset(0, 10),
                  child: Padding(
                    padding: const EdgeInsets.only(left: 5),
                    child: Text(
                      "My Violations",
                      style: GoogleFonts.poppins(
                        fontSize: 24.0,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.left,
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(right: 5, top: 10),
              child: IconButton(
                onPressed: () {
                  _chooseDate();
                },
                icon: Icon(
                  isFiltered 
                    ? HugeIcons.strokeRoundedFilterRemove 
                    : HugeIcons.strokeRoundedFilter, 
                  color: Colors.white,
                  size: 28,
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
          child: filteredViolations.isEmpty
              ? Center(
                  child: Text(
                    isFiltered
                        ? "You don't have any violations\nfor the selected date."
                        : "You don't have any violations,\nride safe :)",
                    style: GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                )
              : ListView.separated(
                  itemBuilder: (BuildContext context, int index) {
                    if (index >= filteredViolations.length) return Container();

                    Violation violation = Violation.fromJson(filteredViolations[index]);
                    String formattedDate = violation.getFormattedDate();

                    return MouseRegion(
                      onEnter: (_) => setState(() => isHoveredList[index] = true),
                      onExit: (_) => setState(() => isHoveredList[index] = false),
                      child: Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          color: isHoveredList[index] ? Colors.green[200] : Color(0xFFF3F3F3),
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: isHoveredList[index]
                              ? [const BoxShadow(color: Colors.black26, blurRadius: 5)]
                              : [],
                        ),
                        child: ListTile(
                        title: Text(
                          'Violation ID: ${violation.Vid}', // From DB
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
                              formattedDate,
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                color: Color(0xFF211D1D),
                              ),
                            ),
                            /*
                            const SizedBox(height: 4), // Space between subtitles
                            Text(
                              'ABC 123', // Add your additional subtitle text here
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                color: Color(0xFF211D1D),
                              ),
                            ),
                            */
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
                              builder: (context) => Violationdetail(violationId: filteredViolations[index].id),
                            ),
                          );
                        },
                      )
                      ),
                    );
                  },
                  separatorBuilder: (BuildContext context, int index) {
                    return Divider(color: Colors.grey[350]);
                  },
                  itemCount: filteredViolations.length, // Number of filtered violations
                ),
        ),
      ),
    );
  }
}