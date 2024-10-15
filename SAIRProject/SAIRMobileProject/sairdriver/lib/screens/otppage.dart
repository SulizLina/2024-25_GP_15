import 'dart:developer';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/Forgotpass.dart';
import 'package:sairdriver/screens/Resetpass.dart';

class Otppage extends StatefulWidget {
  final String verificationId;

  const Otppage({super.key, required this.verificationId});

  @override
  State<Otppage> createState() => _OtppageState();
}

class _OtppageState extends State<Otppage> {
  final _formKey = GlobalKey<FormState>();
  final _otpController = TextEditingController();
  bool isError = false;

  @override
  Widget build(BuildContext context) {
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
                MaterialPageRoute(builder: (context) => const Forgotpass()));
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
                    crossAxisAlignment:
                        CrossAxisAlignment.start, // Left-align the text
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
                              controller: _otpController,
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
                            SizedBox(
                              height: 30,
                            ),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () async {
                                  if (_formKey.currentState!.validate()) {
                                    String otpCode = _otpController.text;
                                    if (otpCode.length == 6) {
                                      try {
                                        final cred =
                                            PhoneAuthProvider.credential(
                                          verificationId: widget.verificationId,
                                          smsCode: otpCode,
                                        );
                                        // Navigate to reset password page
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                              builder: (context) =>
                                                  Resetpass()),
                                        );
                                      } catch (e) {
                                        log(e.toString());
                                        // Show error to user
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          SnackBar(
                                            content: Text(
                                                "Failed to verify OTP. Please try again."),
                                          ),
                                        );
                                      }
                                    }
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor:
                                      Color.fromARGB(201, 3, 152, 85),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(
                                        15.0), // Rounded corners
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
                            SizedBox(
                              height: 500,
                            )
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


      /*
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
        child:Padding(
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
           // New Password Input Field with Green Border and Eye Icon
              TextFormField(
                decoration: InputDecoration(
                  labelText: 'Enter Your New Password',
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color:
                          Color.fromARGB(201, 3, 152, 85), // Green border color
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10), // Rounded corners
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: Color.fromARGB(
                          201, 3, 152, 85), // Green border when focused
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10), // Rounded corners
                  ),
                  errorBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: Colors.red, // Red border color for error state
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10), // Rounded corners
                  ),
                  focusedErrorBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color:
                          Colors.red, // Red border color when focused and error
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10), // Rounded corners
                  ),
                ),
                
              ),
              SizedBox(height: 16),
            const SizedBox(height: 30),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: 16.0, horizontal: 32.0),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                backgroundColor:  Color.fromARGB(202, 3, 152, 85),
              ),
              onPressed: () async {
                String otpCode = otpController.text;
                if (otpCode.length == 6) {
                  try {
                    final cred = PhoneAuthProvider.credential(
                      verificationId: widget.verificationId, // Use the verificationId passed to the widget
                      smsCode: otpCode,
                    );
                    // Proceed with further actions like resetting the password
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => Resetpass()),
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
      ),
     ), );
  }
}
*/