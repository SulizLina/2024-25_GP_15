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
  //Pre-filled phone number
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
  //End of Pre-filled phone number

  // Validate phone number format
  bool _isPhoneValid(String phone) {
    final phoneRegex = RegExp(r'^\+966\d{9}$'); // Saudi phone number validation
    return phoneRegex.hasMatch(phone);
  }

  void _validatePhone(String value) {
    setState(() {
      if (value.isEmpty) {
        _phoneErrorText = "Your phone number is required";
      } else if (!_isPhoneValid(value)) {
        _phoneErrorText =
            "Phone number must start with +966 and be followed by 9 digits.";
      } else {
        _phoneErrorText = ""; // Clear the error message if valid
      }
    });
  }

  // Function to send OTP after validating the phone number and checking if it's registered
  Future<void> _sendResetPassword() async {
     if (_formKey.currentState?.validate() ?? false) {
    // Proceed with checking the phone number in Firestore
    final phone = _phoneController.text;
    // Validate the phone number

    try {
      // Query Firestore for the phone number (only when button is pressed)
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
      final driverId =
          driverDoc.docs.first.id; // Assuming first match is the driver

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
      backgroundColor: Color(0xFFFAFAFF),
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
          SizedBox(width: 10), // Space between arrow and text
          Expanded( // Allows the text to take up remaining space
            child: Text(
              "Reset Your Password", 
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
    resizeToAvoidBottomInset: true,
      body: Container( ////////////////////
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16),
        decoration: const BoxDecoration(
          color: Color(0xFFFAFAFF),
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
                    fontSize: 21,
                    fontWeight: FontWeight.bold,
                    color: const Color.fromARGB(201, 3, 152, 85),
                  ),
                ),
                const SizedBox(
                    height: 8), // Space between heading and input field
                Text(
                  'Enter your phone number to receive an OTP',
                  style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey),
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
                            ? const Color.fromARGB(
                                201, 3, 152, 85) // Green if valid
                            : Colors.red, // Red for error
                        width: 1.5,
                      ),
                      borderRadius:
                          BorderRadius.circular(10), // Rounded corners
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: _phoneErrorText.isEmpty
                            ? const Color.fromARGB(
                                201, 3, 152, 85) // Green on focus
                            : Colors.red, // Red for error on focus
                        width: 2.0,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    errorText:
                        _phoneErrorText.isNotEmpty ? _phoneErrorText : null,
                    errorBorder: OutlineInputBorder(
                      borderSide:
                          const BorderSide(color: Colors.red, width: 1.5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    focusedErrorBorder: OutlineInputBorder(
                      borderSide:
                          const BorderSide(color: Colors.red, width: 2.0),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  keyboardType: TextInputType.phone,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return "Your phone number is required";
                    } else if (!_isPhoneValid(value)) {
                      return "Phone number must start with +966 and be followed\nby 9 digits.";
                    }
                    return null; // Clear error message if valid
                  },
                ),

                const SizedBox(height: 30),

                // Send OTP Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed:
                        _sendResetPassword, // Firestore check only on button press
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
