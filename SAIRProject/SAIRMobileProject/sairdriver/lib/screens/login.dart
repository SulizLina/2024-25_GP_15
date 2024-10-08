import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:sairdriver/models/user.dart';
import 'package:sairdriver/services/auth.dart';

class Login extends StatefulWidget {
  const Login({super.key});

  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
final AuthService _auth = AuthService(); 

//text field state
String id=''; 
String password= ''; 
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(  // Center the logo
                child: Image.asset(
                  'assets/image/SAIRLogo.png', //new logo
                  height: 200, 
                ),
              ),
              SizedBox(
                height: 20.0,
              ),
              Text(
                "Welcome to SAIR, Glad to see you again!", //chande the size
                style: GoogleFonts.poppins(
                  color: Color.fromARGB(202, 3, 152, 85),
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.left,
              ),
              SizedBox(
                height: 44.0,
              ),
              TextField(
                onChanged:(val){
                  setState(() => id =val);
                    
                
                } ,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  hintText: "User ID / Residency number",
                  prefixIcon: Icon(
                    Icons.person,
                    color: Color.fromARGB(202, 3, 152, 85),
                  ),
                  contentPadding: EdgeInsets.symmetric(vertical: 20.0), // Align text and icon
                ),
              ),
              SizedBox(
                height: 26.0,
              ),
              TextField(
                onChanged:(val){
                  setState(() => password  =val); 
                } ,
                obscureText: true,
                decoration: InputDecoration(
                  hintText: "User Password",
                  prefixIcon: Icon(
                    Icons.lock,
                    color: Color.fromARGB(202, 3, 152, 85),
                  ),
                  contentPadding: EdgeInsets.symmetric(vertical: 20.0), // Align text and icon
                ),
              ),
              SizedBox(
                height: 12.0,
              ),
              Text(
                "Forgot your password?",
                style: GoogleFonts.poppins(
                  color: Color.fromARGB(202, 3, 152, 85),
                  fontSize: 14,
                ),
              ),
              SizedBox(
                height: 88.0,
              ),
              Container(
                width: double.infinity,
                child: RawMaterialButton(
                  fillColor: Color.fromARGB(202, 3, 152, 85),
                  elevation: 0.0,
                  padding: EdgeInsets.symmetric(vertical: 20.0),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12.0),
                  ),
                  onPressed: () async{
                    print(id); 
                      print(password);
                  },
                  child: Text(
                    "Login",
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
