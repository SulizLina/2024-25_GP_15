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
  final maxCharacter = 250;
  final _formKey = GlobalKey<FormState>();
  TextEditingController complaintText = TextEditingController();
  String? errorMessage;
  bool isInitialized = false;
  String initialdescription = "";

  @override
  void initState() {
    super.initState();

    // Fetch the initial complaint data and set the text once.
    getInitialComplaintData();

    // Add listener to handle character limit
    complaintText.addListener(_onDescriptionTextChanged);
  }

  Future<void> getInitialComplaintData() async {
    QuerySnapshot snapshot = await FirebaseFirestore.instance
        .collection('Complaint')
        .where('ComplaintID', isEqualTo: widget.complaint.ComID)
        .get();

    if (snapshot.docs.isNotEmpty) {
      var data = snapshot.docs.first.data() as Map<String, dynamic>?;
      complaintText.text = data?['Description'] ?? '';
      initialdescription = complaintText.text; 
    }
    setState(() {
      isInitialized = true;
    });
  }

  void _onDescriptionTextChanged() {
    setState(() {});

    // Enforce character limit
    if (complaintText.text.length > maxCharacter) {
      complaintText.text = complaintText.text.substring(0, maxCharacter);
      complaintText.selection = TextSelection.fromPosition(
        TextPosition(offset: complaintText.text.length),
      );
    }
  }

  bool get isTextChanged => complaintText.text != initialdescription;

  @override
  void dispose() {
    complaintText.dispose();
    super.dispose();
  }

  Future<bool> updateComplaintInFirebase(String description) async {
    try {
      User? currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser != null) {
        QuerySnapshot snapshot = await FirebaseFirestore.instance
            .collection('Complaint')
            .where('ComplaintID', isEqualTo: widget.complaint.ComID)
            .get();

        if (snapshot.docs.isNotEmpty) {
          for (var doc in snapshot.docs) {
            await doc.reference.update({'Description': description});
          }

          widget.onComplaintUpdated(description);
          return true;
        } else {
          setState(() {
            errorMessage = 'Complaint not found.';
          });
          return false;
        }
      } else {
        setState(() {
          errorMessage = 'User is not logged in.';
        });
        return false;
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to update complaint. Please try again.';
      });
      return false;
    }
  }

  Future<void> _updateComplaint() async {
    setState(() {
      errorMessage = null;
    });

    if (!isTextChanged) {
      _formKey.currentState?.validate();
      return;
    }

    if (_formKey.currentState != null && _formKey.currentState!.validate()) {
      String description = complaintText.text;
      bool updateSuccessful = await updateComplaintInFirebase(description);

      if (updateSuccessful) {
        SuccessMessageDialog.show(context, "Complaint updated successfully!");

        Future.delayed(Duration(seconds: 1), () {
          Navigator.pop(context);
        });
      }
    }
  }

  Stream<QuerySnapshot> getComplaintStream() {
    return FirebaseFirestore.instance
        .collection('Complaint')
        .where('ComplaintID', isEqualTo: widget.complaint.ComID)
        .snapshots();
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
                    if (!isInitialized)
                      CircularProgressIndicator() // Show loading indicator while initializing
                    else
                      TextFormField(
                        controller: complaintText,
                        maxLines: 5,
                        keyboardType: TextInputType.multiline,
                        inputFormatters: [
                          FilteringTextInputFormatter.deny(RegExp(r'\n')),
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
                          } else if (!isTextChanged) {
                            return 'Please edit your complaint';
                          }
                          return null;
                        },
                      ),
                    SizedBox(height: 8),
                    Text(
                      '${complaintText.text.length}/$maxCharacter characters',
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 12,
                      ),
                    ),
                    SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          if (isTextChanged) {
                            _updateComplaint();
                          } else {
                            _formKey.currentState!
                                .validate(); 
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isTextChanged
                              ? Color.fromARGB(202, 3, 152, 85)
                              : Colors.grey,
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
                    SizedBox(height: 190),
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
