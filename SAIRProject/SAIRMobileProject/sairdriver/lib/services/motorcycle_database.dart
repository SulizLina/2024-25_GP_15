import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/models/driver.dart';
class MotorcycleDatabase {
  
  final CollectionReference motorcycleCollection =
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
  }
}