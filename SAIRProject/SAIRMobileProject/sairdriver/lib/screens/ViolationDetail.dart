import 'dart:ffi';
import 'dart:ui' as ui;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/screens/ViolationsList.dart';
import 'package:sairdriver/screens/RaiseCompliants.dart';
import 'package:sairdriver/services/Violations_database.dart';
import 'package:sairdriver/screens/RaiseCompliants.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:sairdriver/services/motorcycle_database.dart';
import 'package:sairdriver/models/motorcycle.dart';
import 'package:hugeicons/hugeicons.dart';

class Violationdetail extends StatefulWidget {
  final String violationId;

  const Violationdetail({Key? key, required this.violationId})
      : super(key: key);

  @override
  State<Violationdetail> createState() => _ViolationdetailState();
}

class _ViolationdetailState extends State<Violationdetail> {
  @override
  void initState() {
    super.initState();
    fetchViolation();
    loadCustomMapIcon();
    fetchMotor();
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
    violation = await db.getViolationById(
        widget.violationId); // Fetch violation using the violationId

    if (violation != null && violation!.gspNumber != null) {
      print(violation?.gspNumber);
      await fetchMotor();
    }
    setState(() {});
  }

  Future<void> fetchMotor() async {
    if (violation?.gspNumber != null) {
      MotorcycleDatabase mdb = MotorcycleDatabase();
      motorcycle = await mdb.getMotorcycleByGPS(violation!.gspNumber!);
      setState(() {});
    }
  }

  // Create a custom painter for the icon
  Future<BitmapDescriptor> getCustomMapIcon() async {
    final icon = Icons.location_pin; //Solid:  on_outlined;
    final pictureRecorder = ui.PictureRecorder();
    final canvas = Canvas(pictureRecorder);

    const double size = 48; //icon size as the defult icon from google :)
    final paint = Paint();

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
                "Violation Details", // Adjust the text as needed
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
                  /*
                  Text(
                    violation != null ? 'V#${violation!.id}' : '',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color.fromARGB(202, 3, 152, 85),
                    ),
                  const SizedBox(height: 8), // Space between the ID and subtitle
                  */
                  Text(
                    'you can raise a complaint within 30 days', // Your subtitle here
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: Colors
                          .grey[400], // Set a subtle color for the subtitle
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
                  buildDetailSection(
                      'Motorcycle Licence Plate',
                      motorcycle?.licensePlate ?? '',
                      HugeIcons.strokeRoundedCreditCard),
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
                        : Center(
                            child:
                                CircularProgressIndicator()), // Shows a loader until valid coordinates are fetched
                  ),
                  const SizedBox(height: 30),
                  ElevatedButton(
                    onPressed: violation != null &&
                            violation!.getFormattedDate() != 'N/A' &&
                            DateTime.parse(violation!.getFormattedDate())
                                .isAfter(
                              DateTime.now().subtract(Duration(days: 30)),
                            )
                        ? () {
                            // Button is enabled, show form to sumbit a complaint
                            Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => Raisecomplaint(
                                  violationId: violation?.Vid ?? ''),
                            ),
                          );
                          }
                        : () {
                            // Button is disabled, show warning dialog
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
                                            SizedBox(
                                                width:
                                                    48), // Placeholder for spacing
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
                                              offset: Offset(
                                                  0, -15), // Move the icon up
                                              child: IconButton(
                                                icon: Icon(Icons.close,
                                                    color: Color(
                                                        0xFF211D1D)), // Close icon
                                                onPressed: () {
                                                  Navigator.of(context)
                                                      .pop(); // Close the dialog
                                                },
                                              ),
                                            ),
                                          ],
                                        ),
                                        SizedBox(
                                            height:
                                                20), // Space between title and message
                                        Text(
                                          'You can\'t raise a complaint after 30 days of the violation!',
                                          style: GoogleFonts.poppins(
                                            fontSize: 16,
                                          ),
                                          textAlign: TextAlign.center,
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            );
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: violation != null &&
                              violation!.getFormattedDate() != 'N/A' &&
                              DateTime.parse(violation!.getFormattedDate())
                                  .isAfter(
                                DateTime.now().subtract(Duration(days: 30)),
                              )
                          ? Color.fromARGB(202, 3, 152, 85) // Active color
                          : const Color.fromARGB(255, 199, 199,
                              199),
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

  void submitComplint(){
    Navigator.of(context).pop();
  }
}
