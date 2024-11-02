import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/crash.dart';

class CrashDatabase {

  // Fetching all crash by Driver ID
  Future<List<Crash>> getCrashes(String driverID) async { 
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Crash') 
          .where('driverID', isEqualTo: driverID)
          .get();

      // Mapping the documents to the Violation model using the document snapshot
      return snapshot.docs.map((doc) {
        return Crash.fromJson(doc); // Pass the entire DocumentSnapshot
      }).toList();
    } catch (e) {
      print("Error fetching crashes: $e");
      return [];
    }
  }

  Future<Crash?> getCrashById(String crashId) async {
    try {
      DocumentSnapshot snapshot = await FirebaseFirestore.instance
          .collection('Crash')
          .doc(crashId) // Use the document ID directly
          .get();

      if (snapshot.exists) {
        return Crash.fromJson(snapshot); // Return the violation object
      }
      return null; 
    } catch (e) {
      print("Error fetching crash: $e");
      return null; 
    }
  }
}