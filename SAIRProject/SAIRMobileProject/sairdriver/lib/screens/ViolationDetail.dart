import 'dart:ffi';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/screens/ViolationsList.dart';
import 'package:sairdriver/services/Violations_database.dart';
import 'package:sairdriver/screens/RaiseCompliants.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class Violationdetail extends StatefulWidget {
  final String violationId;

  const Violationdetail({Key? key, required this.violationId}) : super(key: key);

  @override
  State<Violationdetail> createState() => _ViolationdetailState();
}

class _ViolationdetailState extends State<Violationdetail> {
  @override
  void initState() {
    super.initState();
    fetchViolation();
    //CustomMarker();
  }

  BitmapDescriptor markerIcon = BitmapDescriptor.defaultMarker;

  void CustomMarker() {//////////////////////NOT USE, due the size of image! :(((((((((((
    BitmapDescriptor.fromAssetImage(
      const ImageConfiguration(size: ui.Size(5, 5)), // Use 'ui.Size' to access the correct class
      'assets/image/greenMapMarker.png',
    ).then((icon) {
      setState(() {
        markerIcon = icon;
      });
    });
  }

  static const LatLng defaultLoc = LatLng(24.8348509, 46.5882190);
  Violation? violation;

  Future<void> fetchViolation() async {
    ViolationsDatabase db = ViolationsDatabase();
    violation = await db.getViolationById(widget.violationId); // Fetch violation using the violationId
    setState(() {});
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
        toolbarHeight: 80, // Adjust the toolbar height
        iconTheme: const IconThemeData(color: Colors.white),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
        title: Column(
          mainAxisAlignment: MainAxisAlignment.center, // Center the title vertically
          children: [
            const SizedBox(height: 40), // Space for the icon
            Text(
              "Violation Details",
              style: TextStyle(
                fontSize: 20,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),




      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16.0),
        decoration: const BoxDecoration(
          color: Colors.white,
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
                    violation != null ? 'V#${violation!.id}' : 'Loading...',
                    style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold, color: Color.fromARGB(202, 3, 152, 85)),
                  ),
                  const SizedBox(height: 20),
                  buildDetailSection('Driver ID:', violation?.driverId),
                  buildDetailSection('GPS Number:', violation?.gspNumber),
                  buildDetailSection('Motorcycle Speed:', violation?.speed.toString()),
                  buildDetailSection('Street Speed:', violation?.Maxspeed.toString()),
                  buildDetailSection('Price:', '${violation?.price} SAR'),
                  buildDetailSection('Time:', violation?.getFormattedTimeOnly()),
                  buildDetailSection('Date:', violation?.getFormattedDate()),

                  // No divider after last info
                  Text(
                    'Location:',
                    style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)),
                  ),
                  Text(
                    '${violation?.location}',
                    style: GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D)),
                  ),
                  
                  const SizedBox(height: 20),
                  Container(
                    height: 200,
                    child: GoogleMap(
                      initialCameraPosition: CameraPosition(
                        target: LatLng(latitude, longitude),
                        zoom: 13,
                      ),
                      markers: {
                        Marker(
                          markerId: MarkerId('violationLocationPin'), 
                          position: LatLng(latitude, longitude),
                          //icon: markerIcon, /////////////////////Custom MArker :)))
                        ),
                      },
                    ),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: violation != null && violation!.getFormattedDate() != 'N/A' &&
                        DateTime.parse(violation!.getFormattedDate()).isAfter(
                          DateTime.now().subtract(Duration(days: 30)),
                        )
                        ? () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const Raisecomplaint()),
                            );
                          }
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: violation != null && violation!.getFormattedDate() != 'N/A' &&
                          DateTime.parse(violation!.getFormattedDate()).isAfter(
                            DateTime.now().subtract(Duration(days: 30)),
                          )
                          ? Color.fromARGB(202, 3, 152, 85) // Active color
                          : Colors.grey, // Gray color if condition is not met
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      textStyle: GoogleFonts.poppins(fontSize: 18),
                    ),
                    child: Text(
                      'Raise a Complaint',
                      style: GoogleFonts.poppins(color: Colors.white, fontSize: 16),
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

  Widget buildDetailSection(String title, String? content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D))),
        Text(content ?? 'N/A', style: GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))),
        Divider(color: Colors.grey[350]),
      ],
    );
  }
}