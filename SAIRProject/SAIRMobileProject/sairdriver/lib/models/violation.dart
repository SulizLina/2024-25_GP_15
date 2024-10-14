// ignore_for_file: camel_case_types, non_constant_identifier_names

import 'package:cloud_firestore/cloud_firestore.dart';

class Violation {
  String? id; // Violation ID
  String? driverId;
  String? gspNumber;
  int? Maxspeed; // Maximum speed limit
  String? location; // Address as a string
  GeoPoint? position; // GeoPoint for latitude and longitude
  int? price; // Price associated with the violation
  int? speed; // Motorcycle speed
  int? time; // Time in seconds or some unit
  Timestamp? dateTime; // Date and time of the violation

  Violation({
    required this.id,
    required this.driverId,
    required this.gspNumber,
    required this.location,
    required this.position,
    required this.dateTime,
    required this.Maxspeed,
    required this.speed,
    required this.price,
    required this.time,
  });

  // Factory constructor to create a Violation from Firestore document
  factory Violation.fromJson(DocumentSnapshot document) {
    String id = document.id;
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Violation(
      id: id,
      driverId: parsedJSON['DriverID'].toString(),
      gspNumber: parsedJSON['GPSnumber'].toString(),
      location: parsedJSON['location'] as String?, // Address as string
      position: parsedJSON['position'] != null
          ? GeoPoint(
              parsedJSON['position']['y'], // Latitude
              parsedJSON['position']['x'], // Longitude
            )
          : null,
      dateTime: parsedJSON['Rimestamp'] as Timestamp?, /////////////
      speed: parsedJSON['speed'] as int?,
      Maxspeed: parsedJSON['MaxSpeed'] as int?, 
      price: parsedJSON['price'] as int?,
      time: parsedJSON['time'] as int?, // Time field
    );
  }
}