import 'package:cloud_firestore/cloud_firestore.dart';

class Driver {
  String? id;
  int? driverID;
  String? fname;
  String? gpsnumber;
  String? lname;
  int? pnumber;

  Driver({
    required this.id,
    required this.driverID,
    required this.fname,
    required this.gpsnumber,
    required this.lname,
    required this.pnumber,
  });
  factory Driver.fromJson(DocumentSnapshot document) {
    String id = document.id;
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Driver(
      id: id,
      driverID: parsedJSON['DriverID'] as int?,
      gpsnumber: parsedJSON['GSPNUMBER'].toString(),
      fname: parsedJSON['Fname'].toString(),
      lname: parsedJSON['Lname'].toString(),
      pnumber: parsedJSON['PhoneNumber'] as int?,
    );
  }
}
