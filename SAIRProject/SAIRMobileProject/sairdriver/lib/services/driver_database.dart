import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/driver.dart';

class DriverDatabase {
    final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<List<driver>> getDrivers(String driverID) async {
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Driver')
          .where('DriverID', isEqualTo: driverID)
          .get();

      return snapshot.docs.map((doc) => driver.fromJson(doc)).toList();
    } catch (e) {
      print("Error fetching driver information: $e");
      return [];
    }
  }
  // Method to update the phone number
  Future<void> updatePhoneNumber(String driverId, String newPhoneNumber) async {
    try {
      await _firestore.collection('Driver').doc(driverId).update({
        'phoneNumber': newPhoneNumber, 
      });
    } catch (e) {
      throw Exception('Failed to update phone number: $e');
    }
  }


  Future<driver?> getDriversnById(String DriverId) async {
    try {
      DocumentSnapshot snapshot = await FirebaseFirestore.instance
          .collection('Driver')
          .doc(DriverId) 
          .get();

      if (snapshot.exists) {
        return driver.fromJson(snapshot); 
      }
      return null; 
    } catch (e) {
      print("Error fetching driver: $e");
      return null;
    }
  }
}