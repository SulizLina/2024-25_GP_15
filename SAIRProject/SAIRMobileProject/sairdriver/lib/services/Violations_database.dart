import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/violation.dart';

class ViolationsDatabase {

  // Fetching all violations by Driver ID
  Future<List<Violation>> getViolations(String driverID) async {
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Violation')
          .where('driverID', isEqualTo: driverID)
          .get();

      // Mapping the documents to the Violation model using the document snapshot
      return snapshot.docs.map((doc) {
        return Violation.fromJson(doc);
      }).toList();
    } catch (e) {
      print("Error fetching violations: $e");
      return [];
    }
  }

  Future<Violation?> getViolationById(String violationId) async {
    try {
      DocumentSnapshot snapshot = await FirebaseFirestore.instance
          .collection('Violation')
          .doc(violationId)
          .get();

      if (snapshot.exists) {
        return Violation.fromJson(snapshot);
      }
      return null;
    } catch (e) {
      print("Error fetching violation: $e");
      return null;
    }
  }


    Future<Violation?> getViolationCDOCid(String violationId) async {
    try {
      DocumentSnapshot snapshot = await FirebaseFirestore.instance
          .collection('Violation')
          .doc(violationId)
          .get();

      if (snapshot.exists) {
        return Violation.fromJson(snapshot);
      }
      return null;
    } catch (e) {
      print("Error fetching violation: $e");
      return null;
    }
  }
}