import 'package:flutter/material.dart';

class Complaintdetail extends StatefulWidget {
  final String ComplaintID;
  final String driverid;

  const Complaintdetail({Key? key, required this.ComplaintID, required this.driverid})
      : super(key: key);

  @override
  State<Complaintdetail> createState() => _ComplaintdetailState();
}

class _ComplaintdetailState extends State<Complaintdetail> {
  @override
  Widget build(BuildContext context) {
    return const Placeholder();
  }
}