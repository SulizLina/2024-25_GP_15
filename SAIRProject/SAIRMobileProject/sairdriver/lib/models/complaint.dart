import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class Complaint {
  String? ComID; 
  String? driverId;
  Timestamp? DateTime; 
  String? Description;
  String? Response;
  String? gspNumber; 
  String? Vid; 
  String? Status;

  Complaint({
    required this.ComID,
    required this.driverId,
    required this.DateTime,
    required this.Description,
    required this.Response, //we dont need it!
    required this.gspNumber,
    required this.Vid,
    required this.Status,
  });

  // Factory constructor to create a Violation from Firestore document
  factory Complaint.fromJson(DocumentSnapshot document) {
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Complaint(
      ComID: parsedJSON['ComplaintID'].toString(),
      driverId: parsedJSON['driverID'].toString(),
      DateTime: parsedJSON['DateTime']as Timestamp,
      Description: parsedJSON['Description'] as String?,
      Response: parsedJSON['Response'] as String?, //we dont need it!
      gspNumber: parsedJSON['GPSnumber'].toString(),
      Vid: parsedJSON['ViolationID'].toString(),
      Status: parsedJSON['Status'] as String?,
    );
  }

}