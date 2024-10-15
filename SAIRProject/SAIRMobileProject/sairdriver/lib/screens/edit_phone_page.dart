import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart'; // For Firebase Firestore
import 'package:firebase_auth/firebase_auth.dart'; // For Firebase Authentication
import 'package:sairdriver/messages/error_messages.dart';
import 'package:sairdriver/messages/success_dialog.dart';
import 'package:sairdriver/messages/phone_validator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/profilepage.dart';

class EditPhonePage extends StatefulWidget {
   final String driverId;  // DriverID passed from previous page
EditPhonePage({required this.driverId});
  @override
  _EditPhonePageState createState() => _EditPhonePageState();
}

class _EditPhonePageState extends State<EditPhonePage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _phoneController = TextEditingController();
  String? errorMessage;

  // Function to check if phone number is taken
  Future<bool> isPhoneNumberTaken(String phoneNumber) async {
    final querySnapshot = await FirebaseFirestore.instance
        .collection('Driver')
        .where('PhoneNumber', isEqualTo: phoneNumber)
        .get();

    return querySnapshot.docs.isNotEmpty;
  }

  // Function to update phone number in Firebase
  Future<void> updatePhoneNumberInFirebase(String phoneNumber) async {
    try {
      //User? currentUser = FirebaseAuth.instance.currentUser;
      //if (currentUser != null) {
      // Update phone number in the Firestore document for the user
      await FirebaseFirestore.instance
          .collection('Driver')
          .doc(widget.driverId) // Use currentUser.uid
          .update({
        'PhoneNumber': phoneNumber,
      });
      // } /else {
      // setState(() {
      // errorMessage = 'User is not logged in.';
      // });
      // }
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to update phone number. Please try again.';
      });
    }
  }

  // Function to show success dialog and navigate to profile page
  void showSuccessDialog(BuildContext context) {
  showDialog(
    context: context,
    builder: (context) {
      return AlertDialog(
        title: Text(
          'Success',
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            color: Color.fromARGB(201, 3, 152, 85),
          ),
        ),
        content: Text(
          'Phone number updated successfully.',
          style: GoogleFonts.poppins(
            fontSize: 16,
          ),
        ),
        actions: <Widget>[
         
          // OK Button
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close the dialog
             
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Color.fromARGB(201, 3, 152, 85), // Green background color
            ),
            child: Text(
              'OK',
              style: GoogleFonts.poppins(color: Colors.white),
            ),
          ),
        ],
      );
    },
  );
}


  // Function to handle phone number update
  Future<void> _updatePhoneNumber() async {
    setState(() {
      errorMessage = null;
    });
    if (_formKey.currentState != null && _formKey.currentState!.validate()) {
      String phoneNumber = _phoneController.text;

      // Check if the phone number is already taken
      bool isTaken = await isPhoneNumberTaken(phoneNumber);
      if (isTaken) {
        setState(() {
          errorMessage = PHONE_TAKEN_ERROR; // From error_messages.dart
        });
        return;
      }

      // Update the phone number in Firebase
      await updatePhoneNumberInFirebase(phoneNumber);

      // Show confirmation
      showSuccessDialog(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    
    return Scaffold(
      backgroundColor: Color.fromARGB(255, 3, 152, 85),
      appBar: AppBar(
      automaticallyImplyLeading: false,
      elevation: 0,
      backgroundColor: Color.fromARGB(255, 3, 152, 85), // Background color
      toolbarHeight: 100, // Adjusted toolbar height for the row layout
      iconTheme: const IconThemeData(color: Color(0xFFFAFAFF)), // Arrow color
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
              "Update Phone Number", // Adjust the text as needed
              style: GoogleFonts.poppins(
                fontSize: 22, // Font size to match the image
                fontWeight: FontWeight.bold,
                color: Color(0xFFFAFAFF), // Color for the text
              ),
              textAlign: TextAlign.start, // Align text to the start
            ),
          ),
        ],
      ),
    ),

      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16),
        decoration: const BoxDecoration(
          color: Color(0xFFF3F3F3),
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
                'Update Your Phone Number',
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(201, 3, 152, 85),
                ),
              ),
              
              SizedBox(height: 8), // Space between heading and input field

              // Subtitle text
              Text(
                'Write Your New Phone Number Below.',
                style: GoogleFonts.poppins(fontSize: 14, color: Colors.grey),
              ),
              SizedBox(height: 20),

              SizedBox(height: 10),
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
                      color: errorMessage == null
                          ? Color.fromARGB(
                              201, 3, 152, 85) // Green border if no error
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
                validator: validatePhoneNumber, // Phone validator logic
              ),
              SizedBox(height: 10),
              // Error Message Display
              if (errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: Text(
                    errorMessage!,
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
              // Update Button with Green Background
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _updatePhoneNumber,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color.fromARGB(201, 3, 152, 85),
                    shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(15.0), // Rounded corners
                    ),
                    padding: EdgeInsets.symmetric(
                        vertical: 16), // Add vertical padding
                  ),
                  child: Text(
                    'Update',
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
     ), );
  }
}
