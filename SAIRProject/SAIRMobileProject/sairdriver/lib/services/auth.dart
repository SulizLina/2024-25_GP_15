import 'package:firebase_auth/firebase_auth.dart'
    as auth; // Alias Firebase's User as auth.User
import 'package:sairdriver/models/user.dart'; // Import your custom User model

class AuthService {
  final auth.FirebaseAuth _auth = auth.FirebaseAuth.instance;

  // Create user object based on Firebase User
  User? _userFromFirebaseUser(auth.User? firebaseUser) {
    return firebaseUser != null ? User(uid: firebaseUser.uid) : null;
  }

  // Auth change user stream
  Stream<User?> get user {
    return _auth.authStateChanges().map(_userFromFirebaseUser);
  }
/*
  // Sign in anonymously
  Future<User?> signinAnon() async {
    try {
      auth.UserCredential result = await _auth.signInAnonymously();
      auth.User? firebaseUser = result.user;
      return _userFromFirebaseUser(firebaseUser); // Return  custom User object
    } catch (e) {
      print(e.toString());
      return null;
    }
  }*/
}
