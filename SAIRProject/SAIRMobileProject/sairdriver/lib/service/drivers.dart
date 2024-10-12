import 'package:sairdriver/models/Driver.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class Drivers {
  final CollectionReference driverColleaction = FirebaseFirestore.instance.collection("Driver");
  
}