import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sairdriver/screens/regulationOnboarding.dart';
import 'package:sairdriver/messages/success.dart';

class Changepassword extends StatefulWidget {
  final String driverId; 
  const Changepassword({required this.driverId});

  @override
  State<Changepassword> createState() => _ChangepasswordState();
}

class _ChangepasswordState extends State<Changepassword> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;

  // Password requirement flags
  bool hasMinLength = false;
  bool hasUpperLowerCase = false;
  bool hasNumber = false;
  bool hasSpecialChar = false;
  bool hasUserTyped = false;

  // Function to validate password dynamically
  void _validatePassword(String password) {
    setState(() {
      hasUserTyped = true;
      hasMinLength = password.length >= 8;
      hasUpperLowerCase = password.contains(RegExp(r'(?=.*[a-z])(?=.*[A-Z])'));
      hasNumber = password.contains(RegExp(r'[0-9]'));
      hasSpecialChar = password.contains(RegExp(r'[!@#\$%^&*_\-]'));
    });
  }

  // Function to handle password update
  Future<void> _changePassword() async {
    if (_formKey.currentState!.validate()) {
      try {
        User? currentUser = FirebaseAuth.instance.currentUser;

        if (currentUser != null) {
          await currentUser.updatePassword(_passwordController.text);

          await FirebaseFirestore.instance
              .collection('Driver')
              .doc(widget.driverId)
              .update({
            'isDefaultPassword': false,
          });

          // Show success dialog once password is updated
          SuccessMessageDialog.show(
            context,
            'Your password has been updated successfully!',
          );

          // Navigate to the BottomNavBar after showing the dialog
          Future.delayed(Duration(seconds: 2), () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) =>
                    RegulationOnboarding(driverId: widget.driverId),
              ),
            );
          });
        } else {
          // Handle the case where the user is not logged in
          print('User is not logged in.');
        }
      } catch (e) {
        // Handle errors during password update
        print('Failed to update password: $e');
        showDialog(
          context: context,
          builder: (BuildContext context) {
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
                      "Error",
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                      ),
                    ),
                    SizedBox(height: 20),
                    Text(
                      'Failed to update password. Please try again.',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop(); 
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
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
                Navigator.pop(context);
              },
            ),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                "Set Your Password",
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
      resizeToAvoidBottomInset:
          true, 
      body: SingleChildScrollView(
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.only(top: 16),
          decoration: const BoxDecoration(
            color: Color(0xFFFAFAFF),
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
                    'Set Your Password',
                    style: GoogleFonts.poppins(
                      fontSize: 21,
                      fontWeight: FontWeight.bold,
                      color: Color.fromARGB(201, 3, 152, 85),
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Write Your New Password Below.',
                    style:
                        GoogleFonts.poppins(fontSize: 14, color: Colors.grey),
                  ),
                  SizedBox(height: 20),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: !_isPasswordVisible,
                    onChanged: _validatePassword,
                    decoration: InputDecoration(
                      labelText: 'Enter Your New Password',
                      suffixIcon: IconButton(
                        icon: Icon(
                          _isPasswordVisible
                              ? Icons.visibility
                              : Icons.visibility_off,
                          color: Colors.grey,
                        ),
                        onPressed: () {
                          setState(() {
                            _isPasswordVisible = !_isPasswordVisible;
                          });
                        },
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: Color.fromARGB(201, 3, 152, 85),
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
                        return 'Please enter your password';
                      }
                      // Check if the password meets all the requirements
                      if (!hasMinLength ||
                          !hasUpperLowerCase ||
                          !hasNumber ||
                          !hasSpecialChar) {
                        return 'Your password is weak.';
                      }
                      return null; // Password is valid
                    },
                  ),
                  SizedBox(height: 16),

                  TextFormField(
                    controller: _confirmPasswordController,
                    obscureText:
                        !_isConfirmPasswordVisible, 
                    decoration: InputDecoration(
                      labelText: 'Re-enter your new password',
                      suffixIcon: IconButton(
                        icon: Icon(
                          _isConfirmPasswordVisible
                              ? Icons.visibility
                              : Icons.visibility_off,
                          color: Colors.grey,
                        ),
                        onPressed: () {
                          setState(() {
                            _isConfirmPasswordVisible =
                                !_isConfirmPasswordVisible;
                          });
                        },
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: Color.fromARGB(
                              201, 3, 152, 85), 
                          width: 1.5,
                        ),
                        borderRadius:
                            BorderRadius.circular(10), 
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: Color.fromARGB(
                              201, 3, 152, 85),
                          width: 2.0,
                        ),
                        borderRadius:
                            BorderRadius.circular(10), 
                      ),
                      errorBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: Colors.red,
                          width: 1.5,
                        ),
                        borderRadius:
                            BorderRadius.circular(10), 
                      ),
                      focusedErrorBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: Colors
                              .red,
                          width: 2.0,
                        ),
                        borderRadius:
                            BorderRadius.circular(10),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please confirm your password';
                      } else if (value != _passwordController.text) {
                        return 'Passwords do not match';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 24),

                  // Password requirements section
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Password must:',
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          color: Color(0xFF211D1D),
                        ),
                      ),
                      SizedBox(height: 8),
                      _buildRequirementText(
                          'Contain at least 8 characters', hasMinLength, '•'),
                      _buildRequirementText(
                          'Contain both uppercase and lowercase letters',
                          hasUpperLowerCase, '•'),
                      _buildRequirementText(
                          'Contain at least one number', hasNumber, '•'),
                      _buildRequirementText(
                          'Contain at least one special character (!@#\$%^&*)',
                          hasSpecialChar, '•'),
                    ],
                  ),
                  SizedBox(height: 32),

                  // Update Button with Green Background
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        // Show confirmation dialog before proceeding with password change
                        if (_formKey.currentState!.validate()) {
                          _changePassword();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            Color.fromARGB(201, 3, 152, 85), 
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(15.0), 
                        ),
                        padding: EdgeInsets.symmetric(
                            vertical: 16), 
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
                  SizedBox(height: 220,),
                ],
              ),
            ),
          ),
        ),
  
      ),
    );
  }

  // Helper method to build password requirement text with dynamic color
  Widget _buildRequirementText(String text, bool isValid, String bullet) {
    Color textColor;

    if (!hasUserTyped) {
      textColor = Colors.grey;
    } else if (isValid) {
      textColor = Colors.green;
    } else {
      textColor = Colors.red;
    }

  return Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        bullet,
        style: GoogleFonts.poppins(
          fontSize: 14,
          color: Color(0xFF211D1D),
          height: 1.5,
        ),
      ),
      const SizedBox(width: 8), // Space between bullet and text
      Expanded(
        child: Text(
          text,
          style: GoogleFonts.poppins(
            fontSize: 14,
            color: textColor,
            height: 1.5,
          ),
        ),
      ),
    ],
  );
  }
}
