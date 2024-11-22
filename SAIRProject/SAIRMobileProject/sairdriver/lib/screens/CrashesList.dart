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
import 'package:flutter_countdown_timer/flutter_countdown_timer.dart';
import 'package:sairdriver/messages/success.dart';
import 'package:sairdriver/globals.dart';

class Crasheslist extends StatefulWidget {
  final Function(String crashId)? onCrashDetected;
  final String driverId;
  const Crasheslist({super.key, required this.driverId, this.onCrashDetected});

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
  DateTime selectDate = DateTime.now();
  bool isDateFiltered = false;
  bool isPlateFiltered = false;
  bool _isLoading = true;
  String selectedStatus = "All";
  late TabController _tabController;
  List<DocumentSnapshot> filteredCrashes = [];
  Map<String, String?> licensePlateMap = {};
  Timer? _timer; // Timer for auto-confirmation
  bool _isDialogShown =
      false; // To avoid redundant pop-ups caused by the StreamBuilder

  @override
  void initState() {
    super.initState();
    fetchDriverData();
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
  }

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

  void filterCrashes() {
    setState(() {
      filteredCrashes = crashes.where((doc) {
        Crash crash = Crash.fromJson(doc);

        bool statusMatch = selectedStatus == "All" ||
            crash.status?.toLowerCase() == selectedStatus.toLowerCase();
        bool dateMatch = isDateFiltered
            ? crash.getFormattedDate().split(' ')[0] ==
                selectDate.toString().split(' ')[0]
            : true;
        bool plateMatch = selectedPlate == null
            ? true
            : licensePlateMap[crash.cid] == selectedPlate;

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
                      crashes.isEmpty
                          ? const Color(0xFFB3B3B3) // list is empty
                          : (selectedPlate == null
                              ? const Color(0xFFF3F3F3) // no plate selected
                              : Color(
                                  0xFFFF9E00)), //  plate is selected (traffic yellow)
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
                    ? const Color(0xFFB3B3B3) // List is empty
                    : isDateFiltered
                        ? const Color(0xFFFFC800) // No date selected
                        : Color(
                            0xFFF3F3F3), // Date is selected (traffic yellow)
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
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () {
                                setState(() {
                                  selectedStatus = "All";
                                  _tabController.index = 0;
                                });
                                filterCrashes();
                              },
                              child: Container(
                                padding: EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: selectedStatus == "All"
                                      ? Colors.white
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Text(
                                    'All',
                                    style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      fontWeight: selectedStatus == "All"
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
                                  selectedStatus = "Confirmed";
                                  _tabController.index = 1;
                                });
                                filterCrashes();
                              },
                              child: Container(
                                padding: EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: selectedStatus == "Confirmed"
                                      ? Colors.white
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Text(
                                    'Confirmed',
                                    style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      fontWeight: selectedStatus == "Confirmed"
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
                                  selectedStatus = "Rejected";
                                  _tabController.index = 2;
                                });
                                filterCrashes();
                              },
                              child: Container(
                                padding: EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: selectedStatus == "Rejected"
                                      ? Colors.white
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Text(
                                    'Rejected',
                                    style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      fontWeight: selectedStatus == "Rejected"
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
                  Expanded(
                    child: Container(
                      width: double.infinity,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 5),
                        child: StreamBuilder<QuerySnapshot>(
                          stream: FirebaseFirestore.instance
                              .collection('Crash')
                              .where('driverID',
                                  isEqualTo: driverNat_Res?.driverId)
                              .snapshots(),
                          builder: (context, snapshot) {
                            if (!snapshot.hasData) {
                              return const Center(
                                  child: CircularProgressIndicator());
                            }

                            final allCrashes = snapshot.data!.docs;
                            final crashDocs = snapshot.data!.docs;

                            // Filter for only pending crashes
                            final pendingCrashes = allCrashes.where((doc) {
                              Crash crash = Crash.fromJson(doc);
                              return crash.status?.toLowerCase() == 'pending';
                            }).toList();

                            //Show the popup for auto confirmed crashes

                            for (var doc in allCrashes) {
                              Crash crash = Crash.fromJson(doc);
                              if (crash.isAutoshown == true) {
                                WidgetsBinding.instance
                                    .addPostFrameCallback((_) {
                                  _showAutoConfirmationMessage(crash);
                                });
                              }
                            }

                            for (var crashDoc in crashDocs) {
                              Crash crash = Crash.fromJson(crashDoc);

                              // Check if crash is already processed
                              if (crash.cDocid != null &&
                                  processedCrashes.contains(crash.cDocid)) {
                                continue; // Skip already processed crashes
                              }

                              if (crash.cDocid != null) {
                                // Mark crash as processed
                                processedCrashes.add(crash.cDocid!);
                              }

                              // Perform other actions with the crash document
                              if (crash.status == 'Pending') {
                                WidgetsBinding.instance
                                    .addPostFrameCallback((_) {
                                  _showCrashDialog(crashDoc);
                                });
                              }
                            }
                            // Show the popup for pending crashes
                            if (pendingCrashes.isNotEmpty && !_isDialogShown) {
                              WidgetsBinding.instance.addPostFrameCallback((_) {
                                _showCrashDialog(pendingCrashes.first);
                              });
                            }

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

                              bool statusMatch = selectedStatus == "All" ||
                                  crash.status?.toLowerCase() ==
                                      selectedStatus.toLowerCase();
                              bool dateMatch = isDateFiltered
                                  ? crash.getFormattedDate().split(' ')[0] ==
                                      selectDate.toString().split(' ')[0]
                                  : true;
                              bool plateMatch = selectedPlate != null
                                  ? licensePlateMap[crash.cid] == selectedPlate
                                  : true;

                              return statusMatch && dateMatch && plateMatch;
                            }).toList();

                            // Sort filtered list by date (descending)
                            filteredList.sort((a, b) {
                              Crash crashA = Crash.fromJson(a);
                              Crash crashB = Crash.fromJson(b);
                              return crashB.time!.compareTo(
                                  crashA.time!); // Sort by time, descending
                            });

                            // If the crashes list is empty, and no plate number for this crash
                            if (filteredList.isEmpty) {
                              if (selectedPlate != null) {
                                return Center(
                                  child: Text(
                                    "You don't have any crash for the selected plate number.",
                                    style: GoogleFonts.poppins(
                                        fontSize: 20, color: Colors.grey),
                                    textAlign: TextAlign.center,
                                  ),
                                );
                              }

                              return Center(
                                child: Text(
                                  isDateFiltered
                                      ? "You don't have any crashes\nfor the selected date."
                                      : selectedStatus == "All"
                                          ? "You don't have any crash,\nride safe :)"
                                          : "You don't have any\n${selectedStatus.toLowerCase()} crash",
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
                                  return SizedBox(height: 0);
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
                                          crashId: filteredList[index - 1].id,
                                          driverid: widget.driverId,
                                        ),
                                      ),
                                    );
                                  },
                                  child: Card(
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(15),
                                    ),
                                    margin: const EdgeInsets.symmetric(
                                        horizontal: 10, vertical: 5),
                                    color: crash.isAuto == true
                                        ? Colors.lightGreen[100]
                                        : Colors.white,
                                    elevation: 2,
                                    child: ListTile(
                                      leading: SizedBox(
                                        width: 24,
                                        child: Container(
                                          decoration: BoxDecoration(
                                            color: crash.status
                                                        ?.toLowerCase() ==
                                                    'pending'
                                                ? Color(
                                                    0xFFFFC800) // traffic yellow
                                                : (crash.status
                                                            ?.toLowerCase() ==
                                                        'confirmed'
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
  
  void _showCrashDialog(DocumentSnapshot crashDoc) {
    if (_isDialogShown) return; // Prevent multiple dialogs
    _isDialogShown = true;

    Crash crash = Crash.fromJson(crashDoc);

    // Parse the time string (crash.getFormattedTimeOnly() is in "HH:MM:SS" format)
    List<String> timeParts = crash.getFormattedTimeOnly().split(':');
    int hours = int.parse(timeParts[0]);
    int minutes = int.parse(timeParts[1]);
    int seconds = int.parse(timeParts[2]);

    // Get the crash date (formatted as yyyy-MM-dd)
    DateTime crashDate = DateTime.parse(crash.getFormattedDate());
    DateTime crashDateTime = DateTime(
      crashDate.year,
      crashDate.month,
      crashDate.day,
      hours,
      minutes,
      seconds,
    );

    // Calculate the end time (5 minutes after the crash time)
    DateTime endDateTime = crashDateTime.add(Duration(minutes: 5));
    int remainingTime = endDateTime.difference(DateTime.now()).inSeconds;

    if (remainingTime <= 0) {
      print("Remaining time is zero or negative. Auto-confirming.");
      remainingTime = 0; // Prevent negative values
    } else {
      print("Remaining time: $remainingTime seconds");
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Center(
                child: Text(
                  "You had a crash?",
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color.fromARGB(202, 3, 152, 85),
                  ),
                ),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Please confirm or reject the crash. You have 5 minutes to respond before it will be automatically confirmed.',
                    style: GoogleFonts.poppins(fontSize: 16),
                  ),
                  SizedBox(height: 20),
                  CountdownTimer(
                    endTime: DateTime.now().millisecondsSinceEpoch +
                        remainingTime * 1000,
                    onEnd: () async {
                      Navigator.of(context).pop();
                      _isDialogShown = false;

                      // Check crash status and update only if not confirmed
                      await FirebaseFirestore.instance
                          .collection('Crash')
                          .doc(crashDoc.id)
                          .update({
                        'Status': 'Confirmed',
                        'isAuto': true,
                        'isAutoshown': true,
                      });
                    },
                    widgetBuilder: (_, time) {
                      if (time == null) {
                        return Center(
                          child: Text(
                            "Time's up! Crash status is automatically confirming...",
                            style: GoogleFonts.poppins(color: Colors.red),
                          ),
                        );
                      }
                      return Text(
                        "Time remaining: ${time.min ?? '0'}m:${time.sec}s",
                        style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
                      );
                    },
                  ),
                ],
              ),
              actions: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    TextButton(
                      onPressed: () async {
                        Navigator.of(context).pop(); // Dismiss the dialog
                        _isDialogShown = false; // Reset the flag

                        _updateCrashStatus(crashDoc.id, "Rejected");
                        SuccessMessageDialog.show(
                          context,
                          'The crash with ID:${crash.cid!} has been rejected successfully!',
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        '  Reject  ',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                        ),
                      ),
                    ),
                    SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: () async {
                        _updateCrashStatus(crashDoc.id, "Confirmed");
                        Navigator.of(context).pop(); // Dismiss the dialog
                        _isDialogShown = false; // Reset the flag

                        await SuccessMessageDialog.show(
                          context,
                          "The crash with ID:${crash.cid} has been confirmed.",
                          () {
                            _isDialogShown =
                                false; // Ensure the flag is reset here as well
                          },
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color.fromARGB(255, 3, 152, 85),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        'Confirm',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showAutoConfirmationMessage(Crash crash) async {
    await SuccessMessageDialog.show(
      context,
      "The crash with ID:${crash.cid} has been automatically confirmed due to no action being taken within the allotted 5-minute timeframe.\n\nPlease wait, you will receive a call from your delivery company or the concerned authorities.",
      () {
        _isDialogShown = false;
      },
    ).then((_) {
      // This runs after the dialog is closed
      FirebaseFirestore.instance.collection('Crash').doc(crash.cDocid).update({
        'isAutoshown': FieldValue.delete(),
      });
    });
  }

  void _updateCrashStatus(String crashId, String status) {
    FirebaseFirestore.instance
        .collection('Crash')
        .doc(crashId)
        .update({'Status': status}).catchError((error) {
      print("Failed to update crash status: $error");
    });
  }
}
