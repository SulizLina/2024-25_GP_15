import 'dart:convert';

import 'package:board_datetime_picker/board_datetime_picker.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:sairdriver/main.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/services/driver_database.dart';
import 'package:sairdriver/models/motorcycle.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/ViolationDetail.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:http/http.dart' as http;

class Violationslist extends StatefulWidget {
  late FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();
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
    requestPermisstion();
    getToken();
    initInfo();
    fetchDriverData();
  }

  Future<void> initInfo() async {
    var androidInitialize =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    var iOSInitialize = DarwinInitializationSettings();

    var initializationSettings = InitializationSettings(
      android: androidInitialize,
      iOS: iOSInitialize,
    );

    await flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) async {
        try {
          // Handle the notification response
          if (response.payload != null && response.payload!.isNotEmpty) {
            Navigator.push(context,
                MaterialPageRoute(builder: (BuildContext context) {
              return Violationslist(driverId: widget.driverId);
            }));
          } else {
            // Handle the case where there is no payload
          }
        } catch (e) {}
      },
    );
    FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
      print("...............onMessage................");
      print(
          "onMessage: ${message.notification?.title}/${message.notification?.body}");

      // Create the BigTextStyleInformation
      BigTextStyleInformation bigTextStyleInformation = BigTextStyleInformation(
        message.notification!.body.toString(),
        htmlFormatBigText: true,
        contentTitle: message.notification!.title.toString(),
        htmlFormatContentTitle: true,
      );
      // Create AndroidNotificationDetails
      AndroidNotificationDetails androidPlatformChannelSpecifics =
          AndroidNotificationDetails(
        'dbfood', // Channel ID
        'dbfood', // Channel name
        importance: Importance.high,
        priority: Priority.high,
        playSound: false,
        styleInformation: bigTextStyleInformation,
      );

      // Create NotificationDetails
      NotificationDetails platformChannelSpecifics = NotificationDetails(
        android: androidPlatformChannelSpecifics,
      );
      await flutterLocalNotificationsPlugin.show(0, message.notification?.title,
          message.notification?.body, platformChannelSpecifics,
          payload: message.data['body']);
    });
  }

  void getToken() async {
    await FirebaseMessaging.instance.getToken().then((token) {
      setState(() {
        mtoken = token;
        print("My token is $mtoken");
      });
    });
  }

  void saveToken(String token) async {
    await FirebaseFirestore.instance
        .collection("UserTokens")
        .doc("User1")
        .set({'token': token});
  }

  void requestPermisstion() async {
    FirebaseMessaging messaging = FirebaseMessaging.instance;

    NotificationSettings settings = await messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print("User granted permission");
    } else if (settings.authorizationStatus ==
        AuthorizationStatus.provisional) {
      print("User granted provisional permission");
    } else {
      print("User declined permission");
    }
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

  Map<String, String?> licensePlateMap = {};
  Future<String> _getAccessToken() async {
    // Implement the logic to fetch the access token from your service account
    // This could involve making a separate API call or using a library like google_auth_library
    return '802d6231a58cab3b144e9f8e25faca4bc1f58148';
  }

  Future<void> sendPushMessage(String token, String body, String title) async {
    final String accessToken =
        await _getAccessToken(); // Fetch the access token dynamically

    try {
      await http.post(
        Uri.parse(
            'https://fcm.googleapis.com/v1/projects/sair-7310d/messages:send'),
        headers: <String, String>{
          'Contenct-Type': 'application/json',
          'Authorization':
              'Bearer $accessToken' // server key chnage it & new Doc
        },
        body: jsonEncode(
          <String, dynamic>{
            'priority': 'high',
            'data': <String, dynamic>{
              'click_action': 'FLUTTER_NOTIFICATION_CLICK',
              'status': 'done',
              'body': body,
              'title': title,
            },
            "notification": <String, dynamic>{
              "title": title,
              "body": body,
              "android_channel_id": "dbfood"
            },
            "to": token,
          },
        ),
      );
    } catch (kDebugMode) {
      print("Error push notification");
    }
  }

  Future<void> fetchViolations({DateTime? filterDate}) async {
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Violation')
          .where('driverID', isEqualTo: driverNat_Res?.driverId)
          .get();

      List<Future<void>> fetchTasks = snapshot.docs.map((doc) async {
        Violation violation = Violation.fromJson(doc);
        if (violation.newV != null && violation.newV == true) {
          DocumentSnapshot snap = await FirebaseFirestore.instance
              .collection("UserTokens")
              .doc(widget.driverId)
              .get();
          String Token = snap['token'];
          print(Token);

          sendPushMessage(
              Token, "You got a new violation!", "A New Violation Detected");
          /*  noti.Notification.showBigTextNotification(
              title: "A New Violation Detected",
              body: "You got a new violation!",
              fln: flutterLocalNotificationsPlugin);*/
          await FirebaseFirestore.instance
              .collection('Violation')
              .doc(widget.driverId)
              .update({
            'new': false,
          });
        }
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

        violations = snapshot.docs;

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

              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return Center(
                  child: Text(
                    isDateFiltered || isPlateFiltered
                        ? "You don't have any violations\nfor the selected date."
                        : "You don't have any violations,\nride safe :)",
                    style:
                        GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
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

              isHoveredList =
                  List.generate(filteredList.length, (index) => false);

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

              return ListView.builder(
                itemBuilder: (BuildContext context, int index) {
                  if (index >= filteredList.length) return Container();

                  Violation violation = Violation.fromJson(filteredList[index]);
                  String formattedDate = violation.getFormattedDate();

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
                              style: GoogleFonts.poppins(color: Colors.grey),
                            ),
                            Text(
                              'Licence Plate: ${licensePlateMap[violation.Vid] ?? ""}',
                              style: GoogleFonts.poppins(color: Colors.grey),
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
      ),
    );
  }
}
