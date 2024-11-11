import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class Notification {
  static Future initialize(FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin) async {
    var androidInitialize = AndroidInitializationSettings('mipmap/ic_launcher');
    var iOSInitialize = DarwinInitializationSettings(); 
    
    var initializationSettings = InitializationSettings(
      android: androidInitialize,
      iOS: iOSInitialize,
    );

    await flutterLocalNotificationsPlugin.initialize(initializationSettings);
  }

  static Future showBigTextNotification ({var id = 0 , required String title, required String body, 
  var payload, required FlutterLocalNotificationsPlugin fln}) async{
    AndroidNotificationDetails androidPlatformChannelSpecifics = 
    new AndroidNotificationDetails(
      'channel',
      "channelName", 

      playSound: true, 
      //sound: RawResourceAndroidNotificationSound('notification'), 
      importance: Importance.max,
      priority :Priority.high , 
      ); 

      var not = NotificationDetails(android:  androidPlatformChannelSpecifics, 
      iOS: DarwinNotificationDetails()
      );

      await fln.show(0, title, body, not);
  }
}