// ignore_for_file: camel_case_types, non_constant_identifier_names

import 'package:cloud_firestore/cloud_firestore.dart';

class Violation {
  String? id;
  String? driverId;
  String? gspNumber;
  GeoPoint? location;
  Timestamp? dateTime;
  int? speed;
  int? limit;

  Violation({
    required this.id,
    required this.driverId,
    required this.gspNumber,
    required this.location,
    required this.dateTime,
    required this.speed,
    required this.limit,
  });

  factory Violation.fromJson(DocumentSnapshot document) {
    String id = document.id;
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Violation(
      id: id,
      driverId: parsedJSON['DriverID'].toString(),
      gspNumber: parsedJSON['GSPNUMBER'].toString(),
      location: GeoPoint(
        parsedJSON['Location'].latitude,
        parsedJSON['Location'].longitude,
      ),
      dateTime: parsedJSON['DateTime'] as Timestamp?,
      speed: parsedJSON['Speed'] as int?,
      limit: parsedJSON['Limit'] as int?,
    );
  }
}