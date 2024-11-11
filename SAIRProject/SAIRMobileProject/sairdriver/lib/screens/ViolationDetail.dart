import 'dart:ui' as ui;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/screens/RaiseCompliants.dart';
import 'package:sairdriver/screens/ComplaintDetail.dart';
import 'package:sairdriver/services/Violations_database.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:sairdriver/services/motorcycle_database.dart';
import 'package:sairdriver/models/motorcycle.dart';
import 'package:hugeicons/hugeicons.dart';

class Violationdetail extends StatefulWidget {
  final String violationId;
  final String driverid;

  const Violationdetail(
      {Key? key, required this.violationId, required this.driverid})
      : super(key: key);

  @override
  State<Violationdetail> createState() => _ViolationdetailState();
}

class _ViolationdetailState extends State<Violationdetail> {
  bool hasComplaint = false;
  String? compID;

  @override
  void initState() {
    super.initState();
    fetchViolation();
    loadCustomMapIcon();
    fetchMotor();
    checkIfComplaintExists();
  }

  BitmapDescriptor? customMapIcon;
  Future<void> loadCustomMapIcon() async {
    customMapIcon = await getCustomMapIcon();
    setState(() {});
  }

  BitmapDescriptor markerIcon = BitmapDescriptor.defaultMarker;
  static const LatLng defaultLoc = LatLng(0.0, 0.0);
  Violation? violation;
  Motorcycle? motorcycle;

  Future<void> fetchViolation() async {
    ViolationsDatabase db = ViolationsDatabase();
    violation = await db.getViolationById(widget.violationId);

    if (violation != null && violation!.gspNumber != null) {
      print(violation?.gspNumber);
      await fetchMotor();
    }
    setState(() {});
  }

  Future<void> fetchMotor() async {
    if (violation?.Vid != null) {
      MotorcycleDatabase mdb = MotorcycleDatabase();
      motorcycle = await mdb.getMotorcycleByIDhis(violation!.Vid!);
      setState(() {});
    }
  }

  // Fetch whether a complaint exists for this violation
  Future<void> checkIfComplaintExists() async {
    final complaintSnapshot = await FirebaseFirestore.instance
        .collection('Complaint')
        .where('ViolationID', isEqualTo: violation?.Vid)
        .get();

    // Set hasComplaint to true and fetch ComplaintID if any complaints exist
    if (complaintSnapshot.docs.isNotEmpty) {
      setState(() {
        hasComplaint = true;
        compID = complaintSnapshot.docs.first.id;
      });
    }
  }

  // Create a custom painter for the icon
  Future<BitmapDescriptor> getCustomMapIcon() async {
    final icon = Icons.location_pin; //Solid:  on_outlined;
    final pictureRecorder = ui.PictureRecorder();
    final canvas = Canvas(pictureRecorder);

    const double size = 48; //icon size as the defult icon from google :)

    TextPainter textPainter = TextPainter(textDirection: TextDirection.ltr);
    textPainter.text = TextSpan(
      text: String.fromCharCode(icon.codePoint),
      style: TextStyle(
        fontSize: size,
        fontFamily: icon.fontFamily,
        color: Colors.green, // Customize the color of the icon
      ),
    );
    textPainter.layout();
    textPainter.paint(canvas, const Offset(0, 0));

    final image = await pictureRecorder
        .endRecording()
        .toImage(size.toInt(), size.toInt());
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    return BitmapDescriptor.bytes(bytes!.buffer.asUint8List());
  }

  @override
  Widget build(BuildContext context) {
    final latitude = violation?.position?.latitude ?? defaultLoc.latitude;
    final longitude = violation?.position?.longitude ?? defaultLoc.longitude;

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
                "Violation Details",
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
        child: SingleChildScrollView(
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'you can raise a complaint within 30 days',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: Colors.grey[400],
                    ),
                    textAlign: TextAlign.center,
                  ),

                  const SizedBox(height: 20),

                  buildDetailSection(
                      'Motorcycle Brand',
                      motorcycle?.brand ?? '',
                      HugeIcons.strokeRoundedMotorbike02),
                  buildDetailSection('Motorcycle Type', motorcycle?.type ?? '',
                      HugeIcons.strokeRoundedMotorbike02),
                  buildDetailSection(
                      'Motorcycle Model',
                      motorcycle?.model ?? '',
                      HugeIcons.strokeRoundedMotorbike02),
                  buildDetailSectionWithImage(
                      'Motorcycle Licence Plate',
                      motorcycle?.licensePlate ?? '',),
                  buildDetailSection(
                      'GPS Serial Number',
                      violation?.gspNumber ?? '',
                      HugeIcons.strokeRoundedShareLocation01),

                  Divider(color: Colors.grey[350]),
                  const SizedBox(height: 15),

