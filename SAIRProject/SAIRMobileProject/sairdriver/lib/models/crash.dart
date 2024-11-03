
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class Crash {
  String? cid;
  String? driverId;
  String? gspNumber;
  String? location; 
  GeoPoint? position; 
  int? time;  
  String? status;

  Crash({
    required this.cid,
    required this.driverId,
    required this.gspNumber,
    required this.location,
    required this.position,
    required this.time,
        required this.status,

  });

    String getFormattedDate() {
      if (time == null) return 'N/A'; // Return N/A if time is not set
      DateTime dateTime = DateTime.fromMillisecondsSinceEpoch(time! * 1000);
      return DateFormat('yyyy-MM-dd').format(dateTime); // Only date
    }

    // Function to get formatted time
    String getFormattedTimeOnly() {
      if (time == null) return 'N/A';
      DateTime dateTime = DateTime.fromMillisecondsSinceEpoch(time! * 1000);
      return DateFormat('HH:mm:ss').format(dateTime); 
    }

  factory Crash.fromJson(DocumentSnapshot document) {
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Crash(
      cid: parsedJSON['crashID'].toString(),
      driverId: parsedJSON['driverID'].toString(),
      gspNumber: parsedJSON['GPSnumber'].toString(),
      status: parsedJSON['Status'] as String?, 
      location: parsedJSON['location'] as String?, 
      position: parsedJSON['position'] != null
          ? GeoPoint(
              parsedJSON['position']['latitude'], 
              parsedJSON['position']['longitude'], 
            )
          : null,
    
      time: parsedJSON['time'] as int?,   
    );
  }
}