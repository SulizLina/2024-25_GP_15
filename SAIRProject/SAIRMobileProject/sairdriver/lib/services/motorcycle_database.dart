import 'package:cloud_firestore/cloud_firestore.dart';
import 'driver_database.dart';


class MotorcycleDatabase {
  final CollectionReference motorcycleCollection = FirebaseFirestore.instance.collection('Motorcycle');

  // Fetch the plate number from the Motorcycle collection using DriverID
  Future<String?> getPlateNumberByDriverId(String driverId) async {
    try {
      // Debugging output
      print('Fetching motorcycle for DriverID: $driverId');

      QuerySnapshot querySnapshot = await motorcycleCollection
          .where('DriverID', isEqualTo: driverId)
          .limit(1)
          .get();

      if (querySnapshot.docs.isNotEmpty) {
        var plateNumber = querySnapshot.docs.first['LicensePlate'];
        print('Plate number found: $plateNumber'); // Debugging output
        return plateNumber;
      } else {
        print('No motorcycle found for this driver.'); // Debugging output
        return null;
      }
    } catch (e) {
      print('Error fetching plate number: $e'); // Debugging output
      return null;
    }
  }
}
