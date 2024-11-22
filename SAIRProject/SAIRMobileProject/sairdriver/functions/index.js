const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendnotificationViolation = functions.firestore
.document('Violation/{violationID}')
.onCreate(async (snapshot, context) => {
    const newData = snapshot.data();

    try {
        const driverId = newData.driverID;

        // Check if driverId is defined
        if (!driverId) {
            console.error('driverId is undefined or null.');
            return;
        }

        const driverQuery = admin.firestore().collection('Driver').where('DriverID', '==', driverId);
        const driverQuerySnapshot = await driverQuery.get();

        if (driverQuerySnapshot.empty) {
            console.log(`Driver document with driverId ${driverId} does not exist.`);
            return;
        }

        const driverDoc = driverQuerySnapshot.docs[0];
        const driverData = driverDoc.data();
        const documentId = driverDoc.id; // Driver document ID
        const userToken = driverData.token; // Fetch the token directly from the Driver document

        if (!userToken) {
            console.error('No token found for the driver.');
            return;
        }

        const payload = {
            notification: {
                title: 'New Violation detected!',
                body: 'You have a new violation. Please check the details.',
            },
            data: {
                sound: 'beep',
                screen: 'ViolationsList',
                driverData: documentId || '',
            },
            android: {
                priority: 'high',
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'beep',
                    },
                },
            },
        };

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
                const crashId = newData.crashID;
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
                const documentId = driverDoc.id;
                console.log(`Fetching crash with crash: ${crashId}`);
                // Fetch the crash document from the Crash collection where CrashID matches
                const crashQuery = admin.firestore().collection('Crash').where('crashID', '==', crashId);
                const crashQuerySnapshot = await crashQuery.get();

                if (crashQuerySnapshot.empty) {
                    console.log(`crash document with crashId ${crashId} does not exist.`);
                    return;
                }

                const crashDoc = crashQuerySnapshot.docs[0];
                const crashData = crashDoc.data();
                const crashdocumentId = crashData.id; 
                const userToken = driverData.token; 

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
                        screen: 'CrashList',
                        driverData: documentId || '',
                        crashData: crashdocumentId || '',
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
    exports.autoConfirmPendingCrashes = functions.firestore
    .document('Crash/{crashID}')
    .onCreate(async (snapshot, context) => {
        const newData = snapshot.data();
        const crashRef = snapshot.ref;

        // Check if the status is 'Pending'
        if (newData && newData.Status === 'Pending') {
            try {
                const createdTime = newData.time; // Timestamp in seconds
                const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
                const fiveMinutesDelay = 300; // 5 minutes in seconds

                const delay = Math.max(0, (createdTime + fiveMinutesDelay - currentTime) * 1000);

                console.log(`Crash ID: ${context.params.crashID}`);
                console.log(`Created Time: ${createdTime}, Current Time: ${currentTime}`);
                console.log(`Calculated Delay: ${delay} milliseconds`);

                setTimeout(async () => {
                    try {
                        console.log('Timeout executed. Re-fetching document...');
                        const docSnapshot = await crashRef.get();

                        if (!docSnapshot.exists) {
                            console.log(`Document with ID ${context.params.crashID} no longer exists.`);
                            return;
                        }

                        const docData = docSnapshot.data();

                        // Check if the status is still 'Pending'
                        if (docData && docData.Status === 'Pending') {
                            console.log(`Auto-confirming crash with ID: ${context.params.crashID}`);
                            await crashRef.update({ Status: 'Confirmed', isAuto: true, isAutoshown: true  });
                            console.log('Crash status successfully updated to "auto confirmed".');
                        } else {
                            console.log(`Crash ID ${context.params.crashID} status is no longer "Pending". Status: ${docData.Status}`);
                        }
                    } catch (error) {
                        console.error('Error during status update:', error);
                    }
                }, delay);
            } catch (error) {
                console.error('Error while setting auto-confirmation:', error);
            }
        } else {
            console.log('Crash status is not "Pending". No action required.');
        }
    });