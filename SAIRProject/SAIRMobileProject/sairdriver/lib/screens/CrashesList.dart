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

class _CrasheslistState extends State<Crasheslist> {
  List<DocumentSnapshot> crashes = [];
  List<String> plateN = [];
  String? selectedPlate;
  List<bool> isHoveredList = [];
  driver? driverNat_Res;
  DateTime selectDate = DateTime.now();
  bool isDateFiltered = false;
  bool isPlateFiltered = false;
  bool _isLoading = true;
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
    bool hasPending = crashes.any((doc) {
      Crash crash = Crash.fromJson(doc);
      return crash.status == 'pending';
    });

    if (hasPending) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        showPendingCrashDialog();
      });
    }
  }

  void showPendingCrashDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        _timer = Timer(Duration(minutes: 10), () {
          updateCrashStatus('confirmed');
          Navigator.of(context).pop();
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
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        'Reject',
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
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
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
            ),
          ),
        );
      },
    );
  }

  Future<void> updateCrashStatus(String newStatus) async {
    List<DocumentSnapshot> pendingCrashes = crashes.where((doc) {
      Crash crash = Crash.fromJson(doc);
      return crash.status == 'pending';
    }).toList();

    if (pendingCrashes.isNotEmpty) {
      String crashId = pendingCrashes.first.id;
      await FirebaseFirestore.instance
          .collection('Crash')
          .doc(crashId)
          .update({'Status': newStatus});
      fetchCrash();
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

  @override
  void initState() {
    super.initState();
    fetchDriverData();
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
                    fontSize: 24.0,
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
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          color: Color(0xFFF3F3F3),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        child: StreamBuilder<QuerySnapshot>(
          stream: fetchVCrashStream(),
          builder: (context, snapshot) {
            if (_isLoading ||
                snapshot.connectionState == ConnectionState.waiting) {
              return Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return Center(child: Text("Error loading crashes"));
            }

            if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
              return Center(
                child: Text(
                  "You don't have any crashes,\nride safe :)",
                  style: GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
              );
            }

            final filteredList = snapshot.data!.docs.where((doc) {
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
                  isDateFiltered || isPlateFiltered
                      ? "You don't have any crashes\nfor the selected date."
                      : "You don't have any crashes,\nride safe :)",
                  style: GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
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

                String licensePlate = licensePlateMap[crash.cid] ?? "Unknown";

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
                    margin:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    color: Colors.white,
                    elevation: 4,
                    child: ListTile(
                      leading: Container(
                        decoration: BoxDecoration(
                          color: crash.status == 'pending'
                              ? Colors.yellow
                              : (crash.status == 'confirmed'
                                  ? Colors.green
                                  : Colors.red),
                          shape: BoxShape.circle,
                        ),
                        width: 10,
                        height: 10,
                      ),
                      title: Text(
                        "Crash ID: ${crash.cid}",
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            crash.getFormattedDate(),
                            style: GoogleFonts.poppins(color: Colors.grey),
                          ),
                          Text(
                            "License Plate: $licensePlate",
                            style: GoogleFonts.poppins(color: Colors.grey),
                          ),
                        ],
                      ),
                      trailing: Icon(Icons.chevron_right, color: Colors.grey),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}