import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/complaint.dart';
import 'package:sairdriver/models/violation.dart';

class ComplaintDatabase {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

      //method to raise complaint
      Future<void> raiseComplaint(Violation v, String desc, String driverid) async {
        try {
            await _firestore.collection('Complaint').add({
                'ComplaintID': '1234567890', //////////new genrated 
                'driverID': v.driverId,
                'DateTime': Timestamp.now(),
                'Description': desc,
                'GPSnumber': v.gspNumber,
                'ViolationID': v.Vid,
                'Status': 'New',
            });
            print("Complaint added successfully.");
        } catch (e) {
            print("Error adding complaint: $e");
        }
    }
}