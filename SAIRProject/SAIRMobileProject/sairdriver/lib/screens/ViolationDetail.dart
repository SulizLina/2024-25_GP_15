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
  BitmapDescriptor? customMapIcon;
  Violation? violation;
  Motorcycle? motorcycle;
  static const LatLng defaultLoc = LatLng(0.0, 0.0);
  int? sum;
  bool _isRecklessTextVisible = false;
  @override
  void initState() {
    super.initState();
    deleteIsAutoField();
    fetchViolation();
    loadCustomMapIcon();
    fetchMotor();
  }

  Future<void> loadCustomMapIcon() async {
    customMapIcon = await getCustomMapIcon();
    setState(() {});
  }

  Future<void> fetchViolation() async {
    ViolationsDatabase db = ViolationsDatabase();
    violation = await db.getViolationById(widget.violationId);
    sum = (violation!.count30! + violation!.count50!);
    if (violation != null && violation!.gspNumber != null) {
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

  Future<void> deleteIsAutoField() async {
    try {
      await FirebaseFirestore.instance
          .collection('Violation')
          .doc(widget.violationId)
          .update({
        'isAuto': FieldValue.delete(),
      });
      print("isAuto field deleted successfully");
    } catch (e) {
      print('Error deleting isAuto field: $e');
    }
  }

  Future<BitmapDescriptor> getCustomMapIcon() async {
    final icon = Icons.location_pin;
    final pictureRecorder = ui.PictureRecorder();
    final canvas = Canvas(pictureRecorder);

    const double size = 48;

    TextPainter textPainter = TextPainter(textDirection: TextDirection.ltr);
    textPainter.text = TextSpan(
      text: String.fromCharCode(icon.codePoint),
      style: TextStyle(
        fontSize: size,
        fontFamily: icon.fontFamily,
        color: Colors.green,
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
                    hasComplaint //the use the intial delaration of the variable (which is not correct !)
                        ? 'You can raise one complaint within 30 days'
                        : 'A complaint has already been raised for this violation',
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
                  buildDetailSectionWithImage('Motorcycle Licence Plate',
                      motorcycle?.licensePlate ?? ''),
                  buildDetailSection(
                      'GPS Serial Number',
                      violation?.gspNumber ?? '',
                      HugeIcons.strokeRoundedShareLocation01),
                  Divider(color: Colors.grey[350]),
                  const SizedBox(height: 15),
                  buildDetailSection('Violation ID', violation?.Vid ?? '',
                      HugeIcons.strokeRoundedDoNotTouch02),
                       buildDetailSectionIconStatus(
                    'Status',
                    violation?.status ?? '',
                    violation?.status,
                  ),
                  buildDetailSection(
                      'Street Speed',
                      '${violation?.Maxspeed ?? ''} Km/h',
                      HugeIcons.strokeRoundedNavigator02),
                  buildDetailSection(
                      'Motorcycle Speed',
                      '${violation?.speed ?? ''} Km/h',
                      HugeIcons.strokeRoundedDashboardSpeed02),
                  buildDetailPriceSection(
                    'Violation Amount',
                    violation != null
                        ? '${violation?.price ?? ''} SAR'
                        : 'Amount unavailable',
                    HugeIcons.strokeRoundedInvoice,
                  ),
                  // Reckless violation message
                  if ((violation?.count30 ?? 0) > 0 ||
                      (violation?.count50 ?? 0) > 0)
                    Padding(
                      padding: const EdgeInsets.only(left: 32, bottom: 8),
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _isRecklessTextVisible = !_isRecklessTextVisible;
                          });
                        },
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              HugeIcons.strokeRoundedArrowDown01,
                              color: Colors.red,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Reckless violation',
                                style: GoogleFonts.poppins(
                                    fontSize: 14, color: Color(0xFF211D1D)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (_isRecklessTextVisible)
                    Padding(
                      padding: const EdgeInsets.only(left: 60, bottom: 20),
                      child: Text(
                        'According to General Department of Traffic regulations, this speed violation is considered reckless and marks your ${getOrdinal(sum!)} offense.'
                        '${(violation!.count30! > 1 || violation!.count50! > 1) ? " As a result, the penalty amount has been increased." : ""}',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ),
                  // Disclaimer message below the reckless violation message
                  Padding(
                    padding: const EdgeInsets.only(left: 32, bottom: 20),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          HugeIcons.strokeRoundedInformationCircle,
                          color: Colors.red,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Disclaimer: This fee is an estimated amount, calculated based on the executive regulations issued under ministerial decision No. 2249, Article 115.',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color:
                                  Colors.grey, // Muted color for the disclaimer
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

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
                      HugeIcons.strokeRoundedMapsSquare02),
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
                  StreamBuilder<QuerySnapshot>(
                    stream: FirebaseFirestore.instance
                        .collection('Complaint')
                        .where('ViolationID', isEqualTo: violation?.Vid)
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return Center(child: CircularProgressIndicator());
                      }
                      if (snapshot.hasError) {
                        return Text('Error loading complaints');
                      }
                      hasComplaint = snapshot.data?.docs.isNotEmpty ?? false;
                      if (hasComplaint) {
                        compID = snapshot.data?.docs.first.id;
                      }

                      return ElevatedButton(
                        onPressed: (violation != null &&
                                DateTime.parse(violation!.getFormattedDate())
                                    .isAfter(DateTime.now()
                                        .subtract(Duration(days: 30))))
                            ? () {
                                // If the violation is within the last 30 days
                                if (hasComplaint) {
                                  // Navigate to the Complaint detail page if complaint exists
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => Complaintdetail(
                                        ComplaintID: compID ?? '',
                                        driverid: widget.driverid,
                                      ),
                                    ),
                                  );
                                } else {
                                  // Navigate to the Raise complaint page if no complaint exists
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => Raisecomplaint(
                                          violation: violation!,
                                          driverid: widget.driverid,
                                          page: "violation"),
                                    ),
                                  );
                                }
                              }
                            : () {
                                // If violation is older than 30 days, show warning dialog
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
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                SizedBox(width: 48),
                                                Expanded(
                                                  child: Center(
                                                    child: Text(
                                                      "Warning",
                                                      style:
                                                          GoogleFonts.poppins(
                                                        fontSize: 18,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                        color: Colors.red,
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                                Transform.translate(
                                                  offset: Offset(0, -15),
                                                  child: IconButton(
                                                    icon: Icon(Icons.close,
                                                        color:
                                                            Color(0xFF211D1D)),
                                                    onPressed: () {
                                                      Navigator.of(context)
                                                          .pop();
                                                    },
                                                  ),
                                                ),
                                              ],
                                            ),
                                            SizedBox(height: 20),
                                            Text(
                                              'You can\'t raise a complaint after 30 days of the violation!',
                                              style: GoogleFonts.poppins(
                                                  fontSize: 16),
                                              textAlign: TextAlign.center,
                                            ),
                                            SizedBox(height: 20),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                );
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: (violation != null &&
                                  DateTime.parse(violation!.getFormattedDate())
                                      .isAfter(DateTime.now()
                                          .subtract(Duration(days: 30))))
                              ? (hasComplaint
                                  ? Color.fromARGB(202, 3, 152,
                                      85) // Green if complaint exists
                                  : Color.fromARGB(202, 3, 152,
                                      85)) // Green if no complaint and violation within 30 days
                              : const Color.fromARGB(255, 199, 199,
                                  199), // Disabled (gray) if violation > 30 days
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          textStyle: GoogleFonts.poppins(fontSize: 18),
                        ),
                        child: Text(
                          hasComplaint ? 'View Complaint' : 'Raise a Complaint',
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 16,
                          ),
                        ),
                      );
                    },
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

  Widget buildDetailPriceSection(
      String title, String? content, IconData? icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
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
        const SizedBox(height: 2),
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

  String getOrdinal(int sum) {
    // Special cases for 11, 12, 13
    if (sum % 100 >= 11 && sum % 100 <= 13) {
      return '$sum th';
    }

    // General case
    switch (sum) {
      case 1:
        return 'first';
      case 2:
        return 'second';
      case 3:
        return 'third';
      case 4:
        return 'fourth';
      case 5:
        return 'fifth';
      case 6:
        return 'sixth';
      case 7:
        return 'seventh';
      case 8:
        return 'eighth';
      case 9:
        return 'ninth';
      default:
        return '${sum}th';
    }
  }
  Widget buildDetailSectionIconStatus(
      String title, String? content, String? status) {
    Color circleColor;

    switch (status) {
      case 'Revoked':
        circleColor =  Colors.red;
        break;
      default:
        circleColor = Colors.green;
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
  void submitComplaint() {
    Navigator.of(context).pop();
  }
}
