import 'dart:developer';
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

  void _validatePhone(String value) {
    if (value.isEmpty) {
      setState(() {
        _phoneErrorText = "Your phone number is required";
      });
    } else if (!_isPhoneValid(value)) {
      setState(() {
        _phoneErrorText = "Invalid phone number";
      });
    } else {
      setState(() {
        _phoneErrorText = "";
      });
    }
  }

  bool _isPhoneValid(String phone) {
    final phoneRegex = RegExp(r'^\+9665\d{8}$');
    return phoneRegex.hasMatch(phone);
  }

  void _sendResetPassword() async {
    final phone = _phoneController.text;

    // Validate phone number
    if (phone.isEmpty) {
      setState(() {
        _phoneErrorText = 'Your phone number is required';
      });
    } else if (!_isPhoneValid(phone)) {
      setState(() {
        _phoneErrorText = 'Invalid phone number';
      });
    } else {
      setState(() {
        _phoneErrorText = ''; // Clear any error messages
      });
    }

    // Check if there are no errors
    if (_phoneErrorText.isEmpty) {
      try {
        // Check if the phone number exists in Firestore
        QuerySnapshot<Map<String, dynamic>> query = await FirebaseFirestore.instance
            .collection('Driver')
            .where('PhoneNumber', isEqualTo: phone)
            .get();

        if (query.docs.isEmpty) {
          setState(() {
            _phoneErrorText = "The phone number is not registered";
          });
          return;
        }

        // Proceed with sending OTP
        await FirebaseAuth.instance.verifyPhoneNumber(
          phoneNumber: phone,
          verificationCompleted: (PhoneAuthCredential credential) {
            // Handle the verification completion if necessary
          },
          verificationFailed: (FirebaseAuthException error) {
            log(error.toString());
          },
          codeSent: (String verificationId, int? forceResendingToken) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => Otppage(verificationId: verificationId), // Pass verificationId here
              ),
            );
          },
          codeAutoRetrievalTimeout: (String verificationId) {
            log('Auto Retrieval Timeout');
          },
        );
      } catch (e) {
        print(e);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.black), // Back arrow color
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Reset Your Password',
                style: GoogleFonts.poppins(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(201, 3, 152, 85),
                ),
              ),
              SizedBox(height: 8), // Space between heading and input field

              // Subtitle text
              Text(
                'Enter your phone number to receive OTP.',
                style: GoogleFonts.poppins(fontSize: 16, color: Colors.grey),
              ),
              SizedBox(height: 20),

              // Phone Number Input Field with Green Border or Red on Error
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
                      color: _phoneErrorText.isEmpty
                          ? Color.fromARGB(201, 3, 152, 85) // Green border if no error
                          : Colors.red, // Red border if there is an error
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
                    height: 1.2, // Same error style as in validatePhoneNumber
                  ),
                ),
                keyboardType: TextInputType.phone,
                onChanged: _validatePhone, // Call validation on every change
              ),
              SizedBox(height: 10),
              // Error Message Display
              if (_phoneErrorText.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: Text(
                    _phoneErrorText,
                    style: TextStyle(
                      fontSize: 12, // Same font size as in validatePhoneNumber
                      color: Colors.red, // Red color for the error
                      height: 1.2, // Same line height as in validatePhoneNumber
                    ),
                  ),
                ),
              SizedBox(
                height: 30,
              ),
              // Send OTP Button with Green Background
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _sendResetPassword,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color.fromARGB(201, 3, 152, 85),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15.0), // Rounded corners
                    ),
                    padding: EdgeInsets.symmetric(
                      vertical: 16, // Add vertical padding
                    ),
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
    );
  }
}
