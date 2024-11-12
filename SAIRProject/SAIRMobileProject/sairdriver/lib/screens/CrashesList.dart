import 'dart:async'; // Import for Timer
import 'package:board_datetime_picker/board_datetime_picker.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:sairdriver/models/crash.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/models/motorcycle.dart';
import 'package:sairdriver/screens/CrashDetail.dart';
import 'package:sairdriver/services/driver_database.dart';

class Crasheslist extends StatefulWidget {
  final String driverId;
  const Crasheslist({super.key, required this.driverId});

  @override
  State<Crasheslist> createState() => _CrasheslistState();
}

class _CrasheslistState extends State<Crasheslist>
    with SingleTickerProviderStateMixin {
  List<DocumentSnapshot> crashes = [];
  List<String> plateN = [];
  String? selectedPlate;
  List<bool> isHoveredList = [];
  driver? driverNat_Res;
  driver? driverA;
  bool _pendingPopupShown = false;
  DateTime selectDate = DateTime.now();
  bool isDateFiltered = false;
  bool isPlateFiltered = false;
  bool _isLoading = true;
  String selectedStatus = "All";
  late TabController _tabController;
  List<DocumentSnapshot> filteredCrashes = [];
  Map<String, String?> licensePlateMap = {};
  Timer? _timer; // Timer for auto-confirmation

  Future<void> fetchDriverData() async {
    try {
      DriverDatabase dbD = DriverDatabase();
      driverNat_Res = await dbD.getDriversnById(widget.driverId);
      if (driverNat_Res != null) {
        fetchCrash();
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      print("Error fetching driver data: $e");
      setState(() {
        _isLoading = false;
      });
    }
  }

  void checkForPendingCrashes(List<DocumentSnapshot> crashes) {
    // Only show the popup once if there is a pending crash
    bool hasPending = crashes.any((doc) {
      Crash crash = Crash.fromJson(doc);
      return crash.status == 'Pending';
    });

    if (hasPending && !_pendingPopupShown) {
      _pendingPopupShown = true; // Set flag to prevent multiple popups
      WidgetsBinding.instance.addPostFrameCallback((_) {
        showPendingCrashDialog();
      });
    }
  }

  Future<void> updateCrashStatus(String newStatus) async {
    DriverDatabase db = DriverDatabase();
    driverA = await db.getDriversnById(widget.driverId);

    List<DocumentSnapshot> pendingCrashes = crashes.where((doc) {
      Crash crash = Crash.fromJson(doc);
      return crash.status == 'pending' && crash.driverId == driverA?.id;
    }).toList();

    if (pendingCrashes.isNotEmpty) {
      String crashId = pendingCrashes.first.id;

      try {
        DocumentSnapshot crashDoc = await FirebaseFirestore.instance
            .collection('Crash')
            .doc(crashId)
            .get();

        if (crashDoc.exists) {
          await FirebaseFirestore.instance
              .collection('Crash')
              .doc(crashId)
              .update({'Status': newStatus});

          // Refresh the list immediately
          await fetchCrash();
        } else {
          print("Document with crashId $crashId not found.");
        }
      } catch (e) {
        print("Error updating crash status: $e");
      }
    } else {
      print("No pending crashes found for driverId: ${driverA?.id}");
    }
  }

  void showPendingCrashDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        _timer = Timer(Duration(minutes: 10), () {
          updateCrashStatus('confirmed');
          Navigator.of(context).pop();
          _pendingPopupShown = false;
        });

        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          child: Container(
            padding: EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  "You had a crash?",
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color.fromARGB(202, 3, 152, 85),
                  ),
                ),
                SizedBox(height: 20),
                Text(
                  'Please confirm or reject the crash. You have 10 minutes to respond before it will be automatically confirmed.',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ElevatedButton(
                      onPressed: () {
                        _timer?.cancel();
                        updateCrashStatus('rejected');
                        Navigator.of(context).pop();
                        setState(() {
                          _pendingPopupShown = false;
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        'reject',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                        ),
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        _timer?.cancel();
                        updateCrashStatus('confirmed');
                        Navigator.of(context).pop();
                        setState(() {
                          _pendingPopupShown = false;
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color.fromARGB(255, 3, 152, 85),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        'confirm',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> fetchCrash() async {
    setState(() {
      _isLoading = true;
    });

    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Crash')
          .where('driverID', isEqualTo: driverNat_Res?.driverId)
          .get();

      List<Future<void>> fetchTasks = snapshot.docs.map((doc) async {
        Crash crash = Crash.fromJson(doc);
        if (crash.gspNumber != null) {
          String? plate = await fetchLicensePlate(crash.gspNumber!);
          if (plate != null && crash.cid != null) {
            licensePlateMap[crash.cid!] = plate;
            plateN.add(plate);
          }
        }
      }).toList();

      await Future.wait(fetchTasks);
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

      setState(() {
        crashes = snapshot.docs;
        _isLoading = false;
      });
    } catch (e) {
      print("Error fetching crashes: $e");
      setState(() {
        _isLoading = false;
      });
    }
  }

  Stream<QuerySnapshot> fetchVCrashStream() {
    return FirebaseFirestore.instance
        .collection('Crash')
        .where('driverID', isEqualTo: driverNat_Res?.driverId)
        .snapshots();
  }

  Future<String?> fetchLicensePlate(String gspNumber) async {
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

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        setState(() {
          selectedStatus =
              ["All", "confirmed", "rejected"][_tabController.index];
        });
        filterCrashes();
      }
    });
    fetchDriverData();
  }

  void filterCrashes() {
    setState(() {
      filteredCrashes = crashes.where((doc) {
        Crash crash = Crash.fromJson(doc);

        bool statusMatch =
            selectedStatus == "All" || crash.status == selectedStatus;
        bool dateMatch = isDateFiltered
            ? crash.getFormattedDate().split(' ')[0] ==
                selectDate.toString().split(' ')[0]
            : true;
        bool plateMatch = selectedPlate == null
            ? true
            : licensePlateMap[crash.cid] == selectedPlate;

        // Debug logging to ensure filters are being applied as expected
        print('------------------________________-------------------');
        print(
            "Crash status: ${crash.status}, Selected status: $selectedStatus, Status match: $statusMatch");

        return statusMatch && dateMatch && plateMatch;
      }).toList();
    });
  }

  void _chooseDate() async {
    if (!isDateFiltered) {
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
    } else {
      setState(() {
        isDateFiltered = false;
        selectDate = DateTime.now();
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _timer?.cancel();
    super.dispose();
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
                child: Text(
                  "My Crashes",
                  style: GoogleFonts.poppins(
                    fontSize: 22,
                    color: Color(0xFFF3F3F3),
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.left,
                ),
              ),
            ),
            DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                icon: Padding(
                  padding: const EdgeInsets.only(top: 5.0),
                  child: ColorFiltered(
                    colorFilter: ColorFilter.mode(
                      plateN.isEmpty
                          ? const Color.fromARGB(255, 199, 199, 199)
                          : Colors.white,
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
                          selectedPlate = newValue == "Reset" ? null : newValue;
                          isPlateFiltered = selectedPlate != null;
                        });
                      },
              ),
            ),
            IconButton(
              onPressed: crashes.isEmpty ? null : _chooseDate,
              icon: Icon(
                isDateFiltered
                    ? HugeIcons.strokeRoundedCalendarRemove02
                    : HugeIcons.strokeRoundedCalendar03,
                size: 24,
                color: crashes.isEmpty
                    ? const Color.fromARGB(255, 199, 199, 199)
                    : Color(0xFFF3F3F3),
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
                      child: TabBar(
                        controller: _tabController,
                        labelColor: Colors.black,
                        unselectedLabelColor: Colors.black,
                        indicator: BoxDecoration(),
                        indicatorColor: Colors.transparent,
                        labelPadding: EdgeInsets.symmetric(vertical: 3),
                        padding: EdgeInsets.only(left: 3, right: 3),
                        tabs: [
                          Tab(
                            child: Container(
                              padding: EdgeInsets.symmetric(
                                  vertical: 2, horizontal: 12),
                              decoration: BoxDecoration(
                                color: _tabController.index == 0
                                    ? Colors.white
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Center(
                                  child: Text(
                                'All',
                                style: GoogleFonts.poppins(fontSize: 11.7),
                              )),
                            ),
                          ),
                          Tab(
                            child: Container(
                              padding: EdgeInsets.symmetric(
                                  vertical: 2, horizontal: 12),
                              decoration: BoxDecoration(
                                color: _tabController.index == 1
                                    ? Colors.white
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Center(
                                  child: Text(
                                'confirmed',
                                style: GoogleFonts.poppins(fontSize: 11.7),
                              )),
                            ),
                          ),
                          Tab(
                            child: Container(
                              padding: EdgeInsets.symmetric(
                                  vertical: 2, horizontal: 12),
                              decoration: BoxDecoration(
                                color: _tabController.index == 2
                                    ? Colors.white
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Center(
                                  child: Text(
                                'rejected',
                                style: GoogleFonts.poppins(fontSize: 11.7),
                              )),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: Container(
                      width: double.infinity,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 5),
                        child: StreamBuilder<QuerySnapshot>(
                          stream: fetchVCrashStream(),
                          builder: (context, snapshot) {
                            if (_isLoading ||
                                snapshot.connectionState ==
                                    ConnectionState.waiting) {
                              return Center(child: CircularProgressIndicator());
                            }

                            if (snapshot.hasError) {
                              return Center(
                                  child: Text("Error loading crashes"));
                            }

                            if (!snapshot.hasData ||
                                snapshot.data!.docs.isEmpty) {
                              return Center(
                                child: Text(
                                  "You don't have any crashes,\nride safe :)",
                                  style: GoogleFonts.poppins(
                                      fontSize: 20, color: Colors.grey),
                                  textAlign: TextAlign.center,
                                ),
                              );
                            }

                            final filteredList =
                                snapshot.data!.docs.where((doc) {
                              Crash crash = Crash.fromJson(doc);
                              bool dateMatch = isDateFiltered
                                  ? crash.getFormattedDate().split(' ')[0] ==
                                      selectDate.toString().split(' ')[0]
                                  : true;
                              bool plateMatch = selectedPlate != null
                                  ? licensePlateMap[crash.cid] == selectedPlate
                                  : true;

                              return dateMatch && plateMatch;
                            }).toList();

                            WidgetsBinding.instance.addPostFrameCallback((_) {
                              checkForPendingCrashes(filteredList);
                            });

                            if (filteredList.isEmpty) {
                              return Center(
                                child: Text(
                                  isDateFiltered // || isPlateFiltered
                                      ? "You don't have any crashes\nfor the selected date."
                                      : _tabController.index ==
                                              0 //&& !isDateFiltered
                                          ? "You don't have any crash,\nride safe :)"
                                          : "You don't have any ${[
                                              "Confirmed",
                                              "Rejected"
                                            ][_tabController.index - 1]} crash", // Updated message
                                  style: GoogleFonts.poppins(
                                      fontSize: 20, color: Colors.grey),
                                  textAlign: TextAlign.center,
                                ),
                              );
                            }

                            return ListView.builder(
                              itemCount: filteredList.length + 1,
                              itemBuilder: (context, index) {
                                if (index == 0) {
                                  return SizedBox(height: 10);
                                }

                                Crash crash =
                                    Crash.fromJson(filteredList[index - 1]);
                                isHoveredList.add(false);

                                String licensePlate =
                                    licensePlateMap[crash.cid] ?? "Unknown";
                                String d = crash.getFormattedDate();
                                return GestureDetector(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => Crashdetail(
                                            crashId:
                                                filteredList[index - 1].id),
                                      ),
                                    );
                                  },
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
                                        width: 25,
                                        child: Container(
                                          decoration: BoxDecoration(
                                            color: crash.status == 'Pending'
                                                ? Colors.orange
                                                : (crash.status == 'Confirmed'
                                                    ? Colors.green
                                                    : Colors.red),
                                            shape: BoxShape.circle,
                                          ),
                                          width: 10,
                                          height: 10,
                                        ),
                                      ),
                                      title: Text(
                                        "Crash ID: ${crash.cid}",
                                        style: GoogleFonts.poppins(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.black,
                                        ),
                                      ),
                                      subtitle: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            "Date: $d",
                                            style: GoogleFonts.poppins(
                                                color: Colors.grey),
                                          ),
                                          Text(
                                            "License Plate: $licensePlate",
                                            style: GoogleFonts.poppins(
                                                color: Colors.grey),
                                          ),
                                        ],
                                      ),
                                      trailing: Icon(
                                        HugeIcons
                                            .strokeRoundedInformationCircle,
                                        color: Color.fromARGB(202, 3, 152, 85),
                                        size: 20,
                                      ),
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
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
