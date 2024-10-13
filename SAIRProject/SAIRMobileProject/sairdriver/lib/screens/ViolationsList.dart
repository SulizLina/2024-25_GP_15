//Make sure the collection name (violations) and field names (driverID, violationID) match the NEW Firestore setup.
//LOG-In ....

import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/services/Violations_database.dart';
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
          .collection('te2')
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
            primary: const Color(0xFF03A285), 
            onPrimary: Colors.white, 
            surface: Colors.white, 
          ),
          dialogBackgroundColor: Colors.white, 
        ),
        child: Container(
          height: 10, 
          width: 10, 
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color.fromARGB(255, 3, 152, 85),  
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Color.fromARGB(255, 3, 152, 85), // Color(0xFF00BF63)
        toolbarHeight: 120,
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween, // Space between title and date filter
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(left: 7),
                child: Transform.translate(
                  offset: const Offset(0, 10), // Move the text down by 10 pixels to match the home page
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
              ),
            ),

            // Date filter icon
            Padding( // Added Padding widget to control the position of the icon
              padding: const EdgeInsets.only(right: 18, top: 10), //////////////////////offset: const Offset(0, 10),
              child: IconButton(
                onPressed: () {
                  getDatePicker();
                },
                icon: const Icon(
                  Icons.calendar_month,
                  color: Colors.white, 
                  size: 30, 
                ),
              ),
            ),
          ],
        ),
      ),

      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16), /////////////////////should be consis for all pages/////////////
        decoration: const BoxDecoration(
          color: Colors.white, 
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30), 
            topRight: Radius.circular(30), 
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: violations.isEmpty
              ? Center(/////////////we can add image or somthing 
                  child: Text(
                    "You don't have any violations, ride safe :)",
                    style:
                        GoogleFonts.poppins(fontSize: 20, color: Colors.grey),
                  ),
                )
              : ListView.separated(
                  itemBuilder: (BuildContext context, int index) {
                    return MouseRegion(
                      onEnter: (_) =>
                          setState(() => isHoveredList[index] = true),
                      onExit: (_) =>
                          setState(() => isHoveredList[index] = false),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isHoveredList[index]
                              ? Colors.grey[300]
                              : Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: isHoveredList[index]
                              ? [
                                  const BoxShadow(
                                      color: Colors.black26, blurRadius: 5)
                                ]
                              : [],
                        ),
                /*child: InkWell(
                  onTap: () {
                    // Navigate to ViolationDetail
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => Violationdetail(), //ViolationDetail(violationId: violations[index],id); 
                      ),
                    );
                  }, */
                  child: ListTile(
                    title: Text( //Title
                      'V#${violations[index].id}', // From DB
                      style: GoogleFonts.poppins(fontSize: 17),
                    ),
                    //we can add Subtitle: Text(''),
                    //we can add leading: Icon(), //icon or image on the right before the title
                    trailing: Icon(
                      Icons.arrow_forward_ios, 
                      color: Color.fromARGB(202, 3, 152, 85), 
                      size: 20, 
                    ),
                    onTap: (){
                      Navigator.push(
                        context, 
                        MaterialPageRoute(builder: (context)=> Violationdetail(violationId: violations[index].id))
                      );
                    },
                  ),
                //),
              ),
            );
          },
          separatorBuilder: (BuildContext context, int index) {
            return Divider(color: Colors.grey[200]);
          },
          itemCount: violations.length, // itemCount: Number of violations
                ),
        ),
      ),
    );
  }
}
