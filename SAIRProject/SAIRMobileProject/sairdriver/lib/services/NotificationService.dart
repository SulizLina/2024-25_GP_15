import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:googleapis_auth/auth_io.dart' as auth;

class NotificationService {
  final FirebaseMessaging messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

  Future<void> init(String driverId) async {
    // Initialize local notifications
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const InitializationSettings initializationSettings =
        InitializationSettings(android: initializationSettingsAndroid);
    await flutterLocalNotificationsPlugin.initialize(initializationSettings);

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

    // Listen for token refresh using the instance member
    messaging.onTokenRefresh.listen((newToken) async {
      await FirebaseFirestore.instance
          .collection('UserTokens')
          .doc("Driver_$driverId")
          .set({'token': newToken});
    });

    // Configure background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Foreground message handling
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Message received: ${message.notification?.title}, ${message.notification?.body}');
      if (message.notification != null) {
        _showNotification(message.notification!);
      }
    });
  }

  // Load the service account JSON from assets
  Future<Map<String, dynamic>> loadServiceAccountJson() async {
    final contents = await rootBundle.loadString('config/sair-7310d-1d891d1a328d.json');
    final serviceAccountJson = jsonDecode(contents);
    return serviceAccountJson;
  }

  static Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    print('Background message received: ${message.notification?.title}, ${message.notification?.body}');
  }

  Future<String> getAccessToken() async {
    final serviceAccountJson = await loadServiceAccountJson();

    List<String> scopes = [
      "https://www.googleapis.com/auth/firebase.messaging",
    ];

    final client = await auth.clientViaServiceAccount(
      auth.ServiceAccountCredentials.fromJson(serviceAccountJson),
      scopes,
    );

    final token = client.credentials.accessToken.data;
    client.close();

    return token;
  }

  Future<void> sendNotificationToSelectedDriver(String token, String messageTitle, String messageBody) async {
    final String serverAccessToken = await getAccessToken();
    String endpointFirebaseCloudMessaging = 'https://fcm.googleapis.com/v1/projects/sair-7310d/messages:send';

    final Map<String, dynamic> message = {
      'message': {
        'token': token,
        'notification': {
          'title': messageTitle,
          'body': messageBody,
        },
      },
    };

    final http.Response response = await http.post(
      Uri.parse(endpointFirebaseCloudMessaging),
      headers: <String, String>{
        'Content-Type': 'application/json',
        'authorization': 'Bearer $serverAccessToken',
      },
      body: jsonEncode(message),
    );

    if (response.statusCode == 200) {
      print("FCM Notification sent successfully");
    } else {
      print("Failed to send FCM Notification: ${response.statusCode}, ${response.body}");
    }
  }

  Future<void> _showNotification(RemoteNotification notification) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      'your_channel_id', 'your_channel_name', channelDescription: 'your_channel_description',
      importance: Importance.max, priority: Priority.high, showWhen: false,
    );
    const NotificationDetails platformChannelSpecifics = NotificationDetails(android: androidPlatformChannelSpecifics);
   
    await flutterLocalNotificationsPlugin.show(
      0, notification.title, notification.body, platformChannelSpecifics,
      payload: 'item x',
    );
  }
}