import 'dart:math';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'home.dart';

class Otppage extends StatefulWidget {
  final String verificationId;

  const Otppage({super.key, required this.verificationId});

  @override
  State<Otppage> createState() => _OtppageState();
}

class _OtppageState extends State<Otppage> {
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
                    onChanged: (value) {
                      if (value.length == 1) {
                        FocusScope.of(context).nextFocus();
                      }
                    },
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.grey.shade200,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    style: Theme.of(context).textTheme.headlineMedium,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    inputFormatters: [
                      LengthLimitingTextInputFormatter(1),
                      FilteringTextInputFormatter.digitsOnly,
                    ],
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 30),
          ElevatedButton(
            onPressed: () async {
              try {
                final cred = PhoneAuthProvider.credential(
                    verificationId: widget.verificationId,
                    smsCode: otpController.text);

                await FirebaseAuth.instance.signInWithCredential(cred);
                Navigator.push(
                    context, MaterialPageRoute(builder: (context) => Home()));
              } catch (e) {
                log(e.toString());
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Color.fromARGB(202, 3, 152, 85),
              padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 15),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              "Verify",
              style: GoogleFonts.poppins(fontSize: 18),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text("Didn’t receive any code?"),
              const SizedBox(width: 5),
              Text(
                "Resend Again",
                style:
                    GoogleFonts.poppins(color: Color.fromARGB(202, 3, 152, 85)),
              ),
            ],
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}
