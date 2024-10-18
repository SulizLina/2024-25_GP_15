import 'dart:ffi';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/screens/ViolationsList.dart';
import 'package:sairdriver/services/Violations_database.dart';
import 'package:sairdriver/screens/RaiseCompliants.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:sairdriver/services/motorcycle_database.dart';
import 'package:hugeicons/hugeicons.dart';

class Violationdetail extends StatefulWidget {
  final String violationId;

  const Violationdetail({Key? key, required this.violationId}) : super(key: key);

  @override
  State<Violationdetail> createState() => _ViolationdetailState();
}

class _ViolationdetailState extends State<Violationdetail> {

  String? plateNumber; // To hold plate number fetched from Motorcycle collection

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

    MotorcycleDatabase mdb = MotorcycleDatabase();
    // Fetch plate number using the driver's ID
    plateNumber = await mdb.getPlateNumberByDriverId(widget.violationId);/////!!!
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
          Expanded( // Allows the text to take up remaining space
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

      body: Container(
        //width: double.infinity,
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
                      color: Colors.grey[400], // Set a subtle color for the subtitle
                    ),
                    textAlign: TextAlign.center,
                  ),
                
                  const SizedBox(height: 20),
                  buildDetailSection('Driver ID', violation?.driverId, HugeIcons.strokeRoundedIdentityCard),
                  Divider(color: Colors.grey[350]),
                  const SizedBox(height: 15),
                  //divider

                  buildDetailSection('Motorcycle Licence Plate', '${violation?.gspNumber} NOT YETT', HugeIcons.strokeRoundedCreditCard),////
                  buildDetailSection('GPS Number', violation?.gspNumber, HugeIcons.strokeRoundedShareLocation01),
                  buildDetailSection('Motorcycle Type', '${violation?.gspNumber} NOT YETT', HugeIcons.strokeRoundedMotorbike02),///////
                  buildDetailSection('Motorcycle Brand', '${violation?.gspNumber} NOT YETT', HugeIcons.strokeRoundedMotorbike02),///////
                  buildDetailSection('Motorcycle Model', '${violation?.gspNumber} NOT YETT', HugeIcons.strokeRoundedMotorbike02),///////
                  Divider(color: Colors.grey[350]),
                  const SizedBox(height: 15),
                  //divider

                  buildDetailSection('Violation ID', violation!.id, HugeIcons.strokeRoundedDoNotTouch02), /////////////////check!!
                  buildDetailSection('Street Speed', '${violation?.Maxspeed} Km/h', HugeIcons.strokeRoundedNavigator02),
                  buildDetailSection('Motorcycle Speed', '${violation?.speed} Km/h', HugeIcons.strokeRoundedDashboardSpeed02),
                  buildDetailSection('Violation Price', '${violation?.price} SAR', HugeIcons.strokeRoundedInvoice),
                  buildDetailSection('Time', violation?.getFormattedTimeOnly(), HugeIcons.strokeRoundedClock03),
                  buildDetailSection('Date', violation?.getFormattedDate(), HugeIcons.strokeRoundedCalendar01),
                  buildDetailSection('Violation Location', violation?.location, HugeIcons.strokeRoundedMapsSquare02),///////
                  const SizedBox(height: 15),

                  /*
                  // No divider after last info
                  Text(
                    'Location:',
                    style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)),
                  ),
                  Text(
                    '${violation?.location}',
                    style: GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D)),
                  ),
                  */
                  
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
                  const SizedBox(height: 30),
                  ElevatedButton(
  onPressed: violation != null && violation!.getFormattedDate() != 'N/A' &&
      DateTime.parse(violation!.getFormattedDate()).isAfter(
        DateTime.now().subtract(Duration(days: 30)),
      )
      ? () {
          // Button is enabled, navigate to RaiseComplaint
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const Raisecomplaint()),
          );
        }
      : () { 
          // Button is disabled, show the success dialog
          showDialog(
            context: context,
            builder: (BuildContext context) {
              return AlertDialog(
                title: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Warning',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close, color: Color(0xFF211D1D)), // Close icon in red color
                      onPressed: () {
                        Navigator.of(context).pop(); // Close the dialog
                      },
                    ),
                  ],
                ),
                content: Text(
                  'You can\'t raise a complaint after 30 days of the violation!',
                  style: GoogleFonts.poppins(fontSize: 16),
                ),
              );
            },
          );
        },
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

Widget buildDetailSection(String title, String? content, IconData? icon) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 24, color: Color.fromARGB(255, 3, 152, 85)),  // Icon with appropriate size and color
            const SizedBox(width: 8),  // Space between icon and text
          ],
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
      Text(
        content ?? 'N/A',
        style: GoogleFonts.poppins(
          fontSize: 14,
          color: Color(0xFF211D1D),
        ),
      ),
      const SizedBox(height: 20),
    ],
  );
}
}