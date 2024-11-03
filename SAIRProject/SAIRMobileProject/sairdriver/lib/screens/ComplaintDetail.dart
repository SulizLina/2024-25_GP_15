import 'dart:ffi';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:sairdriver/models/complaint.dart';
import 'package:sairdriver/screens/ViolationDetail.dart';
import 'package:sairdriver/services/Complaint_database.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/RaiseCompliants.dart';
import 'package:hugeicons/hugeicons.dart';

class Complaintdetail extends StatefulWidget {
  final String ComplaintID;
  final String driverid;

  const Complaintdetail(
      {Key? key, required this.ComplaintID, required this.driverid})
      : super(key: key);

  @override
  State<Complaintdetail> createState() => _ComplaintdetailState();
}

class _ComplaintdetailState extends State<Complaintdetail> {
  Complaint? complaint;

Future<void> fetchComplaint() async {
  ComplaintDatabase db = ComplaintDatabase();
  Complaint? fetchedComplaint = await db.getComplaintById(widget.ComplaintID);
  if (fetchedComplaint != null) {
    setState(() {
      complaint = fetchedComplaint;
    });
  } else {
    // Handle case where no complaint is found
    setState(() {
      complaint = null;
    });
  }
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
            Expanded(
              // Allows the text to take up remaining space
              child: Text(
                "Complaint Details", // Adjust the text as needed
                style: GoogleFonts.poppins(
                  fontSize: 20, // Font size to match the image
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFFAFAFF), // Color for the text
                ),
                textAlign: TextAlign.start, // Align text to the start
              ),
            ),
          ],
        ),
      ),
      backgroundColor: Color.fromARGB(255, 3, 152, 85),
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
        child: SingleChildScrollView(
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  buildDetailSection('Violation ID', complaint?.Vid ?? '',
                      HugeIcons.strokeRoundedDoNotTouch02),
                  Divider(color: Colors.grey[350]),
                  const SizedBox(height: 15),
                  buildDetailSection(
                    'Complaint: ',
                    complaint?.Description ?? '',
                    HugeIcons.strokeRoundedFileEdit,
                  ),

                  const SizedBox(height: 15),
                  buildComplaintStatus(complaint?.Status),
                  const SizedBox(height: 30),

                  ElevatedButton(
                    onPressed: () {
                      // Navigate to Violation details
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => Violationdetail(
                            violationId: complaint!.Vid?? '',
                            driverid: widget.driverid,
                          ),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color.fromARGB(202, 3, 152, 85),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      textStyle: GoogleFonts.poppins(fontSize: 18),
                    ),
                    child: Text(
                      'View Violation',
                      style: GoogleFonts.poppins(
                          color: Colors.white, fontSize: 16),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget buildDetailSection(String title, String? content, IconData? icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 24, color: Color.fromARGB(255, 3, 152, 85)),
              const SizedBox(width: 8),
            ],
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF211D1D),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8), // Space between title and content
        Padding(
          padding: const EdgeInsets.only(
              left: 32), // Indent the content a bit for better visual hierarchy
          child: Text(
            content ?? 'N/A',
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: Color(0xFF211D1D),
            ),
          ),
        ),
        const SizedBox(height: 20), // Add space below each section
      ],
    );
  }

  Widget buildComplaintStatus(String? status) {
    Color statusColor;

    // Determine the color based on the status
    if (status == 'pending') {
      statusColor = Colors.yellow;
    } else if (status == 'accepted') {
      statusColor = Colors.green;
    } else {
      statusColor = Colors.red;
    }

    return Row(
      children: [
        Text(
          'Complaint Status: ',
          style: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Color(0xFF211D1D),
          ),
        ),
        const SizedBox(width: 8), // Space between title and colored circle
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: statusColor,
          ),
        ),
        const SizedBox(width: 8), // Additional spacing
        Text(
          status??'',
          style: GoogleFonts.poppins(
            fontSize: 14,
            color: Color(0xFF211D1D),
          ),
        ),
      ],
    );
  }

  void submitComplint() {
    Navigator.of(context).pop(); ///////////////?
  }
}
