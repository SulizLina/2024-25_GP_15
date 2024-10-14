import 'dart:developer';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sairdriver/screens/changepassword.dart';
import 'package:sairdriver/screens/home.dart';

class LoginOtp extends StatefulWidget {
  final String verificationId;
  const LoginOtp({super.key, required this.verificationId});

  @override
  State<LoginOtp> createState() => _LoginOtpState();
}

class _LoginOtpState extends State<LoginOtp> {
  final otpController = TextEditingController();
  final db = FirebaseFirestore.instance;
  User? get currentUser => FirebaseAuth.instance.currentUser;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            "Almost there!",
            style: GoogleFonts.poppins(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color.fromARGB(202, 3, 152, 85),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            "Please enter the OTP code sent to your phone number for verification.",
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(fontSize: 16),
          ),
          const SizedBox(height: 30),
          Form(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(6, (index) {
                return SizedBox(
                  height: 68,
                  width: 64,
                  child: TextFormField(
                    controller: otpController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(1)
                    ],
                    onChanged: (value) {
                      if (value.length == 1) {
                        FocusScope.of(context).nextFocus();
                      }
                    },
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.grey.shade200,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(fontSize: 20),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 30),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              padding: EdgeInsets.symmetric(vertical: 16.0, horizontal: 32.0),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onPressed: () async {
              String otpCode = otpController.text;
              if (otpCode.length == 6) {
                try {
                  final cred = PhoneAuthProvider.credential(
                    verificationId: widget
                        .verificationId, // Use the verificationId passed to the widget
                    smsCode: otpCode,
                  );
                  await FirebaseAuth.instance.signInWithCredential(cred);
                  //check the defult password
                  final driverDoc = await db
                      .collection('Driver')
                      .where('PhoneNumber', isEqualTo: currentUser?.phoneNumber)
                      .limit(1)
                      .get();
                  final bool isDefaultPassword =
                      driverDoc.docs.first.data()['isDefaultPassword'];
                  if (isDefaultPassword == false) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => Home()),
                    );
                  } else {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => Changepassword()),);

                  }
                } catch (e) {
                  log(e.toString());
                }
              } else {
                 // Handle case where the driver document is not found
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Driver data not found')),
  );
              }
            },
            child: Text(
              "Verify",
              style: GoogleFonts.poppins(
                color: Colors.white,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
