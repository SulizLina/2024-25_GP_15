import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:sairdriver/models/crash.dart';
import 'package:sairdriver/models/motorcycle.dart';
import 'package:sairdriver/services/crash_database.dart';
import 'package:sairdriver/services/motorcycle_database.dart';
import 'dart:ui' as ui; // Avoid using dart:ui on Flutter Web if targeting it
import 'package:google_fonts/google_fonts.dart';

class Crashdetail extends StatefulWidget {
  final String crashId;
  const Crashdetail({Key? key, required this.crashId}) : super(key: key);

  @override
  State<Crashdetail> createState() => _CrashdetailState();
}

class _CrashdetailState extends State<Crashdetail> {
  BitmapDescriptor? customMapIcon;
  Crash? crash;
  Motorcycle? motorcycle;

  @override
  void initState() {
    super.initState();
    fetchCrash();
    loadCustomMapIcon();
  }

  Future<void> loadCustomMapIcon() async {
    customMapIcon = await getCustomMapIcon();
    setState(() {});
  }

  Future<void> fetchCrash() async {
    CrashDatabase db = CrashDatabase();
    crash = await db.getCrashById(widget.crashId);
    if (crash != null && crash!.gspNumber != null) {
      fetchMotor();
    }
    setState(() {});
  }

  Future<void> fetchMotor() async {
    if (crash?.gspNumber != null) {
      MotorcycleDatabase mdb = MotorcycleDatabase();
      motorcycle = await mdb.getMotorcycleByGPS(crash!.gspNumber!);
      setState(() {});
    }
  }

Future<BitmapDescriptor> getCustomMapIcon() async {
  const double size = 120;
  final icon = Icons.location_pin;
  final pictureRecorder = ui.PictureRecorder();
  final canvas = Canvas(pictureRecorder, Rect.fromPoints(Offset(0, 0), Offset(size, size)));

  final paint = Paint();
  paint.color = Colors.transparent;
  canvas.drawRect(Rect.fromLTWH(0, 0, size, size), paint);

  TextPainter textPainter = TextPainter(textDirection: TextDirection.ltr);
  textPainter.text = TextSpan(
    text: String.fromCharCode(icon.codePoint),
    style: TextStyle(
      fontSize: size - 20,
      fontFamily: icon.fontFamily,
      color: Colors.green,
    ),
  );
  textPainter.layout();
  textPainter.paint(canvas, Offset(0, 0));

  final image = await pictureRecorder.endRecording().toImage(size.toInt(), size.toInt());
  final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
  return BitmapDescriptor.fromBytes(bytes!.buffer.asUint8List());
}

  @override
  Widget build(BuildContext context) {
    final latitude = crash?.position?.latitude ?? 0.0;
    final longitude = crash?.position?.longitude ?? 0.0;

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
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
                "Crash Details",
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFFAFAFF),
                ),
              ),
            ),
          ],
        ),
      ),
      backgroundColor: Color.fromARGB(255, 3, 152, 85),
      body: Container(
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
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(height: 20,),
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
                      'Motorcycle License Plate',
                      motorcycle?.licensePlate ?? '',
                      HugeIcons.strokeRoundedCreditCard),
                  buildDetailSection(
                      'GPS Serial Number',
                      crash?.gspNumber ?? '',
                      HugeIcons.strokeRoundedShareLocation01),

                  Divider(color: Colors.grey[350]),
                  const SizedBox(height: 15),
                  buildDetailSectionWithImage(
                      'Crash ID', crash?.cid ?? 'N/A'),
                  buildDetailSectionWithImage('Status', crash?.status ?? ''),
                  buildDetailSection(
                      'Time',
                      crash?.getFormattedTimeOnly() ?? '',
                      HugeIcons.strokeRoundedClock03),
                  buildDetailSection('Date', crash?.getFormattedDate() ?? '',
                      HugeIcons.strokeRoundedCalendar01),
                  buildDetailSection('Crash Location', crash?.location ?? '',
                      HugeIcons.strokeRoundedMapsSquare02),

                  const SizedBox(height: 15),
                  Container(
                    height: 200,
                    child: (latitude != 0.0 || longitude != 0.0)
                        ? GoogleMap(
                            initialCameraPosition: CameraPosition(
                              target: LatLng(latitude, longitude),
                              zoom: 13,
                            ),
                            markers: {
                              Marker(
                                markerId: MarkerId('crashLocationPin'),
                                position: LatLng(latitude, longitude),
                                icon: customMapIcon ??
                                    BitmapDescriptor.defaultMarker,
                              ),
                            },
                          )
                        : Center(child: CircularProgressIndicator()),
                  ),
                  const SizedBox(height: 30),
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
            if (icon != null)
              Icon(icon, size: 24, color: Color.fromARGB(255, 3, 152, 85)),
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