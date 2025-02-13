import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class Complaint {
  String? ComID;
  String? driverId;
  Timestamp? timestamp;
  String? Description;
  String? Reason;
  String? gspNumber;
  String? Vid;
  String? Status;
  String? gdtReason;
  String? RespondedBy;
  Complaint({
    required this.ComID,
    required this.driverId,
    required this.timestamp,
    required this.Description,
    required this.Reason,
    required this.gspNumber,
    required this.Vid,
    required this.Status,
    required this.gdtReason,
    required this.RespondedBy,
  });

  // Factory constructor to create a Complaint from Firestore document
  factory Complaint.fromJson(DocumentSnapshot document) {
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Complaint(
      ComID: parsedJSON['ComplaintID'].toString(),
      driverId: parsedJSON['driverID'].toString(),
      timestamp: parsedJSON['DateTime'] as Timestamp,
      Description: parsedJSON['Description'] as String?,
      Reason: parsedJSON['Reason'] as String?,
      gspNumber: parsedJSON['GPSnumber'].toString(),
      Vid: parsedJSON['ViolationID'].toString(),
      Status: parsedJSON['Status'] as String?,
      gdtReason: parsedJSON['GDTResponse'] as String?,
      RespondedBy: parsedJSON['RespondedBy'] as String?,
    );
  }
// Factory constructor to create a Complaint from a Map
  factory Complaint.fromJsonn(Map<String, dynamic> parsedJSON) {
    return Complaint(
      ComID: parsedJSON['ComplaintID']?.toString(),
      driverId: parsedJSON['driverID']?.toString(),
      timestamp: parsedJSON['DateTime'] as Timestamp?,
      Description: parsedJSON['Description'] as String?,
      Reason: parsedJSON['Reason'] as String?,
      gspNumber: parsedJSON['GPSnumber']?.toString(),
      Vid: parsedJSON['ViolationID']?.toString(),
      Status: parsedJSON['Status'] as String?,
      gdtReason: parsedJSON['GDTResponse'] as String?,
      RespondedBy: parsedJSON['RespondedBy'] as String?,
    );
  }

  // Method to get date in 'yyyy-MM-dd' format
  String getFormattedDate() {
    if (timestamp == null) return '';
    DateTime date = timestamp!.toDate();
    return DateFormat('yyyy-MM-dd').format(date);
  }

  // Method to get time in 'HH:mm:ss' format
  String getFormattedTime() {
    if (timestamp == null) return '';
    DateTime date = timestamp!.toDate();
    return DateFormat('HH:mm:ss').format(date);
  }
}
