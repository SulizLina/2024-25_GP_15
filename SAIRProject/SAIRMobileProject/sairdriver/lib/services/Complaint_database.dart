import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/complaint.dart';
import 'package:sairdriver/models/violation.dart';
import 'dart:math';

class ComplaintDatabase {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

String generateComplaintID() {
  Random random = Random();
  return '3' + List.generate(9, (_) => random.nextInt(10)).join();
}


  //method to raise complaint
  Future<void> raiseComplaint(Violation v, String desc, String driverid) async {

    String complaintID = generateComplaintID(); 

    try {
      await _firestore.collection('Complaint').add({
        'ComplaintID': complaintID, //////////new genrated
        'driverID': v.driverId,
        'DateTime': Timestamp.now(),
        'Description': desc,
        'GPSnumber': v.gspNumber,
        'ViolationID': v.Vid,
        'Status': 'Pending',
      });
      print("Complaint added successfully.");
    } catch (e) {
      print("Error adding complaint: $e");
    }
  }

  Future<Complaint?> getComplaintById(String complaintId) async {
    try {
      DocumentSnapshot snapshot = await FirebaseFirestore.instance
          .collection('Complaint')
          .doc(complaintId) 
          .get();

      if (snapshot.exists) {
        return Complaint.fromJson(snapshot); // Return the violation object
      }
      return null; // Return null if no violation found
    } catch (e) {
      print("Error fetching violation: $e");
      return null; // Return null on error
    }
  }
}
