import 'dart:ffi'; 
import 'package:board_datetime_picker/board_datetime_picker.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/services/Violations_database.dart';
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

  DateTime selectDate = DateTime.now(); // Selected date for filtering
  bool isFiltered = false; // Track if the filter is applied

  @override
  void initState() {
    super.initState();
    fetchViolations(); // Fetch violations on initial load
  }

  Future<void> fetchViolations({DateTime? filterDate}) async {
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('te2')
          .where('DriverID', isEqualTo: widget.driverId)
          .get();

      setState(() {
        violations = snapshot.docs;
        // If filterDate is provided, filter violations based on that date
        if (filterDate != null) {
          filteredViolations = violations.where((doc) {
            Violation violation = Violation.fromJson(doc);
            return violation.getFormattedDate().split(' ')[0] ==
                filterDate.toString().split(' ')[0];
          }).toList();
          isFiltered = true; // Mark that the filter is applied
        } else {
          filteredViolations = violations; // If no date filter, show all violations
          isFiltered = false; // Mark that the filter is removed
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
        selectDate = result; // Update the selected date
      });
      fetchViolations(filterDate: selectDate); // Fetch and filter violations by the selected date
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
                onPressed: _chooseDate, // Use the modified chooseDate method
                icon: const Icon(
                  HugeIcons.strokeRoundedFilter, // Date picker icon
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
          padding: const EdgeInsets.symmetric(vertical: 5),
          child: filteredViolations.isEmpty
              ? Center(
                  child: Text(
                    "No violations found for this date.",
                    style: GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                )
              : ListView.separated(
                  itemBuilder: (BuildContext context, int index) {
                    if (index >= filteredViolations.length) return Container(); // Safeguard

                    // Convert the DocumentSnapshot to Violation
                    Violation violation = Violation.fromJson(filteredViolations[index]);

                    // Get the formatted date
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
                            'V#${violation.id}', // From DB
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF211D1D),
                            ),
                          ),
                          subtitle: Text(
                            formattedDate,
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              color: Color(0xFF211D1D),
                            ),
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
                        ),
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