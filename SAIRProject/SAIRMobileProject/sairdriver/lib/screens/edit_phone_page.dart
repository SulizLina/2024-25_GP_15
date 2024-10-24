import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart'; // For Firebase Firestore
import 'package:firebase_auth/firebase_auth.dart'; // For Firebase Authentication
import 'package:sairdriver/messages/error_messages.dart';
import 'package:sairdriver/messages/phone_validator.dart';
import 'package:google_fonts/google_fonts.dart';

class EditPhonePage extends StatefulWidget {
  final String driverId; // DriverID passed from previous page
  final Function(String)
      onPhoneUpdated; // Callback function to update the profile page

  const EditPhonePage({required this.driverId, required this.onPhoneUpdated});

  @override
  _EditPhonePageState createState() => _EditPhonePageState();
}

class _EditPhonePageState extends State<EditPhonePage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _phoneController = TextEditingController();
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _phoneController.text = "+966"; // Prefill the phone field with +966
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  // Function to check if phone number is taken
  Future<bool> isPhoneNumberTaken(String phoneNumber) async {
    final querySnapshot = await FirebaseFirestore.instance
        .collection('Driver')
        .where('PhoneNumber', isEqualTo: phoneNumber)
        .get();

    return querySnapshot.docs.isNotEmpty;
  }

  // Function to update phone number in Firebase
  Future<void> updatePhoneNumberInFirebase(String phoneNumber) async {
    try {
      User? currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser != null) {
        // Update phone number in the Firestore document for the user
        await FirebaseFirestore.instance
            .collection('Driver')
            .doc(widget.driverId)
            .update({
          'PhoneNumber': phoneNumber,
        });
        // Call the callback function to update the phone number in the profile page
        widget.onPhoneUpdated(phoneNumber);
      } else {
        setState(() {
          errorMessage = 'User is not logged in.';
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to update phone number. Please try again.';
      });
    }
  }

  // Function to show success dialog
  void showSuccessDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          child: Container(
            padding: EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  "Done Successfully!",
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 20),
                Text(
                  "Your phone number has been updated successfully!",
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context); // Close dialog
                    _phoneController.text = "+966";
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color.fromARGB(201, 3, 152, 85),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    "OK",
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }


  Future<void> _updatePhoneNumber() async {
    setState(() {
      errorMessage = null;
    });

    if (_formKey.currentState != null && _formKey.currentState!.validate()) {
      String phoneNumber = cleanPhoneNumber(_phoneController.text);

      // Check if the phone number is already taken
      bool isTaken = await isPhoneNumberTaken(phoneNumber);
      if (isTaken) {
        setState(() {
          errorMessage = PHONE_TAKEN_ERROR; // From error_messages.dart
        });
        return;
      }

      // Update the phone number in Firebase
      await updatePhoneNumberInFirebase(phoneNumber);

      // Show confirmation dialog
      showSuccessDialog(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color.fromARGB(255, 3, 152, 85),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Color.fromARGB(255, 3, 152, 85),
        toolbarHeight: 100,
        iconTheme: const IconThemeData(color: Color(0xFFFAFAFF)),
        title: Row(
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back),
              onPressed: () {
                Navigator.pop(context); // Navigate back
              },
            ),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                "Update Phone Number",
                style: GoogleFonts.poppins(
                  fontSize: 23,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFFAFAFF),
                ),
                textAlign: TextAlign.start,
              ),
            ),
          ],
        ),
      ),
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16),
        decoration: const BoxDecoration(
          color: Color(0xFFF3F3F3),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Update Your Phone Number',
                  style: GoogleFonts.poppins(
                    fontSize: 21,
                    fontWeight: FontWeight.bold,
                    color: Color.fromARGB(201, 3, 152, 85),
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Write Your New Phone Number Below.',
                  style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey),
                ),
                SizedBox(height: 20),
                TextFormField(
                  controller: _phoneController,
                  decoration: InputDecoration(
                    labelText: 'Enter your number with country code',
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Color.fromARGB(201, 3, 152, 85),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: errorMessage == null
                            ? Color.fromARGB(201, 3, 152, 85)
                            : Colors.red,
                        width: 2.0,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    errorBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Colors.red,
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: Colors.red,
                        width: 2.0,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    errorStyle: TextStyle(
                      fontSize: 12,
                      color: Colors.red,
                      height: 1.2,
                    ),
                  ),
                  keyboardType: TextInputType.phone,
                  validator: validatePhoneNumber,
                ),
                SizedBox(height: 10),
                if (errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Text(
                      errorMessage!,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.red,
                        height: 1.2,
                      ),
                    ),
                  ),
                SizedBox(height: 30),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _updatePhoneNumber,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color.fromARGB(201, 3, 152, 85),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15.0),
                      ),
                      padding: EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      'Update',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
