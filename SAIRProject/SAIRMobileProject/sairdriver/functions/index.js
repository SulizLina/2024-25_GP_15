const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendnotificationViolation = functions.firestore
    .document('Violation/{newV}')
    .onUpdate(async (change, context) => {
        const oldData = change.before.data();
        const newData = change.after.data();

        // Check if the relevant field has changed
        if (oldData && newData && oldData.newV !== newData.newV) {
            const payload = {
                notification: {
                    title: 'New violation!',
                    body: 'You can see all details in the app',
                },
                data: {
                    sound: 'beep', // Custom data
                },
                android: {
                    priority: 'high', // Set priority for Android
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'beep', // Custom sound for iOS
                        },
                    },
                },
                token: newData.token, // Token should be here
            };

            if (newData.token) {
                try {
                    // Send the notification
                    const response = await admin.messaging().send({
                        token: newData.token,
                        notification: payload.notification, // Send the notification object
                        data: payload.data, // Send additional data
                        android: payload.android, // Include Android specifics
                        apns: payload.apns, // Include iOS specifics
                    });
                    console.log('Notification sent successfully:', response);
                } catch (error) {
                    console.error('Error sending notification:', error);
                }
            } else {
                console.error('FCM token not found in newData');
            }
        }
    });