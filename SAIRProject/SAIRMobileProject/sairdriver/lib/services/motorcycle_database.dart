import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/motorcycle.dart';
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

Future<Motorcycle?> getMotorcycleByGPS(String GPSNumber) async {
  try {
    var snapshot = await FirebaseFirestore.instance
        .collection('Motorcycle')
        .where('GPSnumber', isEqualTo: GPSNumber)
        .limit(1) // Limit to one result
        .get();

    if (snapshot.docs.isNotEmpty) {
      var motorcycleData = snapshot.docs.first.data() as Map<String, dynamic>;
      return Motorcycle.fromMap(motorcycleData, snapshot.docs.first.id); // Use fromMap method
    }
    return null; // Return null if no motorcycle is found
  } catch (e) {
    print("Error fetching motorcycle info: $e");
    return null; // Return null on error
  }
}

Future<Motorcycle?> getMotorcycleByIDhis(String id) async {
  try {
    var snapshot = await FirebaseFirestore.instance
        .collection('History')
        .where('ID', isEqualTo: id)
        .limit(1) 
        .get();

    if (snapshot.docs.isNotEmpty) {
      var motorcycleData = snapshot.docs.first.data();
      return Motorcycle.fromMap(motorcycleData, snapshot.docs.first.id); // Use fromMap method
    }
    return null; 
  } catch (e) {
    print("Error fetching motorcycle info: $e");
    return null; 
  }
}

Future<Motorcycle?> getMotorcycleByDriverID(String driverID) async {
  try {
    var snapshot = await FirebaseFirestore.instance
        .collection('Motorcycle')
        .where('DriverID', isEqualTo: driverID)
        .limit(1) // Limit to one result
        .get();

    if (snapshot.docs.isNotEmpty) {
      var motorcycleData = snapshot.docs.first.data() as Map<String, dynamic>;
      return Motorcycle.fromMap(motorcycleData, snapshot.docs.first.id); // Use fromMap method
    }
    return null; // Return null if no motorcycle is found
  } catch (e) {
    print("Error fetching motorcycle info: $e");
    return null; // Return null on error
  }
}
}