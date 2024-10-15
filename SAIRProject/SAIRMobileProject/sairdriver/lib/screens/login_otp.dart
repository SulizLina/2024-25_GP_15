import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sairdriver/screens/bottom_nav_bar.dart';
import 'package:sairdriver/screens/changepassword.dart';
import 'package:sairdriver/screens/home.dart';
import 'package:sairdriver/screens/Forgotpass.dart';
import 'package:sairdriver/screens/login.dart';

class LoginOtp extends StatefulWidget {
  final String verificationId;
  const LoginOtp({super.key, required this.verificationId});

  @override
  State<LoginOtp> createState() => _LoginOtpState();
}

class _LoginOtpState extends State<LoginOtp> {
  final otpController = TextEditingController();
  final db = FirebaseFirestore.instance;
  final _formKey = GlobalKey<FormState>(); // Form key
  bool isError = false; // Error state to track validation
  User? get currentUser => FirebaseAuth.instance.currentUser;

  @override
  Widget build(BuildContext context) { // Fixed the missing return in the build method
    return Scaffold(
      backgroundColor: Color.fromARGB(255, 3, 152, 85),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Color.fromARGB(255, 3, 152, 85),
        toolbarHeight: 80, // Adjust the toolbar height
        iconTheme: const IconThemeData(color: Color(0xFF211D1D)),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            // Navigate to the login page
            Navigator.push(context,
                MaterialPageRoute(builder: (context) => const Login()));
          },
        ),
        title: Text(
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
        child: SingleChildScrollView(
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.only(top: 30.0), // Set top padding to 30
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(30),
                    topRight: Radius.circular(30),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start, // Left-align the text
                    children: [
                      const SizedBox(height: 0), // No extra height needed
                      Text(
                        "Almost there!",
                        style: GoogleFonts.poppins(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Color.fromARGB(202, 3, 152, 85),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "Please enter the OTP code sent to your phone number for verification.",
                        textAlign: TextAlign.left,
                        style: GoogleFonts.poppins(
                            fontSize: 16, color: Colors.grey),
                      ),
                      const SizedBox(height: 30),
                      Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            TextFormField(
                              controller: otpController, // Use the correct controller here
                              keyboardType: TextInputType.number,
                              maxLength: 6,
                              decoration: InputDecoration(
                                labelText: 'OTP',
                                border: OutlineInputBorder(
                                  borderSide: BorderSide(
                                    color: isError ? Colors.red : Colors.grey,
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderSide: BorderSide(
                                    color: isError
                                        ? Colors.red
                                        : Color.fromARGB(201, 3, 152, 85),
                                    width: 1.5,
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderSide: BorderSide(
                                    color: Color.fromARGB(201, 3, 152, 85),
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
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  setState(() {
                                    isError = true;
                                  });
                                  return 'Please enter the OTP';
                                } else if (value.length != 6) {
                                  setState(() {
                                    isError = true;
                                  });
                                  return 'OTP must be exactly 6 digits';
                                } else {
                                  setState(() {
                                    isError = false;
                                  });
                                }
                                return null;
                              },
                            ),
                            SizedBox(height: 30),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () async {
                                  if (_formKey.currentState!.validate()) {
                                    String otpCode = otpController.text;
                                    print('$otpCode');
                                    if (otpCode.length == 6) {
                                      try {
                                        final cred = PhoneAuthProvider.credential(
                                          verificationId: widget.verificationId, 
                                          smsCode: otpCode,
                                        );
                                        await FirebaseAuth.instance.signInWithCredential(cred);
                                        // Check the default password
                                        final driverDoc = await db
                                            .collection('Driver')
                                            .where('PhoneNumber',
                                                isEqualTo: currentUser?.phoneNumber)
                                            .limit(1)
                                            .get();
                                            // Fetch driverId from the document
                                        final String driverId = driverDoc.docs.first.id;
                                        final bool isDefaultPassword =
                                            driverDoc.docs.first.data()['isDefaultPassword'];
                                        if (isDefaultPassword == false) {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(builder: (context) => BottomNavBar(driverId: driverId)),
                                          );
                                        } else {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(builder: (context) => Changepassword()),
                                          );
                                        }
                                      } catch (e) {
                                        log(e.toString());
                                        // Handle any errors during authentication
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text('Failed to verify OTP. Please try again.')),
                                        );
                                      }
                                    }
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Color.fromARGB(201, 3, 152, 85),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(15.0),
                                  ),
                                  padding: EdgeInsets.symmetric(vertical: 16),
                                ),
                                child: Text(
                                  'Send OTP',
                                  style: GoogleFonts.poppins(
                                    fontSize: 18,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(height: 500),
                          ],
                        ),
                      ),
                    ],
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
