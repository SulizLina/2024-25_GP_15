import 'package:cloud_firestore/cloud_firestore.dart';


class Motorcycle {
  String? id;
  String? driverId;
  String? gspNumber;
  String? licensePlate;


  Motorcycle({
    required this.id,
    required this.driverId,
    required this.gspNumber,
    required this.licensePlate,
  });

// Factory constructor to create a Motorcycle from Firestore document
  factory Motorcycle.fromJson(DocumentSnapshot document) {
    String id = document.id;
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Motorcycle(
      id: id,
      driverId: parsedJSON['DriverID'].toString(),
      gspNumber: parsedJSON['GPSNumber'].toString(),
      licensePlate: parsedJSON['LicensePlate'] as String?,
    );
  }
}