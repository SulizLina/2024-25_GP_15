import 'package:board_datetime_picker/board_datetime_picker.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:sairdriver/models/crash.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/models/motorcycle.dart';
import 'package:sairdriver/screens/ViolationDetail.dart';
import 'package:sairdriver/services/driver_database.dart';
class Crasheslist extends StatefulWidget {
  final String driverId;
  const Crasheslist({super.key, required this.driverId});

  @override
  State<Crasheslist> createState() => _CrasheslistState();
}

class _CrasheslistState extends State<Crasheslist> {
  List<DocumentSnapshot> crashes = [];
  List<DocumentSnapshot> filteredCrashes = [];
  List<String> plateN = [];
  String? selectedPlate;
  List<bool> isHoveredList = [];
  driver? driverNat_Res;
  DateTime selectDate = DateTime.now();
  bool isDateFiltered = false;
  bool isPlateFiltered = false;
  bool _isLoading = true;

  Map<String, String?> licensePlateMap = {};

  Future<void> fetchDriverData() async {
    DriverDatabase dbD = DriverDatabase();
    driverNat_Res = await dbD.getDriversnById(widget.driverId);

    if (driverNat_Res != null) {
      setState(() {
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> fetchCrash({DateTime? filterDate}) async {
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

      setState(() {
        plateN = ["Reset", ...{...plateN}].toSet().toList();
        crashes = snapshot.docs;
        applyFilters();
        _isLoading = false;
      });
    } catch (e) {
      print("Error fetching crashes: $e");
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
      Motorcycle motorcycle = Motorcycle.fromDocument(motorcycleSnapshot.docs.first);
      return motorcycle.licensePlate;
    }
    return null;
  }

  void applyFilters() {
    setState(() {
      filteredCrashes = crashes.where((doc) {
        Crash crash = Crash.fromJson(doc);
        bool dateMatch = isDateFiltered
            ? crash.getFormattedDate().split(' ')[0] == selectDate.toString().split(' ')[0]
            : true;
        bool plateMatch = selectedPlate == null
            ? true
            : licensePlateMap[crash.cid] == selectedPlate;
        return dateMatch && plateMatch;
      }).toList();
    });
  }

  @override
  void initState() {
    super.initState();
    fetchDriverData().then((_) => fetchCrash());
  }

  // Choose date using the date picker
  void _chooseDate() async {
    if (isDateFiltered) {
      setState(() {
        selectDate = DateTime.now();
        isDateFiltered = false;
      });
    } else {
      final result = await showBoardDateTimePicker(
        context: context,
        pickerType: DateTimePickerType.date,
        initialDate: selectDate,
        options: BoardDateTimeOptions(
          languages: BoardPickerLanguages(today: 'Today', tomorrow: '', now: 'now'),
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
    applyFilters();
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
                        "My Crashes",
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
            // Car icon that opens the dropdown
            DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                icon: Padding(
                  padding: const EdgeInsets.only(
                      top: 5.0), // Adjust the top padding as needed
                  child: ColorFiltered(
                    colorFilter: ColorFilter.mode(
                      Colors.white,
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
                onChanged: (String? newValue) {
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
                  fetchCrash(
                    filterDate: isDateFiltered ? selectDate : null,
                  );
                },
              ),
            ),
            // Calendar icon button
            IconButton(
              onPressed: () {
                _chooseDate();
              },
              icon: Icon(
                isDateFiltered
                    ? HugeIcons.strokeRoundedCalendarRemove02
                    : HugeIcons.strokeRoundedCalendar03,
                size: 24,
                color: Color(0xFFF3F3F3),
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
            stream: fetchVCrashStream(),
            builder: (context, snapshot) {
              if (_isLoading) {
                return Center(child: CircularProgressIndicator());
              }

              if (snapshot.connectionState == ConnectionState.waiting) {
                return Center(child: CircularProgressIndicator());
              }

              if (snapshot.hasError) {
                return Center(child: Text("Error loading crashes"));
              }

              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return Center(
                  child: Text(
                    isDateFiltered || isPlateFiltered
                        ? "You don't have any crashes\nfor the selected date."
                        : "You don't have any crashes,\nride safe :)",
                    style:
                        GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                );
              }

              final violations = snapshot.data!.docs;
              final filteredList = violations.where((doc) {
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

              isHoveredList =
                  List.generate(filteredList.length, (index) => false);

              if (filteredList.isEmpty) {
                return Center(
                  child: Text(
                    "No crashes found for the selected date.",
                    style:
                        GoogleFonts.poppins(fontSize: 18, color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                );
              }

              return ListView.separated(
                itemBuilder: (BuildContext context, int index) {
                  if (index >= filteredList.length) return Container();

                  Crash crash = Crash.fromJson(filteredList[index]);
                  String formattedDate = crash.getFormattedDate();

                  return MouseRegion(
                    onEnter: (_) => setState(() => isHoveredList[index] = true),
                    onExit: (_) => setState(() => isHoveredList[index] = false),
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
                          'Crash ID: ${crash.cid}',
                          style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF211D1D)),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Date: $formattedDate',
                              style: GoogleFonts.poppins(
                                  fontSize: 14, color: Color(0xFF211D1D)),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Licence Plate: ${licensePlateMap[crash.cid] ?? ""}',
                              style: GoogleFonts.poppins(
                                  fontSize: 14, color: Color(0xFF211D1D)),
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
          ),
        ),
      ),
    );
  }
}