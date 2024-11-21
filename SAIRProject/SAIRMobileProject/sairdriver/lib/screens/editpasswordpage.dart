import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:sairdriver/messages/confirm.dart';
import 'package:sairdriver/messages/success.dart';

class Editpasswordpage extends StatefulWidget {
  final String driverId; // DriverID passed from previous page
  Editpasswordpage({required this.driverId});

  @override
  _EditpasswordpageState createState() => _EditpasswordpageState();
}

class _EditpasswordpageState extends State<Editpasswordpage> {
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

  // Function to show the confirmation dialog before updating the password
  void _showConfirmationDialog() {
    ConfirmationDialog.show(
      context,
      'Confirm Password Change',
      'Are you sure you want to change your password?',
      () {
        _changePassword(); // Proceed with password update
      },
      onCancel: () {
        // Optionally handle the cancel action if needed
      },
    );
  }

  // Function to reauthenticate the user
  Future<void> _reauthenticateUser() async {
    final emailController = TextEditingController();
    final passwordController = TextEditingController();

    return showDialog<void>(
      context: context,
      barrierDismissible: false,
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
                  'Reauthentication Required',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 20),
                Text(
                  'For security reasons, please re-enter your email and password to continue.',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 20),
                TextField(
                  controller: emailController,
                  decoration: InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                SizedBox(height: 8),
                TextField(
                  controller: passwordController,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  obscureText: true,
                ),
                SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop(); // Close the dialog
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        "Cancel",
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                        ),
                      ),
                    ),
                    SizedBox(width: 20),
                    ElevatedButton(
                      onPressed: () async {
                        try {
                          User? user = FirebaseAuth.instance.currentUser;
                          final credential = EmailAuthProvider.credential(
                            email: emailController.text.trim(),
                            password: passwordController.text.trim(),
                          );

                          await user?.reauthenticateWithCredential(credential);
                          Navigator.of(context).pop(); // Close the dialog
                          _changePassword(); // Retry changing the password
                        } catch (e) {
                          // Show error if reauthentication fails
                          ConfirmationDialog.show(
                            context,
                            'Reauthentication Failed',
                            'Please check your credentials and try again.',
                            () {
                              Navigator.of(context).pop(); // Close the dialog
                            },
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color.fromARGB(201, 3, 152, 85),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        "Reauthentication",
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Function to handle password update
  Future<void> _changePassword() async {
    if (_formKey.currentState!.validate()) {
      try {
        final newPassword = _passwordController.text;
        User? user = FirebaseAuth.instance.currentUser;
        await user!.updatePassword(newPassword);
 Navigator.of(context).pop(); // 
        // Show success dialog once password is updated
        SuccessMessageDialog.show(
          context,
          'Your password has been updated successfully!',
        );

      } catch (e) {
        if (e is FirebaseAuthException && e.code == 'requires-recent-login') {
          // If the error is due to requiring recent login, reauthenticate the user
          await _reauthenticateUser();
        } else {
          // Handle other errors during password update
          print('Failed to update password: $e');
          // Display error dialog using the same style as other dialogs
          ConfirmationDialog.show(
            context,
            'Error',
            'Failed to update password. Please try again.',
            () {
              Navigator.of(context).pop(); // Close the dialog
            },
          );
        }
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
                "Update Your Password",
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
      body: SingleChildScrollView(
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.only(top: 16.0),
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
                    'Update Your Password',
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
                    obscureText: !_isConfirmPasswordVisible,
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
                        return 'Please confirm your password';
                      } else if (value != _passwordController.text) {
                        return 'Passwords do not match';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 24),
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
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        if (_formKey.currentState!.validate()) {
                          _showConfirmationDialog();
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
                        'Update',
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  SizedBox(
                    height: 165,
                  )
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