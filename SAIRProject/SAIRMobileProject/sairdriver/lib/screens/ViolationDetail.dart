import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/models/violation.dart';
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
  static const LatLng defaultLoc = LatLng(24.8348509, -46.5882190);
  Violation? violation;

  @override
  void initState() {
    super.initState();
    fetchViolation();
  }

  Future<void> fetchViolation() async {
    ViolationsDatabase db = ViolationsDatabase();
    violation = await db.getViolationById(widget.violationId); // Fetch violation using the violationId
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final latitude = violation?.location?.latitude ?? defaultLoc.latitude;
    final longitude = violation?.location?.longitude ?? defaultLoc.longitude;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: Color(0xFF211D1D)), // Back arrow color
      ),
      body: SingleChildScrollView(
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
                buildDetailSection('Price:', violation?.price.toString()),

                const SizedBox(height: 20),
                Text('Location:', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D))),
                Text('Lat: $latitude, Lon: $longitude', style: GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))),

                const SizedBox(height: 20),
                Container(
                  height: 200,
                  child: GoogleMap(
                    initialCameraPosition: CameraPosition(
                      target: LatLng(latitude, longitude),
                      zoom: 13,
                    ),
                    markers: {
                      Marker(markerId: MarkerId('violationLocationPin'), position: LatLng(latitude, longitude)),
                    },
                  ),
                ),

                ElevatedButton(
                  onPressed: violation != null && violation!.dateTime != null && 
                    DateTime.parse(violation!.dateTime.toString()).isAfter(DateTime.now().subtract(Duration(days: 30))) ? () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const Raisecomplaint()),
                      );
                    } : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color.fromARGB(202, 3, 152, 85),
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
    );
  }

  Widget buildDetailSection(String title, String? content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF211D1D))),
        Text(content ?? 'N/A', style: GoogleFonts.poppins(fontSize: 14, color: Color(0xFF211D1D))),
        const Divider(color: Colors.grey),
      ],
    );
  }
}