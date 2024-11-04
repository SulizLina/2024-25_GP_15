import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/services/driver_database.dart';
import 'package:sairdriver/models/motorcycle.dart';
import 'package:sairdriver/services/motorcycle_database.dart';
import 'package:sairdriver/models/complaint.dart';
import 'package:sairdriver/services/Complaint_database.dart';
import 'package:sairdriver/screens/ComplaintDetail.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:board_datetime_picker/board_datetime_picker.dart';

class Viewcomplaints extends StatefulWidget {
  final String driverId; // DriverID passed from previous page
  const Viewcomplaints({required this.driverId});

  @override
  State<Viewcomplaints> createState() => _ViewcomplaintsState();
}

class _ViewcomplaintsState extends State<Viewcomplaints> {
  List<DocumentSnapshot> complaints = []; // List to hold complaint documents
  List<DocumentSnapshot> filteredComplaint =
      []; // List for filtered complaint based on date
  List<bool> isHoveredList = [];
  List<String> plateN = [];
  String? selectedPlate;
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
      await fetchComplaint(); // Fetch complaints after driver data is ready
    }
  }

  Stream<QuerySnapshot> fetchComplaintStream() {
    return FirebaseFirestore.instance
        .collection('Complaint')
        .where('driverID', isEqualTo: driverNat_Res?.driverId)
        .snapshots();
  }

  Map<String, String?> licensePlateMap =
      {}; // Store license plates by complints ID

  Future<void> fetchComplaint({DateTime? filterDate}) async {
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Complaint')
          .where('driverID', isEqualTo: driverNat_Res?.driverId)
          .get();

      List<Future<void>> fetchTasks = snapshot.docs.map((doc) async {
        Complaint complaint = Complaint.fromJson(doc);
        if (complaint.gspNumber != null) {
          String? plate = await fetchLicensePlate(complaint.gspNumber!);
          if (plate != null && complaint.Vid != null) {
            licensePlateMap[complaint.Vid!] = plate;
            plateN.add(plate);
          }
        }
      }).toList();

      await Future.wait(fetchTasks);

      setState(() {
        // Only add "Reset" if there are plates available
        if (plateN.isNotEmpty) {
          plateN = [
            "Reset",
            ...{...plateN}
          ].toSet().toList();
        } else {
          plateN = []; // Empty list when no plates
        }

        if (!plateN.contains(selectedPlate)) {
          selectedPlate = null;
        }

        complaints = snapshot.docs;

        // Apply filters based on selectedPlate and filterDate
        filteredComplaint = complaints.where((doc) {
          Complaint complaint = Complaint.fromJson(doc);

          bool dateMatch = isDateFiltered
              ? complaint.getFormattedDate().split(' ')[0] ==
                  selectDate.toString().split(' ')[0]
              : true;

          bool plateMatch = selectedPlate == null
              ? true
              : licensePlateMap[complaint.Vid] == selectedPlate;

          return dateMatch && plateMatch;
        }).toList();

        isHoveredList =
            List.generate(filteredComplaint.length, (index) => false);
        _isLoading = false;
      });
    } catch (e) {
      print("Error fetching complaint: $e");
      setState(() {
        _isLoading = false; // Update loading state on error
      });
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
      backgroundColor: const Color.fromARGB(255, 3, 152, 85),
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
                        "My Complaints",
                        style: GoogleFonts.poppins(
                          fontSize: 24.0,
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
            // Filter by date
            IconButton(
              onPressed: complaints.isEmpty ? null : _chooseDate,
              icon: Icon(
                isDateFiltered
                    ? HugeIcons.strokeRoundedCalendarRemove02
                    : HugeIcons.strokeRoundedCalendar03,
                size: 24,
                color: complaints.isEmpty
                    ? const Color.fromARGB(255, 199, 199, 199)
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
          child: StreamBuilder<QuerySnapshot>(
            stream: fetchComplaintStream(),
            builder: (context, snapshot) {
              if (_isLoading) {
                return Center(child: CircularProgressIndicator());
              }

              if (snapshot.connectionState == ConnectionState.waiting) {
                return Center(child: CircularProgressIndicator());
              }

              if (snapshot.hasError) {
                return Center(child: Text("Error loading complaint"));
              }

              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return Center(
                  child: Text(
                    isDateFiltered || isPlateFiltered
                        ? "You don't have any complaint\nfor the selected date."
                        : "You don't have any complaint,\nride safe :)",
                    style:
                        GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                );
              }

              final complaint = snapshot.data!.docs;
              final filteredList = complaint.where((doc) {
                Complaint complaint = Complaint.fromJson(doc);

                bool dateMatch = isDateFiltered
                    ? complaint.getFormattedDate().split(' ')[0] ==
                        selectDate.toString().split(' ')[0]
                    : true;
                bool plateMatch = selectedPlate != null
                    ? licensePlateMap[complaint.Vid] == selectedPlate
                    : true;

                return dateMatch && plateMatch;
              }).toList();

              isHoveredList =
                  List.generate(filteredList.length, (index) => false);

              if (filteredList.isEmpty) {
                return Center(
                  child: Text(
                    "No complaint found for the selected date",
                    style:
                        GoogleFonts.poppins(fontSize: 18, color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                );
              }

              return ListView.builder(
                itemBuilder: (BuildContext context, int index) {
                  if (index >= filteredList.length) return Container();

                  Complaint complaint = Complaint.fromJson(filteredList[index]);
                  String formattedDate = complaint.getFormattedDate();

                  // Determine the color for the circle based on a specific field in the complaint
                  Color statusColor;
                  if (complaint.Status == 'pending') {
                    statusColor = Colors.orange;
                  } else if (complaint.Status == 'approved') {
                    statusColor = Colors.green;
                  } else {
                    statusColor = Colors.red;
                  }
                  return MouseRegion(
                    onEnter: (_) => setState(() => isHoveredList[index] = true),
                    onExit: (_) => setState(() => isHoveredList[index] = false),
                    child: Card(
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                      margin: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      color: Colors.white,
                      elevation: 2, 
                      child: ListTile(
                        leading: SizedBox(
                          width: 24,
                          child: Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: statusColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                        title: Text(
                          'Complaint ID: ${complaint.ComID}',
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
                              style: GoogleFonts.poppins(color: Colors.grey),
                            ),
                            const SizedBox(height: 4),
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
                              builder: (context) => Complaintdetail(
                                ComplaintID: filteredList[index].id ?? '',
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
      ),
    );
  }
}
