import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:googleapis_auth/auth_io.dart' as auth;

class NotificationService {
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

  Future<Map<String, dynamic>> loadServiceAccountJson() async {
  final contents = await rootBundle.loadString('config/sair-7310d-1d891d1a328d.json');
  final serviceAccountJson = jsonDecode(contents);
  return serviceAccountJson;
}

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

    // Configure background message handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Foreground message handling
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Message received: ${message.notification?.title}, ${message.notification?.body}');
      // Show local notification
      if (message.notification != null) {
        _showNotification(message.notification!);
      }
    });
  }

  static Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Initialize FlutterLocalNotificationsPlugin
  final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  
  // Initialize settings for Android
  const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
  const InitializationSettings initializationSettings = InitializationSettings(android: initializationSettingsAndroid);
  
  await flutterLocalNotificationsPlugin.initialize(initializationSettings);

  // Define notification details
    const AndroidNotificationDetails androidNotificationDetails =
        AndroidNotificationDetails('your_channel_id', 'your_channel_name',
            channelDescription: 'your_channel_description',
            importance: Importance.max,
            priority: Priority.high);
    const NotificationDetails notificationDetails =
        NotificationDetails(android: androidNotificationDetails);

  // Display notification
  flutterLocalNotificationsPlugin.show(
    message.hashCode,
    message.notification?.title,
    message.notification?.body,
    notificationDetails,
  );
}

  Future<void> _showNotification(RemoteNotification notification) async {
    const AndroidNotificationDetails androidNotificationDetails =
        AndroidNotificationDetails('your_channel_id', 'your_channel_name',
            channelDescription: 'your_channel_description',
            importance: Importance.max,
            priority: Priority.high,
            showWhen: false);
    const NotificationDetails platformChannelSpecifics =
        NotificationDetails(android: androidNotificationDetails);

    await flutterLocalNotificationsPlugin.show(
      0, notification.title, notification.body, platformChannelSpecifics,
    );
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

  Future<void> sendNotificationToSelectedDriver(
      String token, String messageTitle, String messageBody) async {
    final String serverAccessToken = await getAccessToken();
    String endpointFirebaseCloudMessaging =
        'https://fcm.googleapis.com/v1/projects/sair-7310d/messages:send';

    final Map<String, dynamic> message = {
      'message': {
        'token': token, // Which user
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
        'authorization': 'Bearer $serverAccessToken'
      },
      body: jsonEncode(message),
    );

    if (response.statusCode == 200) {
      print("FCM Notification sent successfully");
    } else {
      print("Failed to send FCM Notification: ${response.statusCode}, ${response.body}");
    }
  }

}