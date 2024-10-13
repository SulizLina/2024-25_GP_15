import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sairdriver/screens/home.dart';

class LoginOtp extends StatefulWidget {
    final String verificationId;
  const LoginOtp({super.key, required this.verificationId});

  @override
  State<LoginOtp> createState() => _LoginOtpState();
}

class _LoginOtpState extends State<LoginOtp> {
final otpController = TextEditingController();

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
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(1)],
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
                    verificationId: widget.verificationId, // Use the verificationId passed to the widget
                    smsCode: otpCode,
                  );
                  await FirebaseAuth.instance.signInWithCredential(cred);
                  //check the defult password
                  
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => Home()),
                  );
                } catch (e) {
                  log(e.toString());
                }
              } else {
                // Show an error to the user.
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