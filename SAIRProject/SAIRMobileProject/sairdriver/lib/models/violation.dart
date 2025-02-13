import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

class Violation {
  String? Vid;
  String? driverId;
  String? gspNumber;
   String? status;
  int? Maxspeed;
  String? location;
  GeoPoint? position; 
  int? price; 
  int? speed; 
  int? time; 
  bool? newV;
  bool? isAuto;
  int? count30;
  int? count50;
  Violation(
      {required this.Vid,
      required this.driverId,
      required this.gspNumber,
      required this.location,
      required this.position,
    required this.isAuto,
      required this.Maxspeed,
      required this.speed,
      required this.price,
      required this.time,
      required this.count50,
       required this.status,
       required this.count30, 
      required this.newV});


  String getFormattedDate() {
    if (time == null) return 'N/A'; 
    DateTime dateTime = DateTime.fromMillisecondsSinceEpoch(time! * 1000);
    return DateFormat('yyyy-MM-dd').format(dateTime); 
  }

  // Function to get formatted time
  String getFormattedTimeOnly() {
    if (time == null) return 'N/A';
    DateTime dateTime = DateTime.fromMillisecondsSinceEpoch(time! * 1000);
    return DateFormat('HH:mm:ss').format(dateTime); 
  }

  // Factory constructor to create a Violation from Firestore document
  factory Violation.fromJson(DocumentSnapshot document) {
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Violation(
      Vid: parsedJSON['violationID'].toString(),
      driverId: parsedJSON['driverID'].toString(),
      gspNumber: parsedJSON['GPSnumber'].toString(),
        status: parsedJSON['Status'].toString(),
      location: parsedJSON['location'] as String?, 
      position: parsedJSON['position'] != null
          ? GeoPoint(
              parsedJSON['position']['latitude'], 
              parsedJSON['position']['longitude'], 
            )
          : null,
      speed: parsedJSON['driverSpeed'] as int?,
      Maxspeed: parsedJSON['streetMaxSpeed'] as int?,
      price: parsedJSON['price'] as int?,
      time: parsedJSON['time'] as int?,
      count30: parsedJSON['count30'] as int?,
      count50: parsedJSON['count50'] as int?,
      newV: parsedJSON['newV'] as bool?,
      isAuto: parsedJSON['isAuto'] as bool?,
    );
  }
}
