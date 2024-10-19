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

/*
Future<Object?> getViolation(String driverID) async {
  try {
    QuerySnapshot snapshot = await FirebaseFirestore.instance
        .collection('Motorcycle') // Update table name
        .where('DriverID', isEqualTo: driverID)
        .limit(1) // Limit the result to 1 item
        .get();

    // If there is at least one document, return the first one
    if (snapshot.docs.isNotEmpty) {
      return snapshot.docs.first.data(); // Return the first document
    }

    return null; // Return null if no violation is found
  } catch (e) {
    print("Error fetching violation: $e");
    return null; // Return null in case of an error
  }*/
}