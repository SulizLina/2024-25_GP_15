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
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Foreground message handling
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Message received: ${message.notification?.title}, ${message.notification?.body}');
      // Show local notification
      if (message.notification != null) {
        _showNotification(message.notification!);
      }
    });
  }

  // Background handler for messages when the app is in the background
  static Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    print('Background message received: ${message.notification?.title}, ${message.notification?.body}');
    // Additional handling if needed
  }

  Future<String> getAccessToken() async {
    final serviceAccountJson = {
      "type": "service_account",
      "project_id": "sair-7310d",
      "private_key_id": "1d891d1a328d253ba53ba5eb5d0324d64aa10ee3",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCc8pRNmnc+KeBe\nHW+mUP/pZrutlH0W5Jl1FWIdUQdTAQthsue+Y0RdbqzCRnhLERaRzwXph1DRMXfA\n8Ja20nQoV53aWVcTg3hBulcISYqCcUTDU+RzQVGtND6C9NU/c5tV+hQQ9b3sgvM/\nsZzb2srgbZ8RoikwY2LLjCxb+WFD6MHDz481NW2ujYpHnEO1MZylvljhyE1UjIeQ\n5DJNIIUvJILcoxUGXmibmTieKQuhKJJ4hzc10U2roQQ9P19rW9iOZM55teXcIaTx\nY+S7iJX48HSIgsJ7jhzA5w9TBG8zJ4jBpgvxA2Y/jqS5wKswvPeCctPE71u/D85F\nx6Ql7vehAgMBAAECggEAASS9UuFsu/23Hkhtn1MYwj0W4flife+1dIZu3BLSkFbC\nG/ifOqJjhaDATnwP9VAPD4noG576RkPrgPLfzj4zTXXx9vzOpxw+nI/8gVlz0mZ7\n30Z1tCdGLpJiYDbjdN5lQ9eaHNOFijscBZtILsvlzYPO9GRvk2Qt/JitXBAxlrqQ\n/dUxrAHvlVsRH0g6OZt1CpauU6N+A0I1m88wagTeX4Jzf5Wc7HFWh8RmCTk+kUYn\nQEkNF2OC9mdaqCp4UHH2r4tHDxyeLyEZkV4DWsN4zmQI9n/AoB3awe8ojHwBhC/W\nIkTesbeRJnADxPChlZAAR1J6o0rOekaVx1t7KID7gQKBgQDUbU1pzSUZuv39Y8w7\nI36gCEOoO7tNIWQ/6PI5XmOTgCzmT8qD/VmVLbVBTDDTOZI8mdfor6kNe9x+dhDL\nXN4H01l78EoPx/9K0nxEIhQ8f7DrdKK0FgPp0t+Q5pvok1t5nx0WCd9YID5W5HE6\n6oM2c67M0ZdItL8mFjqRMWiaMQKBgQC9JANZkheEUH96eXjowh7vuT0Uu5fGsywa\nnIblQJ0aOesCIH0nHtwYQ9e9nwV3qFcPIle3Xm3CPhLDsJi9636Mo3lw4yCeuaUP\nnexVZL05pdTsx1yjgoBZG6UfuIJCbtINeFAmpMoOp+/1ZZTal2ckVe6rqey0Xrii\n2vjTs09ocQKBgQCkJOWpuJRPgpeawg/hLrc8z8X/7E/59LBzVfw96jrFkkifms5h\nGVasmE