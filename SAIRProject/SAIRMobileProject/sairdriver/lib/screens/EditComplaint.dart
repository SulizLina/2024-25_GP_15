import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/models/complaint.dart';
import 'package:sairdriver/messages/success.dart';
import 'package:flutter/services.dart';
import 'package:firebase_auth/firebase_auth.dart';

class editcomplaint extends StatefulWidget {
  final Complaint complaint;
  final String driverid;
  final Function(String) onComplaintUpdated;

  const editcomplaint(
      {Key? key,
      required this.complaint,
      required this.driverid,
      required this.onComplaintUpdated});

  @override
  State<editcomplaint> createState() => _editcomplaintState();
}

class _editcomplaintState extends State<editcomplaint> {
  //final _controller = TextEditingController();
  final maxChararcter = 250;
  final _formKey = GlobalKey<FormState>();
  TextEditingController complainttext = TextEditingController();
  String? errorMessage;

  @override
  void initState() {
    super.initState();
      complainttext.text = widget.complaint.Description ?? '';

    complainttext.addListener(() {
      if (complainttext.text.length > maxChararcter) {
        complainttext.text = complainttext.text.substring(0, maxChararcter);
        complainttext.selection = TextSelection.fromPosition(
          TextPosition(offset: complainttext.text.length),
        );
      }
      setState(() {});
    });
  }

  @override
  void dispose() {
    complainttext.dispose();
    super.dispose();
  }

  //Update complaint description in Firebase
  Future<void> updateComplaintInFirebase(String description) async {
    try {
      User? currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser != null) {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Complaint')
          .where('ComplaintID', isEqualTo: widget.complaint.ComID)
          .get();

      if (snapshot.docs.isNotEmpty) {
        // Loop through the matching documents and update each
        for (var doc in snapshot.docs) {
          await doc.reference.update({'Description': description});
        }
        
        // Call the callback function to update the UI
        widget.onComplaintUpdated(description);
      } else {
        setState(() {
          errorMessage = 'Complaint not found.';
        });
      }
    } else {
      setState(() {
        errorMessage = 'User is not logged in.';
      });
    }
  } catch (e) {
    setState(() {
      errorMessage = 'Failed to update complaint. Please try again.';
    });
  }
}

  Future<void> _updateComplaint() async {
    setState(() {
      errorMessage = null; //if new==privios => error msg???
    });

    if (_formKey.currentState != null && _formKey.currentState!.validate()) {
      String description = complainttext.text;
      complainttext.text = description;

    // Show a confirmation message
    SuccessMessageDialog.show(context, "Complaint updated successfully!");

    // Close the current screen after showing the dialog
    Future.delayed(Duration(seconds: 2), () {
      Navigator.pop(context);
    });
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
                "Update Complaint",
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
      body: GestureDetector(
        onTap: () {
          FocusScope.of(context).unfocus();
        },
        child: SingleChildScrollView(
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
                      'Update complaint on violation number: ${widget.complaint.Vid}',
                      style: GoogleFonts.poppins(
                        fontSize: 21,
                        fontWeight: FontWeight.bold,
                        color: Color.fromARGB(201, 3, 152, 85),
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Describe your complaint about the violation below',
                      style:
                          GoogleFonts.poppins(fontSize: 14, color: Colors.grey),
                    ),
                    SizedBox(height: 15),
                    TextFormField(
                      controller: complainttext,
                      maxLines: 5, // Allow text to wrap within the field
                      keyboardType: TextInputType
                          .multiline, // Supports multi-line wrap without newlines
                      inputFormatters: [
                        FilteringTextInputFormatter.deny(
                            RegExp(r'\n')), // Block newline input
                      ],
                      decoration: InputDecoration(
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
                          return 'Please enter your complaint';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 8),
                    Text(
                      '${complainttext.text.length}/$maxChararcter characters',
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 12,
                      ),
                    ),
                    SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _updateComplaint, //update method
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
                    SizedBox(height: 165),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
