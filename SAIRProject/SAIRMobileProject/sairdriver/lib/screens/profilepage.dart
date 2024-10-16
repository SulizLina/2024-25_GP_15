import 'package:flutter/material.dart';
import 'package:sairdriver/models/driver.dart';
import 'package:sairdriver/screens/welcomepage.dart';
import 'package:sairdriver/services/driver_database.dart';
import 'package:sairdriver/services/motorcycle_database.dart';
import 'editpasswordpage.dart';
import 'edit_phone_page.dart'; // Page for editing phone number
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';

class Profilepage extends StatefulWidget {
 final String driverId;  // DriverID passed from previous page

  Profilepage({required this.driverId});
  @override
  State<Profilepage> createState() => _ProfilepageState();
}

//
class _ProfilepageState extends State<Profilepage> {
  User? currentUser = FirebaseAuth.instance.currentUser; // Get current user
  driver? driverInf; // Driver information
  String?
      plateNumber; // To hold plate number fetched from Motorcycle collection
  String password = '*******';
  TextEditingController fname = TextEditingController();
  TextEditingController lname = TextEditingController();
  TextEditingController phone = TextEditingController();
  TextEditingController gps = TextEditingController();
  TextEditingController id = TextEditingController();
  TextEditingController PlateN = TextEditingController();
  TextEditingController Compn = TextEditingController();

  @override
  void initState() {
    super.initState();
    fetchDriverData(); // Fetch both driver data and plate number when the page loads

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
  plateNumber = await mdb.getPlateNumberByDriverId(widget.driverId);

  // Update text fields with fetched data after both driver data and plate number are retrieved
  if (mounted) {
    setState(() {
      fname.text = driverInf?.fname ?? '';
      lname.text = driverInf?.lname ?? '';
      phone.text = driverInf?.phoneNumber ?? '';
      id.text = driverInf?.driverId ?? '';
      Compn.text= driverInf?.CompanyName??''; 
      gps.text = ((driverInf?.gspNumber != null && driverInf?.gspNumber != 'null')
          ? driverInf!.gspNumber
          : 'No assigned GPS yet')!;
      PlateN.text = plateNumber ?? 'No plate number available';
    });
  }

  // Debugging print statement
  print('License Plate fetched: $plateNumber');
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
                    fontSize: 24.0,
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
                    return AlertDialog(
                      title: Text(
                        'Logout',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold,
                          color: Color.fromARGB(202, 3, 152, 85),
                        ),
                      ),
                      content: Text(
                        'Are you sure that you want to logout?',
                        style: GoogleFonts.poppins(fontSize: 16),
                      ),
                      actions: <Widget>[
                        // Cancel Button
                        TextButton(
                          onPressed: () {
                            Navigator.of(context)
                                .pop(); // Close the dialog without logging out
                          },
                          child: Text(
                            'Cancel',
                            style: GoogleFonts.poppins(color: Colors.grey),
                          ),
                        ),
                        // Logout Button
                        ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).pop(); // Close the dialog
                            FirebaseAuth.instance
                                .signOut(); // Firebase sign-out
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (context) =>
                                      const Welcomepage()), // Navigate to the welcome page
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor:
                                Colors.red, // Red to emphasize the action
                          ),
                          child: Text(
                            'Logout',
                            style: GoogleFonts.poppins(color: Colors.white),
                          ),
                        ),
                      ],
                    );
                  },
                );
              },
            ),

            /*
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
            return AlertDialog(
              title: Text(
                'Logout',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                ),
              ),
              content: Text(
                'Are you sure that you want to logout?',
                style: GoogleFonts.poppins(fontSize: 16),
              ),
              actions: <Widget>[
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop(); // Close the dialog
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                  ),
                  child: Text(
                    'OK',
                    style: GoogleFonts.poppins(color: Colors.white),
                  ),
                ),
              ],
            );
          },
        );
                FirebaseAuth.instance.signOut();
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const Welcomepage()),
                );
              },
            ),*/
          ],
        ),
      ),
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16.0),
        decoration: const BoxDecoration(
          color:Color(0xFFF3F3F3),
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30), // Rounded top-left corner
            topRight: Radius.circular(30), // Rounded top-right corner
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              // First Name field
              TextFormField(
                //   initialValue:
                //         driverInf?.fname ?? '', // Fetch first name from driverInf
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
                //initialValue: driverInf?.lname ?? '', // Fetch last name
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
                  suffixIcon: IconButton(
                    icon: const Icon(
                      Icons.edit,
                      color: Color.fromARGB(202, 3, 152, 85),
                    ),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => EditPhonePage(driverId: widget.driverId)),
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
                controller: id,

                //initialValue: driverInf?.driverId ?? '', // Fetch driver ID
                decoration: InputDecoration(
                  labelText: 'ID / Residency Number',
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
                controller: Compn,

                /*initialValue: (driverInf?.gspNumber != null &&
                        driverInf!.gspNumber != 'null')
                    ? driverInf!.gspNumber
                    : 'No assigned GPS yet', */ // If GPS number is null or 'null', show the default message
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
              ),              const SizedBox(height: 16),

              // Plate Number field
              TextFormField(
               // initialValue: plateNumber ?? 'Loading...', // Fetch plate number
               controller: PlateN ,
                decoration: InputDecoration(
                  labelText: 'License Plate',
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
              // GPS serial number field
              TextFormField(
                controller: gps,

                /*initialValue: (driverInf?.gspNumber != null &&
                        driverInf!.gspNumber != 'null')
                    ? driverInf!.gspNumber
                    : 'No assigned GPS yet', */ // If GPS number is null or 'null', show the default message
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
                            builder: (context) => Editpasswordpage(driverId: widget.driverId,)),
                      );
                    },
                  ),
                ),
                style: GoogleFonts.poppins(color: const Color(0xFF211D1D)),
                obscureText: true,
                readOnly: true,
              ),
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }
}

/*
  @override
  void initState() {
    super.initState();
    if (currentUser != null) {
      userId = currentUser!.uid; // Assign the user's UID from FirebaseAuth
      fetchUserData(); // Fetch user data using this UID
    } else {
      print("No user is currently signed in.");
    }
  }*/
/*
  Future<void> fetchUserData() async {
    if (userId != null) {
      // Fetch data from Firestore using the user UID
      final userDoc = await FirebaseFirestore.instance
          .collection('Driver')
          .doc(userId) // Use the UID to fetch the corresponding document
          .get();

      if (userDoc.exists) {
        setState(() {
          firstName = userDoc['Fname'];
          lastName = userDoc['Lname'];
          idNumber = userDoc['DriverID'];
          phoneNumber = userDoc['PhoneNumber'];
          // Handle null GPSSerialNumber case by showing a default message
          gpsSerialNumber =
              userDoc['GPSNumber'] ?? 'There is no assigned GPS yet';

        });
      }
    }
  }*/
  /*
   Future<void> fetchDriver() async {
    String driverID = "1111111111"; // Static driverID for now

    // Fetch driver from the data layer
    List<driver> fetchedDriver =
        await DriverDatabase().getDrivers(driverID);

    setState(() {
      driverinfo = fetchedDriver; 
    });
  }*/