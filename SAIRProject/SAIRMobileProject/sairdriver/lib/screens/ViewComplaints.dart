import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/messages/Warning.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/screens/ViolationsList.dart';
import 'package:sairdriver/services/crashstreambuilder.dart';
import 'package:sairdriver/services/driver_database.dart';
import 'package:sairdriver/models/motorcycle.dart';
import 'package:sairdriver/models/complaint.dart';
import 'package:sairdriver/screens/ComplaintDetail.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:board_datetime_picker/board_datetime_picker.dart';
import 'package:sairdriver/services/motorcycle_database.dart';
import 'package:rxdart/rxdart.dart';

class Viewcomplaints extends StatefulWidget {
  final String driverId; // DriverID passed from previous page
  const Viewcomplaints({required this.driverId});

  @override
  State<Viewcomplaints> createState() => _ViewcomplaintsState();
}

class _ViewcomplaintsState extends State<Viewcomplaints>
    with SingleTickerProviderStateMixin {
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
  String selectedStatus = "All";
  late TabController _tabController;
  List<DocumentSnapshot> filteredComplaints = [];
  Motorcycle? motorcycle;
  String? selectedReason;
  List<String> complaintsReasons = [];
  ValueNotifier<String?> selectedReasonNotifier = ValueNotifier<String?>(null);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        setState(() {
          selectedStatus =
              ["All", "Accepted", "Pending", "Rejected"][_tabController.index];
        });
        filterComplaints();
      }
    });
    fetchDriverData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
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
      await fetchComplaint();
    }
  }

  Stream<QuerySnapshot> fetchComplaintStream() {
    return FirebaseFirestore.instance
        .collection('Complaint')
        .where('driverID', isEqualTo: driverNat_Res?.driverId)
        .snapshots();
  }

  Stream<List<String>> fetchComplaintReasonsStream() {
    return FirebaseFirestore.instance
        .collection('Complaint')
        .where('driverID', isEqualTo: driverNat_Res?.driverId)
        .snapshots()
        .map((snapshot) {
      Set<String> reasonsSet = {};
      for (var doc in snapshot.docs) {
        Complaint complaint = Complaint.fromJson(doc);
        if (complaint.Reason != null) {
          reasonsSet.add(complaint.Reason!);
        }
      }
      return ['All', ...reasonsSet.toList()]; // Add 'All' as the first option
    });
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
        if (complaint.Vid != null) {
          String? plate = await fetchLicensePlate(complaint.Vid!);
          if (plate != null && complaint.Vid != null) {
            licensePlateMap[complaint.Vid!] = plate;
            plateN.add(plate);
          }
        }
      }).toList();

      await Future.wait(fetchTasks);
      Set<String> ReasonsSet = {};
      for (var doc in snapshot.docs) {
        Complaint complaint = Complaint.fromJson(doc);
        if (complaint.Reason != null) {
          ReasonsSet.add(complaint.Reason!); // Add non-null reason
        }
      }
      complaintsReasons = ['All', ...ReasonsSet.toList()];
      setState(() {
        if (plateN.isNotEmpty) {
          plateN = {
            "Reset",
            ...{...plateN}
          }.toList();
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
        _isLoading = false;
      });
    }
  }

  void filterComplaints() {
    setState(() {
      if (selectedReason == null) {
      // Handle the case where selected reason is null 'when driver edit/delete complint from filter'
      selectedReason = 'All'; // Reset to default value or handle as needed
    }
      filteredComplaints = complaints.where((doc) {
        Complaint complaint = Complaint.fromJson(doc);

        bool statusMatch =
            selectedStatus == "All" || complaint.Status == selectedStatus;
        bool dateMatch = isDateFiltered
            ? complaint.getFormattedDate().split(' ')[0] ==
                selectDate.toString().split(' ')[0]
            : true;
        bool plateMatch = selectedPlate == null
            ? true
            : licensePlateMap[complaint.Vid] == selectedPlate;
        bool reasonMatch = selectedReason == null ||
            selectedReason == 'All' ||
            complaint.Reason == selectedReason;

        return statusMatch && dateMatch && plateMatch && reasonMatch;
      }).toList();

      if (filteredComplaints.isEmpty && selectedReason == null) {
      selectedReason = 'All';
      filterComplaints(); // Re-run the filter with the updated selectedReason
    }
    });
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
                          ? const Color.fromARGB(
                              255, 199, 199, 199) //list is empty
                          : (selectedPlate == null
                              ? const Color(0xFFF3F3F3) // no plate selected
                              : Color(0xFFFFC800)),
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
                        fetchComplaint(
                          filterDate: isDateFiltered ? selectDate : null,
                        );
                      },
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
                    ? const Color.fromARGB(
                        255, 199, 199, 199) // complaint list is empty
                    : isDateFiltered
                        ? const Color(
                            0xFFFFC800) // Date is selected (traffic yellow)
                        : Color(0xFFF3F3F3), // No date selected
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Color(0xFFF3F3F3),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(30),
                  topRight: Radius.circular(30),
                ),
              ),
              child: Column(
                //mainAxisSize: MainAxisSize.min, //new
                children: [
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(vertical: 15, horizontal: 9),
                    child: Container(
                      width: MediaQuery.of(context).size.width,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () {
                                setState(() {
                                  _tabController.index = 0;
                                  selectedStatus = "All";
                                });
                              },
                              child: Container(
                                padding: EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: _tabController.index == 0
                                      ? Colors.white
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Text(
                                    'All',
                                    style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      fontWeight: _tabController.index == 0
                                          ? FontWeight.w600
                                          : FontWeight.normal,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: InkWell(
                              onTap: () {
                                setState(() {
                                  _tabController.index = 1;
                                  selectedStatus = "Accepted";
                                });
                              },
                              child: Container(
                                padding: EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: _tabController.index == 1
                                      ? Colors.white
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Text(
                                    'Accepted',
                                    style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      fontWeight: _tabController.index == 1
                                          ? FontWeight.w600
                                          : FontWeight.normal,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: InkWell(
                              onTap: () {
                                setState(() {
                                  _tabController.index = 2;
                                  selectedStatus = "Pending";
                                });
                              },
                              child: Container(
                                padding: EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: _tabController.index == 2
                                      ? Colors.white
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Text(
                                    'Pending',
                                    style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      fontWeight: _tabController.index == 2
                                          ? FontWeight.w600
                                          : FontWeight.normal,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: InkWell(
                              onTap: () {
                                setState(() {
                                  _tabController.index = 3;
                                  selectedStatus = "Rejected";
                                });
                              },
                              child: Container(
                                padding: EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: _tabController.index == 3
                                      ? Colors.white
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Text(
                                    'Rejected',
                                    style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      fontWeight: _tabController.index == 3
                                          ? FontWeight.w600
                                          : FontWeight.normal,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (filteredComplaint.isNotEmpty)
                    StreamBuilder<List<String>>(
                      stream: fetchComplaintReasonsStream(),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState ==
                            ConnectionState.waiting) {
                          return const CircularProgressIndicator();
                        }

                        if (snapshot.hasError) {
                          return Text('Error: ${snapshot.error}');
                        }

                        complaintsReasons = snapshot.data ?? [];

                        return Dropdown(
                          selectedReason: selectedReason,
                          reasons: complaintsReasons,
                          onChanged: (value) {
                            setState(() {
                              selectedReasonNotifier.value = value;
                              selectedReason = value;
                              filterComplaints();
                            });
                          },
                        );
                      },
                    ),
                  Expanded(
                    child: Container(
                      width: double.infinity,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 5),
                        child: StreamBuilder<QuerySnapshot>(
                          stream: fetchComplaintStream(),
                          builder: (context, snapshot) {
                            if (_isLoading ||
                                snapshot.connectionState ==
                                    ConnectionState.waiting) {
                              return const Center(
                                  child: CircularProgressIndicator());
                            }

                            if (snapshot.hasError) {
                              return const Center(
                                  child: Text("Error loading complaint"));
                            }

                            if (!snapshot.hasData ||
                                snapshot.data!.docs.isEmpty) {
                              return Center(
                                child: Text(
                                  isDateFiltered
                                      ? "You don't have any complaint\nfor the selected date."
                                      : _tabController.index == 0
                                          ? "You don't have any complaint,\nride safe :)"
                                          : "You don't have any ${[
                                              "Accepted",
                                              "Pending",
                                              "Rejected"
                                            ][_tabController.index - 1]} complaint",
                                  style: GoogleFonts.poppins(
                                      fontSize: 20, color: Colors.grey),
                                  textAlign: TextAlign.center,
                                ),
                              );
                            }

                            final complaints = snapshot.data!.docs;
                            final filteredList = complaints.where((doc) {
                              Complaint complaint = Complaint.fromJson(doc);

                              // Date match filter
                              bool dateMatch = isDateFiltered
                                  ? complaint
                                          .getFormattedDate()
                                          .split(' ')[0] ==
                                      selectDate.toString().split(' ')[0]
                                  : true;

                              // Plate match filter
                              bool plateMatch = selectedPlate != null
                                  ? licensePlateMap[complaint.Vid] ==
                                      selectedPlate
                                  : true;

                              // Status match filter (only apply if selected status is not "All")
                              bool statusMatch = selectedStatus == "All" ||
                                  complaint.Status == selectedStatus;

                              // Reason match filter
                              bool reasonMatch = selectedReason == null ||
                                  selectedReason == 'All' ||
                                  complaint.Reason == selectedReason;

                              return dateMatch &&
                                  plateMatch &&
                                  statusMatch &&
                                  reasonMatch;
                            }).toList();
                            // Sort filtered list by date (descending)
                            filteredList.sort((a, b) {
                              Complaint complaintA = Complaint.fromJson(a);
                              Complaint complaintB = Complaint.fromJson(b);
                              return complaintB.timestamp!.compareTo(complaintA
                                  .timestamp!); // Sort by time, descending
                            });
                            isHoveredList = List.generate(
                                filteredList.length, (index) => false);

                            // If the complaints list is empty, display the appropriate message based on filters
                            if (filteredList.isEmpty) {
                              return Center(
                                child: Text(
                                  selectedPlate != null && isDateFiltered
                                      ? "You don't have any${selectedStatus != 'All' ? ' ' + selectedStatus.toLowerCase() : ''}\n complaints for the selected date and plate number."
                                      : selectedPlate != null
                                          ? "You don't have any${selectedStatus != 'All' ? ' ' + selectedStatus.toLowerCase() : ''} \n complaints for the selected plate number."
                                          : isDateFiltered
                                              ? "You don't have any${selectedStatus != 'All' ? ' ' + selectedStatus.toLowerCase() : ''}\n complaints for the selected date."
                                              : selectedStatus == "All"
                                                  ? "You don't have any complaints,\nride safe :)"
                                                  : "You don't have any\n${selectedStatus.toLowerCase()} complaints",
                                  style: GoogleFonts.poppins(
                                      fontSize: 20, color: Colors.grey),
                                  textAlign: TextAlign.center,
                                ),
                              );
                            }

                            // Additional check for status and plate filters only
                            else if (selectedStatus != "All" &&
                                filteredList.isEmpty &&
                                selectedPlate != null) {
                              return Center(
                                child: Text(
                                  "You don't have any ${selectedStatus.toLowerCase()} complaints for the selected plate number.",
                                  style: GoogleFonts.poppins(
                                      fontSize: 20, color: Colors.grey),
                                  textAlign: TextAlign.center,
                                ),
                              );
                            }

                            return ListView.builder(
                              itemCount: filteredList.length,
                              itemBuilder: (BuildContext context, int index) {
                                Complaint complaint =
                                    Complaint.fromJson(filteredList[index]);
                                String formattedDate =
                                    complaint.getFormattedDate();

                                Color statusColor;
                                if (complaint.Status == 'Pending') {
                                  statusColor = const Color(
                                      0xFFFFC800); //traffic yellow color
                                } else if (complaint.Status == 'Accepted') {
                                  statusColor = Colors.green;
                                } else {
                                  statusColor = Colors.red;
                                }

                                return MouseRegion(
                                  onEnter: (_) => setState(
                                      () => isHoveredList[index] = true),
                                  onExit: (_) => setState(
                                      () => isHoveredList[index] = false),
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
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Date: $formattedDate',
                                            style: GoogleFonts.poppins(
                                                color: Colors.grey),
                                          ),
                                          Text(
                                            'Licence Plate: ${licensePlateMap[complaint.Vid] ?? ""}',
                                            style: GoogleFonts.poppins(
                                                color: Colors.grey),
                                          ),
                                          _buildSpeedLimitRow(
                                          'Reason:',
                                          '${complaint.Reason}',
                                        ),
                                        ],
                                      ),
                                      trailing: Icon(
                                        HugeIcons
                                            .strokeRoundedInformationCircle,
                                        color: Color.fromARGB(202, 3, 152, 85),
                                        size: 20,
                                      ),
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                Complaintdetail(
                                              ComplaintID:
                                                  filteredList[index].id,
                                              driverid: widget.driverId,
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                  //show crash dialog if needed
                  CrashStreamBuilder(driverId: widget.driverId),
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: StreamBuilder<bool>(
        stream: hasAnyViolationsStream(driverNat_Res?.driverId),
        builder: (context, hasViolationSnapshot) {
          // Show a loading indicator while waiting for the stream
          if (hasViolationSnapshot.connectionState == ConnectionState.waiting) {
            return FloatingActionButton(
              onPressed: null,
              backgroundColor: const Color.fromARGB(255, 199, 199, 199),
              shape: const CircleBorder(),
              child: const CircularProgressIndicator(color: Colors.white),
            );
          }

          final hasViolations = hasViolationSnapshot.data ?? false;

          // If no violations exist, show a button with the warning message
          if (!hasViolations) {
            return FloatingActionButton(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (context) => WarningDialog(
                    message:
                        "You don't have a violation to raise a complaint for it.",
                  ),
                );
              },
              backgroundColor: const Color.fromARGB(255, 199, 199, 199),
              shape: const CircleBorder(),
              child: const Icon(Icons.add, color: Colors.white),
            );
          }

          // If violations exist, use the existing StreamBuilder for filtering complaints
          return StreamBuilder<List<QueryDocumentSnapshot>>(
            stream: getComplaintsStream(driverNat_Res?.driverId),
            builder: (context, snapshot) {
              final hasEligibleViolations =
                  snapshot.hasData && snapshot.data!.isNotEmpty;

              return FloatingActionButton(
                onPressed: hasEligibleViolations
                    ? () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => Violationslist(
                              driverId: widget.driverId,
                              page: 'complaints',
                            ),
                          ),
                        );
                      }
                    : () {
                        showDialog(
                          context: context,
                          builder: (context) => WarningDialog(
                            message:
                                'You currently have no violations eligible for raising complaints. You can raise a complaint when:\n1. The violation is within the past 30 days.\n2. The violation does not already have a complaint.\n\nDrive safely!',
                          ),
                        );
                      },
                backgroundColor: hasEligibleViolations
                    ? const Color.fromARGB(202, 3, 152, 85)
                    : const Color.fromARGB(255, 199, 199, 199),
                shape: const CircleBorder(),
                child: const Icon(Icons.add, color: Colors.white),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildSpeedLimitRow(String bullet, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          bullet,
          style: GoogleFonts.poppins(
            color: Colors.grey,
            height: 1.5,
          ),
        ),
        const SizedBox(width: 8), // Space between bullet and text
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.poppins(
              color: Colors.grey,
              height: 1.5,
            ),
          ),
        ),
      ],
    );
  }
}

class Dropdown extends StatelessWidget {
  final String? selectedReason;
  final List<String> reasons;
  final Function(String?) onChanged;

  const Dropdown({
    Key? key,
    required this.selectedReason,
    required this.reasons,
    required this.onChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      child: DropdownButtonFormField2<String>(
        isExpanded: true,
        decoration: InputDecoration(
          contentPadding:
              const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderSide: const BorderSide(
              color: Colors.grey,
              width: 1.5,
            ),
            borderRadius: BorderRadius.circular(15),
          ),
          enabledBorder: OutlineInputBorder(
            borderSide: const BorderSide(
              color: Colors.grey,
              width: 1.5,
            ),
            borderRadius: BorderRadius.circular(15),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: const BorderSide(
              color: Colors.grey,
              width: 2.0,
            ),
            borderRadius: BorderRadius.circular(15),
          ),
        ),
        hint: Text(
          'Filter by complaint reason',
          style: GoogleFonts.poppins(
            fontSize: 14,
            color: Colors.black,
          ),
        ),
        items: reasons
            .map((reason) => DropdownMenuItem<String>(
                  value: reason,
                  child: Text(
                    reason,
                    style: const TextStyle(fontSize: 14),
                  ),
                ))
            .toList(),
        value: selectedReason,
        onChanged: (value) {
          onChanged(value); // Notify parent about the change
        },
        dropdownStyleData: DropdownStyleData(
          maxHeight: 200, // Limit dropdown height
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(15),
            color: Colors.white,
          ),
        ),
        menuItemStyleData: const MenuItemStyleData(
          padding: EdgeInsets.symmetric(horizontal: 16),
        ),
        iconStyleData: IconStyleData(
          icon: Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: Icon(
              Icons.arrow_drop_down,
              color: Colors.grey,
            ),
          ),
          iconSize: 24,
        ),
      ),
    );
  }
}

  Stream<bool> isButtonEnabledStream(String? driverId) {
  if (driverId == null) return Stream.value(false);

  final violationsStream = FirebaseFirestore.instance
      .collection('Violation')
      .where('driverID', isEqualTo: driverId)
      .snapshots();

  final complaintsStream = FirebaseFirestore.instance
      .collection('Complaint')
      .where('driverID', isEqualTo: driverId)
      .snapshots();

  return Rx.combineLatest2<QuerySnapshot, QuerySnapshot, bool>(
    violationsStream,
    complaintsStream,
    (violationsSnapshot, complaintsSnapshot) {
     final complaintViolationIds = complaintsSnapshot.docs
    .where((doc) {
      final data = doc.data() as Map<String, dynamic>;
      return data.containsKey('ViolationID');
    })
    .map((doc) {
      final data = doc.data() as Map<String, dynamic>;
      return data['ViolationID'] as String?;
    })
    .toSet();


      final hasEligibleViolations = violationsSnapshot.docs.any((violationDoc) {
        final violationId = violationDoc['violationID'] as String?;
        return violationId != null &&
            !complaintViolationIds.contains(violationId);
      });

      return hasEligibleViolations;
    },
  );
}


  Stream<bool> hasAnyViolationsStream(String? driverId) {
    if (driverId == null) {
      // Return a stream that immediately emits false
      return Stream.value(false);
    }

    return FirebaseFirestore.instance
        .collection('Violation')
        .where('driverID', isEqualTo: driverId)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.isNotEmpty); // Emit true if there are violations
  }

Stream<List<QueryDocumentSnapshot>> getComplaintsStream(String? driverId) {
  if (driverId == null) return Stream.value([]);

  final violationsStream = FirebaseFirestore.instance
      .collection('Violation')
      .where('driverID', isEqualTo: driverId)
      .snapshots();

  final complaintsStream = FirebaseFirestore.instance
      .collection('Complaint')
      .where('driverID', isEqualTo: driverId)
      .snapshots();

  final now = DateTime.now();

  return Rx.combineLatest2<QuerySnapshot, QuerySnapshot,
      List<QueryDocumentSnapshot>>(
    violationsStream,
    complaintsStream,
    (violationsSnapshot, complaintsSnapshot) {
     final complaintViolationIds = complaintsSnapshot.docs
    .where((doc) {
      final data = doc.data() as Map<String, dynamic>;
      return data.containsKey('ViolationID');
    })
    .map((doc) {
      final data = doc.data() as Map<String, dynamic>;
      return data['ViolationID'] as String?;
    })
    .toSet();

      final filteredViolations = violationsSnapshot.docs.where((violationDoc) {
        final violationId = violationDoc['violationID'] as String?;

        final timeField = violationDoc['time'];
        final violationDate = timeField is String
            ? DateTime.parse(timeField)
            : DateTime.fromMillisecondsSinceEpoch(
                (timeField as int) * 1000,
              );

        final isOlderThan30Days =
            violationDate.isBefore(now.subtract(const Duration(days: 30)));

        return violationId != null &&
            !isOlderThan30Days &&
            !complaintViolationIds.contains(violationId);
      }).toList();

      // Debug: Print filtered violations
      print(
          "Filtered Violations: ${filteredViolations.map((doc) => doc.id).toList()}");

      return filteredViolations;
    },
  );
}