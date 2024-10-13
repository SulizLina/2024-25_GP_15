import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/driver.dart';

class DriverDatabase {
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


  Future<driver?> getDriversnById(String DriverId) async {
    try {
      DocumentSnapshot snapshot = await FirebaseFirestore.instance
          .collection('Driver')
          .doc(DriverId) // Use the document ID directly
          .get();

      if (snapshot.exists) {
        return driver.fromJson(snapshot); 
      }
      return null; // Return null if no driver found
    } catch (e) {
      print("Error fetching driver: $e");
      return null; // Return null on error
    }
  }
  /*final CollectionReference motorcycleCollection =
      FirebaseFirestore.instance.collection('Motorcycle');

  // Fetch the plate number from the Motorcycle collection using DriverID
  Future<String?> getPlateNumberByDriverId(String driverId) async {
    try {
      QuerySnapshot querySnapshot = await motorcycleCollection
          .where('DriverID', isEqualTo: driverId)
          .limit(1)
          .get();
      if (querySnapshot.docs.isNotEmpty) {
        var plateNumber = querySnapshot.docs.first['LicensePlate'];
        return plateNumber;
      }
    } catch (e) {
      print('Error fetching plate number: $e');
      return null;
    }
    return null;
  }*/
}