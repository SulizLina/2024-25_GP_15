import 'package:cloud_firestore/cloud_firestore.dart';

class Employer {
  String? CompanyEmail;
  String? CompanyName;
  String? PhoneNumber;
  String? ShortCompanyName;
  String? commercialNumber;
  String? uid;

  Employer({
    required this.CompanyEmail,
    required this.CompanyName,
    required this.PhoneNumber,
    required this.ShortCompanyName,
        required this.commercialNumber,
    required this.uid,
  });

  // Factory constructor to create a driver from Firestore document
  factory Employer.fromJson(DocumentSnapshot document) {
    Map<String, dynamic> parsedJSON = document.data() as Map<String, dynamic>;

    return Employer(
      CompanyEmail: parsedJSON['CompanyEmail'] as String?,
      CompanyName: parsedJSON['CompanyName'].toString(),
      PhoneNumber: parsedJSON['PhoneNumber'].toString(),
      ShortCompanyName: parsedJSON['ShortCompanyName'] as String?,
      uid: parsedJSON['uid'] as String?,
      commercialNumber: parsedJSON['commercialNumber'] as String?,
    );
  }
}