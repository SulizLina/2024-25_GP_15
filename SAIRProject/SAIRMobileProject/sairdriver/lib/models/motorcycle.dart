import 'package:cloud_firestore/cloud_firestore.dart';


class Motorcycle {
  String? id;
  String? driverId;
  String? gspNumber;
  String? licensePlate;
  String? type;
  String? brand;
  String? model;


  Motorcycle({
    required this.id,
    required this.driverId,
    required this.gspNumber,
    required this.licensePlate,
    required this.type,
    required this.brand,
    required this.model,
  });

  // Factory constructor to create a Motorcycle from Firestore document
  factory Motorcycle.fromDocument(DocumentSnapshot document) {
    String id = document.id;
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Motorcycle(
      id: id,
      driverId: parsedJSON['DriverID'] as String?,
      gspNumber: parsedJSON['GPSnumber'] as String?,
      licensePlate: parsedJSON['LicensePlate'] as String?,
      type: parsedJSON['Type'] as String?,
      brand: parsedJSON['Brand'] as String?,
      model: parsedJSON['Model'] as String?,
    );
  }

  // New method to create a Motorcycle from a Map
  factory Motorcycle.fromMap(Map<String, dynamic> map, String documentId) {
    return Motorcycle(
      id: documentId,
      driverId: map['DriverID'] as String?,
      gspNumber: map['GPSnumber'] as String?,
      licensePlate: map['LicensePlate'] as String?,
      type: map['Type'] as String?,
      brand: map['Brand'] as String?,
      model: map['Model'] as String?,
    );
  }
}