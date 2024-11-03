import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class Complaint {
  String? ComID; 
  String? DateTime; 
  String? Description;
  String? Response;
  String? gspNumber; 
  String? Vid; 

  Complaint({
    required this.ComID,
    required this.DateTime,
    required this.Description,
    required this.Response, //we dont need it!
    required this.gspNumber,
    required this.Vid,
  });

  // Factory constructor to create a Violation from Firestore document
  factory Complaint.fromJson(DocumentSnapshot document) {
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Complaint(
      ComID: parsedJSON['ComplaintID'].toString(),
      DateTime: parsedJSON['DateTime'].toString(),
      Description: parsedJSON['Description'] as String?,
      Response: parsedJSON['Response'] as String?, //we dont need it!
      gspNumber: parsedJSON['GPSnumber'].toString(),
      Vid: parsedJSON['ViolationID'].toString(),
    );
  }

}