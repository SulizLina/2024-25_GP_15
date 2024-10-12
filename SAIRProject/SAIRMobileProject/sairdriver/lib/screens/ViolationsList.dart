import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/services/Violations_database.dart';
import 'package:sairdriver/screens/ViolationDetail.dart';

class Violationslist extends StatefulWidget {
  const Violationslist({super.key});

  @override
  State<Violationslist> createState() => _ViolationslistState();
}

class _ViolationslistState extends State<Violationslist> {
  List<Violation> violations = []; // Use the Violation model

  @override
  void initState() {
    super.initState();
    fetchViolations();
  }

  Future<void> fetchViolations() async {
    String driverID = "1111111111"; // Static driverID for now

    // Fetch violations from the data layer
    List<Violation> fetchedViolations =
        await ViolationsDatabase().getViolations(driverID);

    setState(() {
      violations = fetchedViolations; // Store the fetched violations
    });
  }

  final List<bool> isHoveredList = List.generate(10, (index) => false);
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
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF03A285),
              onPrimary: Colors.white,
              surface: Colors.white,
            ),
            dialogBackgroundColor: Colors.white,
          ),
          child: Container(
            height: 20,
            width: 20,
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
      backgroundColor:  Color.fromARGB(255, 3, 152, 85), 
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Color.fromARGB(255, 3, 152, 85), 
        toolbarHeight: 120,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: 7),
                ),
                Transform.translate(
                  offset: const Offset(0, 10),
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
            const SizedBox(height: 15),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Container(
                  width: double.infinity,
                  height: 40,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        onPressed: () {
                          getDatePicker();
                        },
                        icon: const Icon(Icons.calendar_month,
                            color: Color.fromARGB(202, 3, 152, 85), size: 28),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(left: 8.0),
                          child: Text(
                            "Select Date",
                            style: GoogleFonts.poppins(
                                fontSize: 16, color: const Color(0xFF211D1D)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      // Body with rounded white background from the top
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.only(top: 16.0),
        decoration: const BoxDecoration(
          color: Colors.white, // White background for the content
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(30), // Rounded top-left corner
            topRight: Radius.circular(30), // Rounded top-right corner
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: violations.isEmpty
              ? Center(
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
                        child: InkWell(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    Violationdetail(), // Ensure Violationdetail exists and is imported
                              ),
                            );
                          },
                          child: ListTile(
                            title: Text(
                              'V#${violations[index].id}', // Use violation model
                              style: GoogleFonts.poppins(fontSize: 22),
                            ),
                            trailing: const Icon(Icons.arrow_forward,
                                color: Colors.green, size: 20),
                          ),
                        ),
                      ),
                    );
                  },
                  separatorBuilder: (BuildContext context, int index) {
                    return Divider(color: Colors.grey[200]);
                  },
                  itemCount: violations.length,
                ),
        ),
      ),
    );
  }
}
