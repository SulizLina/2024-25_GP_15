import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/violation.dart';

class ViolationsDatabase {
  Future<List<Violation>> getViolations(String driverID) async {
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Violation')
          .where('DriverID', isEqualTo: driverID)
          .get();

      return snapshot.docs.map((doc) => Violation.fromJson(doc)).toList();
    } catch (e) {
      print("Error fetching violations: $e");
      return [];
    }
  }


  Future<Violation?> getViolationById(String violationId) async {
    try {
      DocumentSnapshot snapshot = await FirebaseFirestore.instance
          .collection('Violation')
          .doc(violationId) // Use the document ID directly
          .get();

      if (snapshot.exists) {
        return Violation.fromJson(snapshot); // Return the violation object
      }
      return null; // Return null if no violation found
    } catch (e) {
      print("Error fetching violation: $e");
      return null; // Return null on error
    }
  }
}