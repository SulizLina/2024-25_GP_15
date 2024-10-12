import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/services/Violations_database.dart';
import 'package:sairdriver/screens/RaiseCompliants.dart';
//import 'package:google_maps_flutter/google_maps_flutter.dart'; // Import Google Maps


class ViolationDetail extends StatelessWidget {
  final Violation violation;

  const ViolationDetail({Key? key, required this.violation}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: Color(0xFF211D1D)), // Back arrow color changed
      ),
      body: SingleChildScrollView(
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'V#${violation.id}',
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color.fromARGB(202, 3, 152, 85),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Driver ID:',
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)), 
                ),
                Text('${violation.driverId}', style:  GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))), 
                const Divider(color: Colors.grey),
                Text(
                  'GPS Number:',
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)),
                ),
                Text('${violation.gspNumber}', style: GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))), 
                const Divider(color: Colors.grey),
                Text(
                  'Violation Date:',
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)), 
                ),
                Text('${violation.dateTime?.toDate().toString() ?? 'N/A'}', style:  GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))),
                const Divider(color: Colors.grey),
                Text(
                  'Spreed: ',
                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)),
                ),
                Text('${violation.speed} Km/h', style:  GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))), 
                const Divider(color: Colors.grey),
                Text(
                  'Street Speed: ',
                  style:  GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)), 
                ),
                Text('${violation.Maxspeed} Km/h', style:  GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))),
                const Divider(color: Colors.grey),
                Text(
                  'Price:',
                  style:  GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)), 
                ),
                Text('${violation.price} SAR', style:  GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))),
                const Divider(color: Colors.grey),
                Text(
                  'Location:',
                  style:  GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D)), 
                ),
                Text('${violation.location != null ? 'Lat: ${violation.location!.latitude}, Lon: ${violation.location!.longitude}' : 'N/A'}', style:  GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))),
                
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
                      MaterialPageRoute(builder: (context) => const Raisecomplaint()), //////////////////for this violation
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