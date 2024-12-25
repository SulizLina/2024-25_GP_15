import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:sairdriver/models/complaint.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/services/Complaint_database.dart';
import 'package:sairdriver/screens/EditComplaint.dart';
import 'package:sairdriver/screens/ViolationDetail.dart';
import 'package:sairdriver/messages/success.dart';
import 'package:sairdriver/messages/Warning.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:sairdriver/services/motorcycle_database.dart';
import 'package:sairdriver/models/motorcycle.dart';

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
  Violation? violation;
  Motorcycle? motorcycle;
  String? vioDocid;
  String? errorMessage;

  TextEditingController complainttext = TextEditingController();

  @override
  void initState() {
    super.initState();
    fetchComplaint().then((_) {
      if (complaint != null) {
        fetchMotor();
        fetchViolation();
      }
    });
  }

  Future<void> fetchComplaint() async {
    ComplaintDatabase db = ComplaintDatabase();
    complaint = await db.getComplaintById(widget.ComplaintID);
    if (mounted) {
      setState(() {
        complainttext.text = complaint?.Description ?? '';
      });
    }

    if (complaint != null && complaint!.Vid != null) {
      await fetchMotor();
    }
    setState(() {});
  }

  Future<void> fetchViolation() async {
    try {
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Violation')
          .where('violationID', isEqualTo: complaint?.Vid ?? "")
          .limit(1)
          .get();

      if (snapshot.docs.isNotEmpty) {
        final DocumentSnapshot doc = snapshot.docs.first;

        violation = Violation.fromJson(doc);
        vioDocid = doc.id;

        setState(() {
          vioDocid = doc.id;
        });
      }
    } catch (e) {
      print("Error fetching violation: $e");
      errorMessage = "Failed to load violation data.";
      setState(() {});
    }
  }

  Future<void> fetchMotor() async {
    if (complaint?.Vid != null) {
      MotorcycleDatabase mdb = MotorcycleDatabase();
      motorcycle = await mdb.getMotorcycleByIDhis(complaint!.Vid!);
      setState(() {});
    }
  }

  // Delete complaint in Firebase
  Future<bool> DeleteComplaintFromFirebase() async {
    try {
      User? currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser != null) {
        DocumentSnapshot snapshot = await FirebaseFirestore.instance
            .collection('Complaint')
            .doc(widget.ComplaintID)
            .get();

        if (snapshot.exists) {
          await snapshot.reference.delete();
          return true;
        } else {
          setState(() {
           
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
        errorMessage = 'Failed to delete complaint. Please try again.';
      });
      return false;
    }
  }

  Future<void> _DeleteComplaint() async {
    setState(() {
      errorMessage = null;
    });

    bool deleteSuccessful = await DeleteComplaintFromFirebase();

    if (deleteSuccessful) {
      SuccessMessageDialog.show(context, "Complaint deleted successfully!");
      Future.delayed(Duration(seconds: 1), () {
        Navigator.pop(context);
      });
    } else {
      SuccessMessageDialog.show(
          context, "Failed to delete the complaint. Please try again.");
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
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        child: StreamBuilder<DocumentSnapshot>(
          stream: FirebaseFirestore.instance
              .collection('Complaint')
              .doc(widget.ComplaintID)
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return Center(child: CircularProgressIndicator());
            }
            if (!snapshot.hasData || !snapshot.data!.exists) {
              return Center(
                child: Text(
                  '',
                  style: GoogleFonts.poppins(fontSize: 16, color: Colors.grey),
                ),
              );
            }

            // Safely retrieve Firestore document data
            final data = snapshot.data!.data();

            // Check if data is null
            if (data == null) {
              return Center(
                child: Text(
                  'No data available',
                  style: GoogleFonts.poppins(fontSize: 16, color: Colors.grey),
                ),
              );
            }

            // Parse data using Complaint model
            Complaint complaint = Complaint.fromJsonn(
                snapshot.data!.data() as Map<String, dynamic>);
            return SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.start,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'You can edit and delete the complaint only when pending',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: Colors.grey[400],
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    buildDetailSection(
                      'Complaint ID ',
                      complaint?.ComID ?? '',
                      HugeIcons.strokeRoundedFileEdit,
                    ),
                    const SizedBox(height: 15),
                    buildDetailSection(
                      'Time',
                      complaint?.getFormattedTime() ?? '',
                      HugeIcons.strokeRoundedClock03,
                    ),
                    const SizedBox(height: 15),
                    buildDetailSection(
                      'Date',
                      complaint?.getFormattedDate() ?? '',
                      HugeIcons.strokeRoundedCalendar01,
                    ),
                    const SizedBox(height: 15),
                    buildDetailSectionIcon(
                      'Status',
                      complaint?.Status ?? '',
                      complaint?.Status,
                    ),
                    const SizedBox(height: 15),
                    buildDetailSection(
                      'Complaint',
                      complaint?.Description!,
                      HugeIcons.strokeRoundedFileEdit,
                    ),
                    Divider(color: Colors.grey[350]),
                    const SizedBox(height: 15),
                    buildDetailSection('Violation ID', complaint?.Vid ?? '',
                        HugeIcons.strokeRoundedDoNotTouch02),
                    Divider(color: Colors.grey[350]),
                    const SizedBox(height: 15),
                    buildDetailSection(
                        'Motorcycle Brand',
                        motorcycle?.brand ?? '',
                        HugeIcons.strokeRoundedMotorbike02),
                    const SizedBox(height: 15),
                    buildDetailSection(
                        'Motorcycle Type',
                        motorcycle?.type ?? '',
                        HugeIcons.strokeRoundedMotorbike02),
                    const SizedBox(height: 15),
                    buildDetailSection(
                        'Motorcycle Model',
                        motorcycle?.model ?? '',
                        HugeIcons.strokeRoundedMotorbike02),
                    const SizedBox(height: 15),
                    buildDetailSectionWithImage('Motorcycle Licence Plate',
                        motorcycle?.licensePlate ?? ''),
                    const SizedBox(height: 15),
                    buildDetailSection(
                        'GPS Serial Number',
                        complaint?.gspNumber ?? '',
                        HugeIcons.strokeRoundedShareLocation01),
                    const SizedBox(height: 15),

                    //View Violation details
                    ElevatedButton(
                      onPressed: complaint != null
                          ? () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => Violationdetail(
                                    violationId: vioDocid ?? '',
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

                    //edit button if the Status is Pending
                    ElevatedButton(
                      onPressed:
                          (complaint != null && complaint!.Status == "Pending")
                              ? () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => editcomplaint(
                                        complaint: complaint!,
                                        driverid: widget.driverid,
                                        onComplaintUpdated: (newDesc) {
                                          setState(() {
                                            complainttext.text = newDesc;
                                          });
                                        },
                                      ),
                                    ),
                                  );
                                }
                              : () {
                                  showDialog(
                                    context: context,
                                    builder: (BuildContext context) {
                                      return const WarningDialog(
                                        message:
                                            "You can't edit the complaint unless the complaint status is pending",
                                      );
                                    },
                                  );
                                },
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            complaint != null && complaint!.Status == "Pending"
                                ? Color.fromARGB(202, 3, 152, 85)
                                : Colors.grey,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        textStyle: GoogleFonts.poppins(fontSize: 18),
                      ),
                      child: Text(
                        'Edit Complaint',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: (complaint != null &&
                              complaint!.Status == "Pending")
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
                                              color: Color.fromARGB(
                                                  202, 3, 152, 85),
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
                                              ElevatedButton(
                                                onPressed: () {
                                                  Navigator.of(context).pop();
                                                },
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: Colors.grey,
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            10),
                                                  ),
                                                ),
                                                child: Text(
                                                  'Cancel',
                                                  style: GoogleFonts.poppins(
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ),
                                              ElevatedButton(
                                                onPressed: () async {
                                                  Navigator.of(context).pop();
                                                  await _DeleteComplaint(); // Execute delete action
                                                },
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: Colors.red,
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            10),
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
                          : () {
                              showDialog(
                                context: context,
                                builder: (BuildContext context) {
                                  return const WarningDialog(
                                    message:
                                        "You can't delete the complaint unless the complaint status is pending",
                                  );
                                },
                              );
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            complaint != null && complaint!.Status == "Pending"
                                ? Colors.red
                                : Colors.grey,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        textStyle: GoogleFonts.poppins(fontSize: 18),
                      ),
                      child: Text(
                        'Delete Complaint',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    const SizedBox(height: 60),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget buildDetailSectionWithImage(String title, String? content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Image.asset(
              'assets/image/licenseplate.png',
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
            content ?? '',
            style: GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D)),
          ),
        ),
        const SizedBox(height: 20),
      ],
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
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.only(left: 32),
          child: Text(
            content ?? '',
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: Color(0xFF211D1D),
            ),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget buildDetailSectionIcon(String title, String? content, String? status) {
    Color circleColor;

    switch (status) {
      case 'Pending':
        circleColor = const Color(0xFFFFC800); //traffic yellow color
        break;
      case 'Accepted':
        circleColor = Colors.green;
        break;
      default:
        circleColor = Colors.red;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            SizedBox(
              width: 25,
              child: Container(
                decoration: BoxDecoration(
                  color: circleColor,
                  shape: BoxShape.circle,
                ),
                width: 10,
                height: 10,
              ),
            ),
            const SizedBox(width: 8),
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
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.only(left: 32),
          child: Text(
            content ?? '',
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: Color(0xFF211D1D),
            ),
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget buildDetailSectionNoContent(String title, IconData? icon) {
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
        const SizedBox(height: 20),
      ],
    );
  }
}
