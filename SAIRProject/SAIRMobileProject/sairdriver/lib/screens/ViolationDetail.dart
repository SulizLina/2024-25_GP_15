import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/RaiseCompliants.dart';
//import 'package:google_maps_flutter/google_maps_flutter.dart'; // Import Google Maps

class Violationdetail extends StatefulWidget {
  @override
  State<Violationdetail> createState() => _ViolationdetailState();
}

class _ViolationdetailState extends State<Violationdetail> {
  String VType = 'Speed';
  String VDateTime = '12:12';
  String DSpeed = '200 Km'; 
  String StreetSpeed = '150 km'; 
  String VLocation = 'AlQirawan';
  String VPrice = '100';

  // Location coordinates for the map
 // final LatLng violationLocation = LatLng(24.7223622222, 46.63624); // Updated coordinates

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: Color(0xFF211D1D)), // Back arrow color changed
      ),
      body: SingleChildScrollView( // Make the body scrollable
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'V#111', //update later from DB
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color.fromARGB(202, 3, 152, 85),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Violation Type: ',
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)),
                ),
                Text('$VType', style: GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))),
                const Divider(color: Colors.grey),
                Text(
                  'Date and Time: ',
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)), 
                ),
                Text('$VDateTime', style:  GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))), 
                const Divider(color: Colors.grey),
                Text(
                  'Motorcycle Speed: ',
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)),
                ),
                Text('$DSpeed', style: GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))), 
                const Divider(color: Colors.grey),
                Text(
                  'Street Speed: ',
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)), 
                ),
                Text('$StreetSpeed', style:  GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))),
                const Divider(color: Colors.grey),
                Text(
                  'Price: ',
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)),
                ),
                Text('$VPrice SAR', style:  GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))), 
                const Divider(color: Colors.grey),
                Text(
                  'Location: ',
                  style:  GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)), 
                ),
                Text('$VLocation', style:  GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))),
                
                const SizedBox(height: 20),
                /*
                // Google Map Widget
                Container(
                  height: 200,
                  child: GoogleMap(
                    initialCameraPosition: CameraPosition(
                      target: violationLocation, // Set the map's location to the violation coordinates
                      zoom: 14.0, // Set the zoom level
                    ),
                    markers: {
                      Marker(
                        markerId: MarkerId('violationLocation'),
                        position: violationLocation,
                      ),
                    },
                  ),
                ),
                */
                
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const Raisecomplaint()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color.fromARGB(202, 3, 152, 85),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    textStyle:  GoogleFonts.poppins(fontSize: 18),
                  ),
                  child:  Text(
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
    );
  }
}