// ignore_for_file: camel_case_types, non_constant_identifier_names

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class Violation {
  String? Vid; // Violation ID
  String? driverId;
  String? gspNumber;
  int? Maxspeed; // Maximum speed limit
  String? location; // Address as a string
  GeoPoint? position; // GeoPoint for latitude and longitude
  int? price; // Price associated with the violation
  int? speed; // Motorcycle speed
  int? time; // Time and date
  bool? newV;
  bool? isAuto;
  int? count30;
  int? count50;
  Violation(
      {required this.Vid,
      required this.driverId,
      required this.gspNumber,
      required this.location,
      required this.position,
    required this.isAuto,
      required this.Maxspeed,
      required this.speed,
      required this.price,
      required this.time,
      required this.count50,
       required this.count30, 
      required this.newV});

  // Function to convert GPS timestamp to readable DateTime format
  // Function to get formatted date
  String getFormattedDate() {
    if (time == null) return 'N/A'; // Return N/A if time is not set
    DateTime dateTime = DateTime.fromMillisecondsSinceEpoch(time! * 1000);
    return DateFormat('yyyy-MM-dd').format(dateTime); // Only date
  }

  // Function to get formatted time
  String getFormattedTimeOnly() {
    if (time == null) return 'N/A';
    DateTime dateTime = DateTime.fromMillisecondsSinceEpoch(time! * 1000);
    return DateFormat('HH:mm:ss').format(dateTime); // Only time
  }

  // Factory constructor to create a Violation from Firestore document
  factory Violation.fromJson(DocumentSnapshot document) {
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Violation(
      Vid: parsedJSON['violationID'].toString(),
      driverId: parsedJSON['driverID'].toString(),
      gspNumber: parsedJSON['GPSnumber'].toString(),
      location: parsedJSON['location'] as String?, // Address as string
      position: parsedJSON['position'] != null
          ? GeoPoint(
              parsedJSON['position']['latitude'], // Latitude
              parsedJSON['position']['longitude'], // Longitude
            )
          : null,
      speed: parsedJSON['driverSpeed'] as int?,
      Maxspeed: parsedJSON['streetMaxSpeed'] as int?,
      price: parsedJSON['price'] as int?,
      time: parsedJSON['time'] as int?,
      count30: parsedJSON['count30'] as int?,
      count50: parsedJSON['count50'] as int?,
      newV: parsedJSON['newV'] as bool?,
      isAuto: parsedJSON['isAuto'] as bool?,
    );
  }
}
