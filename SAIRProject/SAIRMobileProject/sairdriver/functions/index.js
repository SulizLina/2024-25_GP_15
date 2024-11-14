const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendnotificationViolation = functions.firestore
    .document('Violation/{newV}')
    .onUpdate(async (change, context) => {
        const oldData = change.before.data();
        const newData = change.after.data();

        // Log the old and new data for debugging
        console.log('Old data:', oldData);
        console.log('New data:', newData);

        // Check if the relevant field has changed
        if (oldData && newData && oldData.newV !== newData.newV) {
            if (newData.newV === true) { // Only proceed if newV is true
                try {
                    // Fetch tokens for all documents where newV is true
                    const snapshot = await admin.firestore().collection('Violation').where('newV', '==', true).get();

                    if (snapshot.empty) {
                        console.log('No matching documents found.');
                        return;
                    }

                    // Prepare notification payload
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
                    };

                    // Send notifications to each token found
                    const promises = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.token) {
                            console.log('Sending notification to token:', data.token);
                            promises.push(admin.messaging().send({
                                token: data.token,
                                notification: payload.notification,
                                data: payload.data,
                                android: payload.android,
                                apns: payload.apns,
                            }));
                        } else {
                            console.error('FCM token not found in document:', doc.id);
                        }
                    });

                    // Wait for all notifications to be sent
                    const responses = await Promise.all(promises);
                    console.log('Notifications sent successfully:', responses);

                    // Update newV to false for all documents where newV was true
                    const updatePromises = snapshot.docs.map(doc => {
                        return admin.firestore().collection('Violation').doc(doc.id).update({
                            newV: false,
                        });
                    });
                    await Promise.all(updatePromises);
                    console.log('Updated newV to false for all relevant documents.');

                } catch (error) {
                    console.error('Error sending notification:', error);
                }
            } else {
                console.log('newV is not true; no notification sent.');
            }
        } else {
            console.log('No relevant field change detected or oldData/newData is missing.');
        }
    });