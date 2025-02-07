import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:sairdriver/models/violation.dart';
import 'package:sairdriver/messages/success.dart';
import 'package:sairdriver/screens/ViewComplaints.dart';
import 'package:sairdriver/services/Complaint_database.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:dropdown_button2/dropdown_button2.dart';

class Raisecomplaint extends StatefulWidget {
  final Violation violation;
  final String driverid;
  final String page;
  const Raisecomplaint(
      {Key? key,
      required this.violation,
      required this.driverid,
      required this.page})
      : super(key: key);

  @override
  State<Raisecomplaint> createState() => _RaisecomplaintState();
}

class StyledDropdown extends StatelessWidget {
  final String? selectedReason;
  final List<String> reasons;
  final Function(String?) onChanged;

  const StyledDropdown({
    Key? key,
    required this.selectedReason,
    required this.reasons,
    required this.onChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField2<String>(
      isExpanded: true,
      decoration: InputDecoration(
        contentPadding: const EdgeInsets.symmetric(vertical: 16),
        border: OutlineInputBorder(
          borderSide: const BorderSide(
            color: Color.fromARGB(201, 3, 152, 85),
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(15),
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: const BorderSide(
            color: Color.fromARGB(201, 3, 152, 85),
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(10),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: const BorderSide(
            color: Color.fromARGB(255, 3, 152, 85),
            width: 2.0,
          ),
          borderRadius: BorderRadius.circular(10),
        ),
      ),
      hint: Text(
        'Select a reason',
        style: GoogleFonts.poppins(
          fontSize: 15,
          color: Colors.black,
        ),
      ),
      items: reasons
          .map((reason) => DropdownMenuItem<String>(
                value: reason,
                child: Text(
                  reason,
                  style: const TextStyle(fontSize: 14),
                ),
              ))
          .toList(),
      value: selectedReason,
      onChanged: (value) {
        onChanged(value); // Notify parent about the change
      },
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Please choose a reason';
        }
        return null;
      },
      dropdownStyleData: DropdownStyleData(
        maxHeight: 200, // Limit dropdown height
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          color: Colors.white,
        ),
      ),
      menuItemStyleData: const MenuItemStyleData(
        padding: EdgeInsets.symmetric(horizontal: 16),
      ),
    );
  }
}

class _RaisecomplaintState extends State<Raisecomplaint> {
  final _controller = TextEditingController();
  final maxChararcter = 250;
  final _formKey = GlobalKey<FormState>();
  String? selectedReason;

  final List<String> reasons = [
    'Damaged motorcycle',
    'I do not own a motorcycle',
    'Stolen motorcycle',
    'Motorcycle GPS is stolen or lost',
    'No violation committed',
    'I did not visit the place where this violation was recorded',
    'Emergency case',
    'My motorcycle suddenly disrupted',
    'Other',
  ];

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
          selectedReason!,
        );
        // Show a confirmation message
        SuccessMessageDialog.show(context, "Complaint submitted successfully!");

        // Close the current screen after showing the dialog
        Future.delayed(Duration(seconds: 1), () {
          // Navigator.pop(context);
          if (widget.page == 'violation') {
            Navigator.pop(context);
          }
          if (widget.page == 'complaints') {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => Viewcomplaints(
                  driverId: widget.driverid,
                ),
              ),
            );
          }
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
      backgroundColor: const Color.fromARGB(255, 3, 152, 85),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: const Color.fromARGB(255, 3, 152, 85),
        toolbarHeight: 100,
        iconTheme: const IconThemeData(color: Color(0xFFFAFAFF)),
        title: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () {
                Navigator.pop(context);
              },
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                "Raise Complaint",
                style: GoogleFonts.poppins(
                  fontSize: 23,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFFAFAFF),
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
                        color: const Color.fromARGB(201, 3, 152, 85),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Describe your complaint about the violation below',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 20),
                    StyledDropdown(
                      selectedReason: selectedReason,
                      reasons: reasons,
                      onChanged: (value) {
                        setState(() {
                          selectedReason = value!;
                        });
                      },
                    ),
                    const SizedBox(height: 20),
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
                          borderSide: const BorderSide(
                            color: Color.fromARGB(201, 3, 152, 85),
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderSide: const BorderSide(
                            color: Color.fromARGB(201, 3, 152, 85),
                            width: 2.0,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        errorBorder: OutlineInputBorder(
                          borderSide: const BorderSide(
                            color: Colors.red,
                            width: 2.0,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        focusedErrorBorder: OutlineInputBorder(
                          borderSide: const BorderSide(
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
                    const SizedBox(height: 8),
                    Text(
                      '${_controller.text.length}/$maxChararcter characters',
                      style: const TextStyle(
                        color: Colors.grey,
                        fontSize: 12,
                      ),
                    ),
                   const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 12), // Space before text
                        Row(
                          children: [
                            Icon(
                              HugeIcons.strokeRoundedInformationCircle,
                              color: Colors.red,
                              size: 24,
                            ),
                            const SizedBox(width: 4), // Space between icon and text
                            Expanded(
                              child: Text(
                                'Three rejected complaints in a hijri year may eventually lead to a temporary suspension of the service.',
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  color: Colors.red,
                            
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 25), // Add space after the content
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: submitComplaint,
                        style: ElevatedButton.styleFrom(
                          backgroundColor:
                              const Color.fromARGB(201, 3, 152, 85),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15.0),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 16),
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
                    const SizedBox(height: 110),
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
