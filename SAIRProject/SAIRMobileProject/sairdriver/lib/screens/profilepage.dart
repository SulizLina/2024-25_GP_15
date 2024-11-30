import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:sairdriver/models/Employer.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/models/motorcycle.dart';
import 'package:sairdriver/screens/login_email.dart';
import 'package:sairdriver/services/crashstreambuilder.dart';
import 'package:sairdriver/services/driver_database.dart';
import 'package:sairdriver/services/motorcycle_database.dart';
import 'editpasswordpage.dart';
import 'edit_phone_page.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';

class Profilepage extends StatefulWidget {
  final String driverId;

  Profilepage({required this.driverId});
  @override
  State<Profilepage> createState() => _ProfilepageState();
}

//
class _ProfilepageState extends State<Profilepage> {
  User? currentUser = FirebaseAuth.instance.currentUser; 
  driver? driverInf;
  Motorcycle? motorcycle;
  String?
      plateNumber; 
  String password = '*******';
  TextEditingController fname = TextEditingController();
  TextEditingController lname = TextEditingController();
  TextEditingController phone = TextEditingController();
  TextEditingController gps = TextEditingController();
  TextEditingController id = TextEditingController();
  TextEditingController PlateN = TextEditingController();
  TextEditingController CompanyName = TextEditingController();
  TextEditingController model = TextEditingController();
  TextEditingController brand = TextEditingController();
  TextEditingController type = TextEditingController();
  TextEditingController email = TextEditingController();
  @override
  void initState() {
    super.initState();
    setState(() {
      fetchDriverData(); 
    });
    fetchDriverData(); 
  }

  @override
  void didUpdateWidget(Profilepage oldWidget) {
    super.didUpdateWidget(oldWidget);
    fetchDriverData();
  }

  Future<void> fetchDriverData() async {
    DriverDatabase db = DriverDatabase();
    MotorcycleDatabase mdb = MotorcycleDatabase();

    // Fetch driver information
    driverInf = await db.getDriversnById(widget.driverId);

    // Fetch plate number using the driver's ID
    motorcycle = await mdb.getMotorcycleByDriverID(driverInf?.driverId ?? '');
    setState(() {}); // Update the UI after fetching data
    // Update text fields with fetched data after both driver data and plate number are retrieved
    if (mounted) {
      setState(() async {
        fname.text = driverInf?.fname ?? '';
        lname.text = driverInf?.lname ?? '';
        phone.text = driverInf?.phoneNumber ?? '';
        id.text = driverInf?.driverId ?? '';
        String? shortname = await fetchShortCompanyName(driverInf?.companyname);
        email.text = currentUser?.email ?? '';
        gps.text =
            ((motorcycle?.gspNumber != null && motorcycle?.gspNumber != 'null')
                ? motorcycle!.gspNumber
                : 'No assigned GPS yet')!;
        PlateN.text = motorcycle?.licensePlate ?? 'No assigned motorcycle yet';
        CompanyName.text = shortname!;
        type.text = motorcycle?.type ?? 'No assigned motorcycle yet';
        model.text = motorcycle?.model ?? 'No assigned motorcycle yet';
        brand.text = motorcycle?.brand ?? "No assigned motorcycle yet";
      });
    }
    setState(() {}); // Update the UI after fetching data
  }

