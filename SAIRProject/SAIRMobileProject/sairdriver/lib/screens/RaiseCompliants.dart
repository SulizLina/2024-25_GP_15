import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/messages/success.dart';
import 'package:sairdriver/services/Complaint_database.dart';
import 'package:flutter/services.dart';

class Raisecomplaint extends StatefulWidget {
  final Violation violation;
  final String driverid;

  const Raisecomplaint(
      {Key? key, required this.violation, required this.driverid})
      : super(key: key);

  @override
  State<Raisecomplaint> createState() => _RaisecomplaintState();
}

class _RaisecomplaintState extends State<Raisecomplaint> {
  final _controller = TextEditingController();
  final maxChararcter = 250;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();

    _controller.addListener(() {
      if (_controller.text.length > maxChararcter) {
        _controller.text = _controller.text.substring(0, maxChararcter);
        _controller.selection = TextSelection.fromPosition(
          TextPosition(offset: _controller.text.length),
        );
      }
      setState(() {});
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> submitComplaint() async {
    if (_formKey.currentState!.validate()) {
      try {
        await ComplaintDatabase().raiseComplaint(
          widget.violation,
          _controller.text,
          widget.driverid,
        );
        // Show a confirmation message
        SuccessMessageDialog.show(context, "Complaint submitted successfully!");

        // Close the current screen after showing the dialog
        Future.delayed(Duration(seconds: 1), () {
          Navigator.pop(context);
        });
      } catch (error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Failed to submit complaint: $error")),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color.fromARGB(255, 3, 152, 85),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Color.fromARGB(255, 3, 152, 85),
        toolbarHeight: 100,
        iconTheme: const IconThemeData(color: Color(0xFFFAFAFF)),
        title: Row(
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back),
              onPressed: () {
                Navigator.pop(context);
              },
            ),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                "Raise Complaint",
                style: GoogleFonts.poppins(
                  fontSize: 23,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFFAFAFF),
                ),
                textAlign: TextAlign.start,
              ),
            ),
          ],
        ),
      ),
      body: GestureDetector(
        onTap: () {
          FocusScope.of(context).unfocus();
        },
        child: SingleChildScrollView(
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.only(top: 16.0),
            decoration: const BoxDecoration(
              color: Color(0xFFFAFAFF),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(30),
                topRight: Radius.circular(30),
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Raise a Complaint on violation number: ${widget.violation.Vid}',
                      style: GoogleFonts.poppins(
                        fontSize: 21,
                        fontWeight: FontWeight.bold,
                        color: Color.fromARGB(201, 3, 152, 85),
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Describe your complaint about the violation below',
                      style:
                          GoogleFonts.poppins(fontSize: 14, color: Colors.grey),
                    ),
                    SizedBox(height: 20),
                    TextFormField(
                      controller: _controller,
                      maxLines: 5,
                      keyboardType: TextInputType.multiline,
                      inputFormatters: [
                        FilteringTextInputFormatter.deny(RegExp(r'\n')),
                      ],
                      decoration: InputDecoration(
                        labelText: 'Enter Your Complaint',
                        alignLabelWithHint: true,
                        enabledBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: Color.fromARGB(201, 3, 152, 85),
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: Color.fromARGB(201, 3, 152, 85),
                            width: 2.0,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        errorBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: Colors.red,
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        focusedErrorBorder: OutlineInputBorder(
                          borderSide: BorderSide(
                            color: Colors.red,
                            width: 2.0,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your complaint';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 8),
                    Text(
                      '${_controller.text.length}/$maxChararcter characters',
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 12,
                      ),
                    ),
                    SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: submitComplaint,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color.fromARGB(201, 3, 152, 85),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15.0),
                          ),
                          padding: EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: Text(
                          'Submit',
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    SizedBox(height: 190),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
