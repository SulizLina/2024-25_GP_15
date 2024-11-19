const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendnotificationViolation= functions.firestore
.document('Violation/{violationID}')
.onCreate(async (snapshot, context) => {
    const newData = snapshot.data();

        try {
            // Get the driverId from the Crash document
            const driverId = newData.driverID;

            // Check if driverId is defined
            if (!driverId) {
                console.error('driverId is undefined or null.');
                return;
            }

            console.log(`Fetching driver with driverId: ${driverId}`);

            // Fetch the driver document from the Driver collection where DriverID matches
            const driverQuery = admin.firestore().collection('Driver').where('DriverID', '==', driverId);
            const driverQuerySnapshot = await driverQuery.get();

            if (driverQuerySnapshot.empty) {
                console.log(`Driver document with driverId ${driverId} does not exist.`);
                return;
            }

            const driverDoc = driverQuerySnapshot.docs[0];
            const driverData = driverDoc.data();
            const userToken = driverData.token; // Fetch the token directly from the Driver document

            if (!userToken) {
                console.error('No token found for the driver.');
                return;
            }

            // Prepare notification payload
            const payload = {
                notification: {
                    title: 'New Violation detected!',
                    body: 'You have a new violation. Please check the details.',
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

            // Send the notification to the user token
            const response = await admin.messaging().send({
                token: userToken,
                notification: payload.notification,
                data: payload.data,
                android: payload.android,
                apns: payload.apns,
            });

            console.log('Notification sent successfully:', response);

        } catch (error) {
            console.error('Error sending notification:', error);
        }
});

    exports.sendNotificationForPendingStatus = functions.firestore
    .document('Crash/{Status}')
    .onCreate(async (snapshot, context) => {
        const newData = snapshot.data();

        // Check if the status is 'Pending'
        if (newData && newData.Status === 'Pending') {
            try {
                // Get the driverId from the Crash document
                const driverId = newData.driverID;

                // Check if driverId is defined
                if (!driverId) {
                    console.error('driverId is undefined or null.');
                    return;
                }

                console.log(`Fetching driver with driverId: ${driverId}`);

                // Fetch the driver document from the Driver collection where DriverID matches
                const driverQuery = admin.firestore().collection('Driver').where('DriverID', '==', driverId);
                const driverQuerySnapshot = await driverQuery.get();

                if (driverQuerySnapshot.empty) {
                    console.log(`Driver document with driverId ${driverId} does not exist.`);
                    return;
                }

                const driverDoc = driverQuerySnapshot.docs[0];
                const driverData = driverDoc.data();
                const userToken = driverData.token; // Fetch the token directly from the Driver document

                if (!userToken) {
                    console.error('No token found for the driver.');
                    return;
                }

                // Prepare notification payload
                const payload = {
                    notification: {
                        title: 'New Crash detected!',
                        body: 'Please open the app and verify it.',
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

                // Send the notification to the user token
                const response = await admin.messaging().send({
                    token: userToken,
                    notification: payload.notification,
                    data: payload.data,
                    android: payload.android,
                    apns: payload.apns,
                });

                console.log('Notification sent successfully:', response);

            } catch (error) {
                console.error('Error sending notification:', error);
            }
        } else {
            console.log('Status is not Pending; no notification sent.');
        }
    });