// ignore_for_file: camel_case_types, non_constant_identifier_names

import 'package:cloud_firestore/cloud_firestore.dart';

class Violation {
  String? id;
  String? driverId;
  String? gspNumber;
  GeoPoint? location;
  Timestamp? dateTime;
  String? Maxspeed;
  String? speed;
  String? price;

  Violation({
    required this.id,
    required this.driverId,
    required this.gspNumber,
    required this.location,
    required this.dateTime,
    required this.Maxspeed,
    required this.speed,
    required this.price,
  });

// Factory constructor to create a Violation from Firestore document
  factory Violation.fromJson(DocumentSnapshot document) {
    String id = document.id;
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Violation(
      id: id,
      driverId: parsedJSON['DriverID'].toString(),
      gspNumber: parsedJSON['GPSNumber'].toString(),
      location: parsedJSON['Location'] as GeoPoint?,
      dateTime: parsedJSON['DateTime'] as Timestamp?,
      speed: parsedJSON['Speed'] as String?,
      Maxspeed: parsedJSON['MaxSpeed'] as String?,
      price: parsedJSON['Price'] as String?,
    );
  }

}