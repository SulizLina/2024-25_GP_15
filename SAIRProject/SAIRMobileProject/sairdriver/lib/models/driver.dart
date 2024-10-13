// ignore_for_file: camel_case_types, non_constant_identifier_names

import 'package:cloud_firestore/cloud_firestore.dart';

class driver {
  String? id;
  String? driverId;
  String? gspNumber;
  String? fname;
  String? lname;
  String? phoneNumber;

  driver({
    required this.id,
    required this.driverId,
    required this.gspNumber,
    required this.fname,
    required this.lname,
    required this.phoneNumber,

  });

// Factory constructor to create a driver from Firestore document
  factory driver.fromJson(DocumentSnapshot document) {
    String id = document.id;
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return driver(
      id: id,
      driverId: parsedJSON['DriverID'].toString(),
      gspNumber: parsedJSON['GPSNumber'].toString(),

      fname: parsedJSON['Fname'] as String?,
      lname: parsedJSON['Lname'] as String?,
      phoneNumber: parsedJSON['PhoneNumber'] as String?,
    );
  }
}