                  buildDetailSection(
                      'Violation ID',
                      violation?.Vid ?? '',
                      HugeIcons
                          .strokeRoundedDoNotTouch02), /////////////////check!!
                  buildDetailSection(
                      'Street Speed',
                      '${violation?.Maxspeed ?? ''} Km/h',
                      HugeIcons.strokeRoundedNavigator02),
                  buildDetailSection(
                      'Motorcycle Speed',
                      '${violation?.speed ?? ''} Km/h',
                      HugeIcons.strokeRoundedDashboardSpeed02),
                  buildDetailSection(
                      'Violation Amount',
                      '${violation?.price ?? ''} SAR',
                      HugeIcons.strokeRoundedInvoice),
                  buildDetailSection(
                      'Time',
                      violation?.getFormattedTimeOnly() ?? '',
                      HugeIcons.strokeRoundedClock03),
                  buildDetailSection(
                      'Date',
                      violation?.getFormattedDate() ?? '',
                      HugeIcons.strokeRoundedCalendar01),
                  buildDetailSection(
                      'Violation Location',
                      violation?.location ?? '',
                      HugeIcons.strokeRoundedMapsSquare02), ///////
                  const SizedBox(height: 15),

                  Container(
                    height: 200,
                    child: (latitude != defaultLoc.latitude ||
                            longitude != defaultLoc.longitude)
                        ? GoogleMap(
                            initialCameraPosition: CameraPosition(
                              target: LatLng(latitude, longitude),
                              zoom: 13,
                            ),
                            markers: {
                              Marker(
                                markerId: MarkerId('violationLocationPin'),
                                position: LatLng(latitude, longitude),
                                icon: customMapIcon ??
                                    BitmapDescriptor.defaultMarker,
                              ),
                            },
                          )
                        : Center(child: CircularProgressIndicator()),
                  ),
                  const SizedBox(height: 30),
                  ElevatedButton(
                    onPressed: (violation != null &&
                            !hasComplaint &&
                            DateTime.parse(violation!.getFormattedDate())
                                .isAfter(
                              DateTime.now().subtract(Duration(days: 30)),
                            ))
                        ? () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => Raisecomplaint(
                                  violation: violation!,
                                  driverid: widget.driverid,
                                ),
                              ),
                            );
                          }
                        : () {
                            String message;
                            if (hasComplaint) {
                              if (DateTime.parse(violation!.getFormattedDate())
                                  .isAfter(
                                DateTime.now().subtract(Duration(days: 30)),
                              )) {
                                message =
                                    'A complaint has already been raised for this violation!';
                              } else {
                                message =
                                    'A complaint has already been raised for this violation!';
                              }
                            } else {
                              message =
                                  'You can\'t raise a complaint after 30 days of the violation!';
                            }

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
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            SizedBox(width: 48),
                                            Expanded(
                                              child: Center(
                                                child: Text(
                                                  "Warning",
                                                  style: GoogleFonts.poppins(
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.red,
                                                  ),
                                                ),
                                              ),
                                            ),
                                            Transform.translate(
                                              offset: Offset(0, -15),
                                              child: IconButton(
                                                icon: Icon(Icons.close,
                                                    color: Color(0xFF211D1D)),
                                                onPressed: () {
                                                  Navigator.of(context).pop();
                                                },
                                              ),
                                            ),
                                          ],
                                        ),
                                        SizedBox(height: 20),
                                        Text(
                                          message, // Show dynamic warning message
                                          style:
                                              GoogleFonts.poppins(fontSize: 16),
                                          textAlign: TextAlign.center,
                                        ),
                                        SizedBox(height: 20),
                                        if (hasComplaint)
                                          ElevatedButton(
                                            onPressed: () {
                                              Navigator.push(
                                                context,
                                                MaterialPageRoute(
                                                  builder: (context) =>
                                                      Complaintdetail(
                                                    ComplaintID: compID ?? '',
                                                    driverid: widget.driverid,
                                                  ),
                                                ),
                                              );
                                            },
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Color.fromARGB(
                                                  202, 3, 152, 85),
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      vertical: 10,
                                                      horizontal: 20),
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(10),
                                              ),
                                            ),
                                            child: Text(
                                              'View Complaint Details',
                                              style: GoogleFonts.poppins(
                                                color: Colors.white,
                                                fontSize: 14,
                                              ),
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            );
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: (violation != null &&
                              !hasComplaint &&
                              DateTime.parse(violation!.getFormattedDate())
                                  .isAfter(
                                DateTime.now().subtract(Duration(days: 30)),
                              ))
                          ? Color.fromARGB(202, 3, 152, 85) // Active color
                          : const Color.fromARGB(
                              255, 199, 199, 199), // Disabled color
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      textStyle: GoogleFonts.poppins(fontSize: 18),
                    ),
                    child: Text(
                      'Raise a Complaint',
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

  void submitComplint() {
    Navigator.of(context).pop();
  }
}
