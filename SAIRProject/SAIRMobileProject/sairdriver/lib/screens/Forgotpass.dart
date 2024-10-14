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
    final phoneRegex = RegExp(r'^\+9665\d{8}$'); // Regex for phone validation
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
        QuerySnapshot<Map<String, dynamic>> query = await FirebaseFirestore
            .instance
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
                builder: (context) => Otppage(
                    verificationId: verificationId), // Pass verificationId here
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
      backgroundColor: Color.fromARGB(255, 3, 152, 85),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Color.fromARGB(255, 3, 152, 85),
        shape: const RoundedRectangleBorder(),
        toolbarHeight: 90, // Adjust the toolbar height
        iconTheme: const IconThemeData(color: Color(0xFF211D1D)),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Padding(
                  padding: EdgeInsets.only(left: 7),
                ),
                Transform.translate(
                  offset: const Offset(0,
                      10), // Move the text down by 10 pixels to match the home page
                  child: const Padding(
                    padding: EdgeInsets.only(left: 5),
                    child: Text(
                      "Rest Password",
                      style: TextStyle(
                        fontSize: 24.0,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.left,
                    ),
                  ),
                ),
              ],
            ),
          ],
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
                Text(
                  "Don't worry we got you!",
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color.fromARGB(201, 3, 152, 85),
                  ),
                ),
                SizedBox(height: 8), // Space between heading and input field

                // Subtitle text
                Text(
                  'Enter your phone number to receive an OTP',
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
                        color: _phoneErrorText.isEmpty
                            ? Color.fromARGB(201, 3, 152, 85) // Green if valid
                            : Colors.red, // Red for error
                        width: 1.5,
                      ),
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: _phoneErrorText.isEmpty
                            ? Color.fromARGB(
                                201, 3, 152, 85) // Green if focused and valid
                            : Colors.red, // Red if error on focus
                        width: 2.0,
                      ),
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                    errorText: _phoneErrorText.isNotEmpty
                        ? _phoneErrorText
                        : null, // Show error if not empty
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
                  ),
                  keyboardType: TextInputType.phone,
                  onChanged: _validatePhone, // Call validation on every change
                ),
                SizedBox(height: 10),

                SizedBox(height: 30),
                // Send OTP Button with Green Background
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _sendResetPassword,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color.fromARGB(201, 3, 152, 85),
                      shape: RoundedRectangleBorder(
                        borderRadius:
                            BorderRadius.circular(15.0), // Rounded corners
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
      ),
    );
  }
}
