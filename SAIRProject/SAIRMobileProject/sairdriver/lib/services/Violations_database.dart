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
}