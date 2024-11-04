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

  @override
  void initState() {
    super.initState();
    fetchComplaint();
  }

  Future<void> fetchComplaint() async {
    ComplaintDatabase db = ComplaintDatabase();
    complaint = await db.getComplaintById(widget.ComplaintID);
    if (complaint != null) {
      setState(() {});
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
                "Complaint Details",
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFFAFAFF),
                ),
                textAlign: TextAlign.start,
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
                  const SizedBox(height: 15),
                  buildDetailSection('Violation ID', complaint?.Vid ?? '',
                      HugeIcons.strokeRoundedDoNotTouch02),
                  Divider(color: Colors.grey[350]),
                  const SizedBox(height: 15),
                  buildDetailSection(
                    'Complaint ID: ',
                    complaint?.Description ?? '',
                    HugeIcons.strokeRoundedFileEdit,
                  ),
                  const SizedBox(height: 15),
                  buildDetailSectionWithImage(
                      'Status', complaint?.Status ?? ''),
                  const SizedBox(height: 15),
                  buildDetailSection(
                    'Complaint: ',
                    complaint?.Description ?? '',
                    HugeIcons.strokeRoundedFileEdit,
                  ),
                  const SizedBox(height: 70),
                  ElevatedButton(
                    onPressed: complaint != null
                        ? () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => Violationdetail(
                                  violationId: complaint!.Vid!,
                                  driverid: widget.driverid,
                                ),
                              ),
                            );
                          }
                        : null,
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
                  ElevatedButton(
                    onPressed: (complaint?.Vid != null &&
                            complaint!.Vid!.isNotEmpty)
                        ? () {
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
                                          "Delete",
                                          style: GoogleFonts.poppins(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color:
                                                Color.fromARGB(202, 3, 152, 85),
                                          ),
                                        ),
                                        SizedBox(height: 20),
                                        Text(
                                          'Are you sure that you want to delete the complaint?',
                                          style: GoogleFonts.poppins(
                                            fontSize: 16,
                                          ),
                                          textAlign: TextAlign.center,
                                        ),
                                        SizedBox(height: 20),
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceEvenly,
                                          children: [
                                            // Cancel Button
                                            ElevatedButton(
                                              onPressed: () {
                                                Navigator.of(context).pop();
                                              },
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.grey,
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                              ),
                                              child: Text(
                                                'Cancel',
                                                style: GoogleFonts.poppins(
                                                  color: Colors.white,
                                                ),
                                              ),
                                            ),
                                            // Logout Button
                                            ElevatedButton(
                                              onPressed: () {
                                                Navigator.of(context).pop();
                                              },
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors
                                                    .red, // Red background for the Logout button
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                              ),
                                              child: Text(
                                                'Delete',
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
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      textStyle: GoogleFonts.poppins(fontSize: 18),
                    ),
                    child: Text(
                      'Delete Complaint',
                      style: GoogleFonts.poppins(
                          color: Colors.white, fontSize: 16),
                    ),
                  ),
                  const SizedBox(height: 43),
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

  Widget buildDetailSectionWithImage(String title, String? content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Image.asset(
              'assets/icons/CRASHiconCrash.png',
              width: 30,
              height: 30,
              color: Color.fromARGB(255, 3, 152, 85),
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Color(0xFF211D1D),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.only(left: 32),
          child: Text(
            content ?? 'N/A',
            style: GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D)),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}
