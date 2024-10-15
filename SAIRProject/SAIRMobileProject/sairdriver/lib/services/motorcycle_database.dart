import 'package:cloud_firestore/cloud_firestore.dart';

class MotorcycleDatabase {
  
  final CollectionReference motorcycleCollection =
      FirebaseFirestore.instance.collection('Motorcycle');

  // Fetch the plate number from the Motorcycle collection using DriverID
 Future<String?> getPlateNumberByDriverId(String driverId) async {
  
  try {
    var motorcycleSnapshot = await FirebaseFirestore.instance
        .collection('Motorcycle')
        .where('DriverID', isEqualTo: driverId)  // Ensure this DriverID matches exactly
        .limit(1)
        .get();

    if (motorcycleSnapshot.docs.isNotEmpty) {
      var motorcycleData = motorcycleSnapshot.docs.first.data();
      print('Motorcycle found: ${motorcycleData}');
      return motorcycleData['LicensePlate'];
    } else {
      print('No motorcycle found for DriverID: $driverId');
    }
  } catch (e) {
    print('Error fetching LicensePlate: $e');
  }
  return null; // Return null if no motorcycle is found
}


}