//Ensure you have Firebase Authentication set up in your project.
//Make sure the collection name (violations) and field names (driverID, violationID) match the NEW Firestore setup.
//LOG-In ....

import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/screens/ViolationDetail.dart';

class Violationslist extends StatefulWidget {
  const Violationslist({super.key});

  @override
  State<Violationslist> createState() => _ViolationslistState();
}

class _ViolationslistState extends State<Violationslist> {
  
  List<DocumentSnapshot> violations = []; // List to hold violation documents
  
      @override
  void initState() {
    super.initState();
    fetchViolations();
  }

  Future<void> fetchViolations() async { //Fetch all violations without filtering by userId
    try {
      String driverID = "1111111111"; // Set the driverID for this query


      // Query Firestore for violations where driverID matches 1111111111
      QuerySnapshot snapshot = await FirebaseFirestore.instance
          .collection('Violation')
          .where('DriverID', isEqualTo: driverID) // Removed extra spaces
          .get();


      setState(() {
        violations = snapshot.docs; // Store the retrieved documents
      });
    } catch (e) {
      print("Error fetching violations: $e");
    }
  }

  final List<bool> isHoveredList = List.generate(10, (index) => false); // List to track hover state for each item
  late DateTime _dateTime = DateTime.now();

void getDatePicker() {
  showDatePicker(
    context: context,
    initialDate: DateTime.now(),
    firstDate: DateTime(2000),
    lastDate: DateTime(3000),
    builder: (BuildContext context, Widget? child) {
      return Theme(
        data: ThemeData.light().copyWith(
          colorScheme: ColorScheme.light(
            primary: const Color(0xFF03A285), // Change the primary color of the calendar
            onPrimary: Colors.white, // Change the text color on the primary color
            surface: Colors.white, // Change the background color of the calendar
          ),
          dialogBackgroundColor: Colors.white, // Change the background color of the dialog
        ),
        child: Container(
          height: 20, // Set the height of the calendar
          width: 20, // Set the width of the calendar
          child: child,
        ),
      );
    },
  ).then((value) {
    if (value != null) {
      setState(() {
        _dateTime = value;
      });
    }
  });
}

  //late String driverID = ''; //From DB
  //final driverStream = FirebaseFirestore.instance.collection('drivers').snapshots(); //drivers//

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white, // Set the background color to white
      appBar: AppBar(
      automaticallyImplyLeading: false,
      elevation: 0,
      backgroundColor: Color.fromARGB(202, 3, 152, 85), //Color(0xFF00BF63)
      shape: RoundedRectangleBorder(
        /*borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
          ),
          */
        ),
        toolbarHeight: 120,// Adjust the toolbar height
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
          Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: 7),
                ),
                Transform.translate(
                  offset: Offset(0, 10), // Move the text down by 10 pixels to match the home page
                  child: Padding(
                    padding: const EdgeInsets.only(left: 5),
                    child: Text(
                      "My Violations",
                      style: GoogleFonts.poppins(
                        fontSize: 24.0,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.left,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 15), // Space between title and date filter
            Container(
              padding: EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Container(
                  width: double.infinity,
                  height: 40,
                  padding: EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(onPressed: () {
                        getDatePicker();
                      },
                      icon: Icon(Icons.calendar_month, color: Color.fromARGB(202, 3, 152, 85), size: 28,)),

                      Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 8.0),
                      child: Text(
                        "Select Date",
                        style: GoogleFonts.poppins(fontSize: 16, color: Color(0xFF211D1D)),
                      ),
                    ),
                  ),

                    ],
                  ),
                ),
              ),
            )
        

          ],
        ),
      ),


///////////////////////////////Violations List for this driver/////////////////////////////////////////////////
    body: Padding(
      padding: EdgeInsets.symmetric(vertical: 20),
      child: violations.isEmpty // Check if there are no violations
      ? Center(
          child: Text(
            "You don't have any violations, ride safe :)",
            style: GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
          ),
        )
      : ListView.separated(
          itemBuilder: (BuildContext context, int index) {
            return MouseRegion(
              onEnter: (_) => setState(() => isHoveredList[index] = true),
              onExit: (_) => setState(() => isHoveredList[index] = false),
              child: Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isHoveredList[index] ? Colors.grey[300] : Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: isHoveredList[index]
                      ? [BoxShadow(color: Colors.black26, blurRadius: 5)]
                      : [],
                ),
                child: InkWell(
                  onTap: () {
                    // Navigate to ViolationDetail
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => Violationdetail(), //ViolationDetail(violationId: violations[index]['violationID']); 
                      ),
                    );
                  },
                  child: ListTile(
                    title: Text(
                      'V#${violations[index].id}', // From DB
                      style: GoogleFonts.poppins(fontSize: 22),
                    ),
                    trailing: Icon(Icons.arrow_forward,
                        color: Colors.green, size: 20),
                  ),
                ),
              ),
            );
          },
          separatorBuilder: (BuildContext context, int index) {
            return Divider(color: Colors.grey[200]);
          },
          itemCount: violations.length, // Number of violations
        ),
),
      
      

/*
body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            //list of violations
            Padding(
              padding: EdgeInsets.symmetric(vertical: 10),
              child: Row(
                children: [
                  SizedBox(width: 10),
                  Text(
                    "V#111",
                    style: TextStyle(fontSize: 22),
                    ),
                    Spacer(),
                    Icon(Icons.arrow_forward, color: Colors.green, size: 20),
                    Divider(color: const Color.fromARGB(237, 158, 158, 158)), // Horizontal line
                ],
              ),
            )
          ],
        ),
      ),

      */
    );
  
  }
}