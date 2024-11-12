import 'dart:io';
import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/cupertino.dart';
import 'package:googleapis_auth/auth_io.dart' as auth;
import 'package:googleapis/servicecontrol/v1.dart' as servicecontrol;

class NotificationService {
  FirebaseMessaging messaging = FirebaseMessaging.instance;

  Future<Map<String, dynamic>> loadServiceAccountJson() async {
  final contents = await rootBundle.loadString('config/sair-7310d-1d891d1a328d.json');
  final serviceAccountJson = jsonDecode(contents);
  return serviceAccountJson;
}

  Future<void> init(String driverId) async {
    // Get the device token
    String? token = await messaging.getToken();
    print("Device token: $token");

    // Save the token to Firestore
    if (token != null) {
      await FirebaseFirestore.instance
          .collection('UserTokens')
          .doc("Driver_$driverId")
          .set({'token': token});
    }

    // Configure background message handler (when app is in the background)
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Foreground message handling
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print(
          'Message received: ${message.notification?.title}, ${message.notification?.body}');
      // You can show a local notification or any other UI action here
    });
  }


// Background handler for messages when the app is in the background
  Future<void> _firebaseMessagingBackgroundHandler(
      RemoteMessage message) async {
    print(
        'Background message received: ${message.notification?.title}, ${message.notification?.body}');
    // Additional handling if needed, like saving the message
  }

  Future<String> getAccessToken() async {
    final serviceAccountJson = await loadServiceAccountJson();

    List<String> scopes = [
      "https://www.googleapis.com/auth/firebase.messaging",
    ];

    // Obtain authenticated client
    final client = await auth.clientViaServiceAccount(
      auth.ServiceAccountCredentials.fromJson(serviceAccountJson),
      scopes,
    );

    // Get the access token from client
    final token = client.credentials.accessToken.data;
    client.close();

    return token;
  }

  Future<void> sendNotificationToSlectedDriver(
      String token, String messageTitle, String messageBody) async {
    final String serverAccessToken = await getAccessToken();
    String endpointFirebaseCloudMessaging =
        'https://fcm.googleapis.com/v1/projects/sair-7310d/messages:send';

    final Map<String, dynamic> message = {
      'message': {
        'token': token, //Which user
        'notification': {
          'title': messageTitle,
          'body': messageBody,
        },
        /* IDK :)
        'data':{ //key value => driver id 
          'tripID': tripID
        }
        */
      },
    };

    final http.Response response = await http.post(
      Uri.parse(endpointFirebaseCloudMessaging),
      headers: <String, String>{
        'Content-Type': 'application/json',
        'authorization': 'Bearer $serverAccessToken'
      },
      body: jsonEncode(message),
    );

    if (response.statusCode == 200) {
      print("FCM Notification sent successfully");
    } else {
      print(
          "Failed to send FCM Notification: ${response.statusCode}, ${response.body}");
    }
  }
}
