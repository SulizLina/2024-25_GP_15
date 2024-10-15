import 'dart:developer';
import 'package:sairdriver/screens/login.dart';
import 'otppage.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_fonts/google_fonts.dart';

class Forgotpass extends StatefulWidget {
  const Forgotpass({super.key});

  @override
  State<Forgotpass> createState() => _Forgotpass();
}

class _Forgotpass extends State<Forgotpass> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  String _phoneErrorText = "";

  // Validate phone number format
  bool _isPhoneValid(String phone) {
    final phoneRegex = RegExp(r'^\+9665\d{8}$'); // Saudi phone number validation
    return phoneRegex.hasMatch(phone);
  }

  void _validatePhone(String value) {
    setState(() {
      if (value.isEmpty) {
        _phoneErrorText = "Your phone number is required";
      } else if (!_isPhoneValid(value)) {
        _phoneErrorText = "Invalid phone number";
      } else {
        _phoneErrorText = "";
      }
    });
  }
Future<void> _sendResetPassword() async {
  final phone = _phoneController.text;

  // Validate the phone number
  if (_formKey.currentState?.validate() ?? false) {
    try {
      // Query Firestore for the phone number
      final db = FirebaseFirestore.instance;
      final driverDoc = await db
          .collection('Driver')
          .where('PhoneNumber', isEqualTo: phone)
          .get();

      if (driverDoc.docs.isEmpty) {
        setState(() {
          _phoneErrorText = "The phone number is not registered";
        });
        return;
      }

      // Extract driver ID
      final driverId = driverDoc.docs.first.id; // Assuming first match is the driver

      // Proceed to send OTP
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: phone,
        verificationCompleted: (PhoneAuthCredential credential) {
          // Handle automatic code retrieval or instant verification
        },
        verificationFailed: (FirebaseAuthException error) {
          log(error.toString());
        },
        codeSent: (String verificationId, int? forceResendingToken) {
          // Navigate to the OTP page, passing both verificationId and driverId
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => Otppage(
                verificationId: verificationId,
                driverId: driverId, // Pass the driver ID
              ),
            ),
          );
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          log('Auto Retrieval Timeout');
        },
      );
    } catch (e) {
      log(e.toString());
    }
  }
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 3, 152, 85),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color.fromARGB(255, 3, 152, 85),
        toolbarHeight: 80, // Adjust the toolbar height
        iconTheme: const IconThemeData(color: Color(0xFF211D1D)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            Navigator.push(context,
                MaterialPageRoute(builder: (context) => const Login()));
          },
        ),
        title: const Text(
          "Reset Password",
          style: TextStyle(
            fontSize: 24.0,
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
      ),
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16.0),
        decoration: const BoxDecoration(
          color: Colors.white, // White background for the content
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30), // Rounded top-left corner
            topRight: Radius.circular(30), // Rounded top-right corner
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 30),
                Text(
                  "Don't worry we got you!",
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: const Color.fromARGB(201, 3, 152, 85),
                  ),
                ),
                const SizedBox(height: 8), // Space between heading and input field
                Text(
                  'Enter your phone number to receive an OTP',
                  style: GoogleFonts.poppins(fontSize: 16, color: Colors.grey),
                ),
                const SizedBox(height: 20),

                // Phone Number Input Field
                TextFormField(
                  controller: _phoneController,
                  decoration: InputDecoration(
                    labelText: 'Enter your number with country code',
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: _phoneErrorText.isEmpty
                            ? const Color.fromARGB(201, 3, 152, 85) // Green if valid
                            : Colors.red, // Red for error
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(10), // Rounded corners
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: _phoneErrorText.isEmpty
                            ? const Color.fromARGB(201, 3, 152, 85) // Green on focus
                            : Colors.red, // Red for error on focus
                        width: 2.0,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    errorText: _phoneErrorText.isNotEmpty ? _phoneErrorText : null,
                    errorBorder: OutlineInputBorder(
                      borderSide: const BorderSide(color: Colors.red, width: 1.5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderSide: const BorderSide(color: Colors.red, width: 2.0),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  keyboardType: TextInputType.phone,
                  onChanged: _validatePhone,
                ),
                const SizedBox(height: 30),

                // Send OTP Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _sendResetPassword,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color.fromARGB(201, 3, 152, 85),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15.0),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      'Send OTP',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        color: Colors.white, // White text
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