  Future<String?> fetchShortCompanyName(String? longname) async {
    if (longname == null) return null;
    QuerySnapshot companySnapshot = await FirebaseFirestore.instance
        .collection('Employer')
        .where('CompanyName', isEqualTo: longname)
        .get();
    if (companySnapshot.docs.isNotEmpty) {
      Employer employer = Employer.fromJson(companySnapshot.docs.first);
      return employer.ShortCompanyName;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 3, 152, 85),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: const Color.fromARGB(255, 3, 152, 85),
        toolbarHeight: 120,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 5),
              child: Transform.translate(
                offset: const Offset(0, 10),
                child: Text(
                  "My Profile",
                  style: GoogleFonts.poppins(
                    fontSize: 22,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.left,
                ),
              ),
            ),
            IconButton(
              icon: const Icon(
                Icons.exit_to_app,
                color: Colors.white,
                size: 30,
              ),
              tooltip: 'Log Out',
              onPressed: () {
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
                              "Logout",
                              style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Color.fromARGB(202, 3, 152, 85),
                              ),
                            ),
                            SizedBox(height: 20),
                            Text(
                              'Are you sure that you want to logout?',
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            SizedBox(height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                // Cancel Button
                                ElevatedButton(
                                  onPressed: () {
                                    Navigator.of(context)
                                        .pop(); 
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors
                                        .grey, 
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                  child: Text(
                                    'Cancel',
                                    style: GoogleFonts.poppins(
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                // Logout Button
                                ElevatedButton(
                                  onPressed: () {
                                    Navigator.of(context).pop();
                                    FirebaseAuth.instance.signOut();
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                          builder: (context) =>
                                              const LoginEmail()),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.red,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                  child: Text(
                                    'Logout',
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
              },
            ),
          ],
        ),
      ),
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16.0),
        decoration: const BoxDecoration(
          color: Color(0xFFF3F3F3),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30),
            topRight: Radius.circular(30),
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              Text(
                'Driver Information',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(202, 3, 152, 85),
                ),
              ),

              const SizedBox(height: 16),

              // First Name field
              TextFormField(
                controller: fname,
                decoration: InputDecoration(
                  labelText: 'First Name',
                  labelStyle:
                      GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                readOnly: true,
              ),
              const SizedBox(height: 16),
              // Last Name field
              TextFormField(
                controller: lname,
                decoration: InputDecoration(
                  labelText: 'Last Name',
                  labelStyle:
                      GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                readOnly: true,
              ),
              const SizedBox(height: 16),
              // ID / Residency number field
              TextFormField(
                controller: id,
                decoration: InputDecoration(
                  labelText: 'Driver ID (National ID/ Residency Number) ',
                  labelStyle:
                      GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                readOnly: true,
              ),
              const SizedBox(height: 16),
              // Email field
              TextFormField(
                controller: email,
                decoration: InputDecoration(
                  labelText: 'Email',
                  labelStyle:
                      GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                readOnly: true,
              ),
              const SizedBox(height: 16),
              // Phone number field
              TextFormField(
                //  initialValue:
                //    driverInf?.phoneNumber ?? '', // Fetch phone number
                controller: phone,

                decoration: InputDecoration(
                  labelText: 'Phone Number',
                  labelStyle:
                      GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  // Inside the TextFormField for Phone Number
                  suffixIcon: IconButton(
                    icon: const Icon(
                      Icons.edit,
                      color: Color.fromARGB(202, 3, 152, 85),
                    ),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => EditPhonePage(
                            driverId: widget.driverId,
                            onPhoneUpdated: (newPhone) {
                              setState(() {
                                phone.text =
                                    newPhone;
                              });
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                readOnly: true,
              ),
              const SizedBox(height: 16),
              // ID / Residency number field
              TextFormField(
                controller: CompanyName,
                decoration: InputDecoration(
                  labelText: 'Company Name',
                  labelStyle:
                      GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                readOnly: true,
              ),
              const SizedBox(height: 16),

              // Password field with IconButton
              TextFormField(
                initialValue: password,
                decoration: InputDecoration(
                  labelText: 'Password',
                  labelStyle:
                      GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  suffixIcon: IconButton(
                    icon: const Icon(
                      Icons.edit,
                      color: Color.fromARGB(202, 3, 152, 85),
                    ),
                    onPressed: () {
                      Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => Editpasswordpage(
                              driverId: widget.driverId,
                            ),
                          ));
                    },
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                obscureText: true,
                readOnly: true,
              ),
              const SizedBox(height: 16),

              const SizedBox(height: 16),
              Text(
                'Motorcycle Information',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color.fromARGB(202, 3, 152, 85),
                ),
              ),
              const SizedBox(height: 16),
              //type
              TextFormField(
                controller: brand,
                decoration: InputDecoration(
                  labelText: 'Brand',
                  labelStyle:
                      GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                readOnly: true,
              ),
              const SizedBox(height: 16),

              // Type field
              TextFormField(
                controller: type,
                decoration: InputDecoration(
                  labelText: 'Type',
                  labelStyle:
                      GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                readOnly: true,
              ),

              const SizedBox(height: 16),
              TextFormField(
                controller: model,
                decoration: InputDecoration(
                  labelText: 'Model',
                  labelStyle:
                      GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                readOnly: true,
              ),
              const SizedBox(height: 16),
              //Licence Plate

              TextFormField(
                controller: PlateN,
                decoration: InputDecoration(
                  labelText: 'Licence Plate',
                  labelStyle:
                      GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                readOnly: true,
              ),
              const SizedBox(height: 16),
              // GPS Number field
              TextFormField(
                controller: gps,
                decoration: InputDecoration(
                  labelText: 'GPS Serial Number',
                  labelStyle:
                      GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 1.5,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(
                      color: Color.fromARGB(202, 3, 152, 85),
                      width: 2.0,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                readOnly: true,
              ),
              const SizedBox(height: 16),
              //show crash dialog if needed
              CrashStreamBuilder(driverId: widget.driverId),
            ],
          ),
        ),
      ),
    );
  }
}
