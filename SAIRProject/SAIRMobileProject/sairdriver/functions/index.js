const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

admin.initializeApp();

//Sending notification about new violation
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
//Sending notification about potential violation
exports.sendnotificationPotentialViolation = functions.firestore
    .document('PotentialViolation/{PotentialViolationID}')
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
                    title: 'Caution: Potential Violation Ahead',
                    body: 'You are approaching the maximum speed limit. Please drive slowly and safely to avoid any violations.',
                },
                data: {
                    sound: 'beep',
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
//Sending notification about new crash
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
                if (!crashId) {
                    console.error('crashID is undefined or null.');
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
                const crashdocumentId = crashDoc.id;
                const userToken = driverData.token;

                if (!userToken) {
                    console.error('No token found for the driver.');
                    return;
                }

                // Prepare notification payload
                const payload = {
                    notification: {
                        title: 'Crash detected!',
                        body: 'Please open the app and confirm your safety or request help within 10 minutes. SOS will activate automatically if no response is received.',
                    },
                    data: {
                        sound: 'beep', // Custom data
                        screen: 'CrashList',
                        driverData: documentId || '',
                        crashData: crashdocumentId || 'crashdocumentId is null',
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

//Confirming crashes
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
                const fiveMinutesDelay = 600; // 10 minutes in seconds

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
                            await crashRef.update({ Status: 'Emergency SOS', isAuto: true, isAutoshown: true });
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
//Sending notification about complaints 
exports.sendnotificationComplaints = functions.firestore
    .document('Complaint/{Status}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();

        try {
            const driverId = newData.driverID;
            const complaintId = newData.ComplaintID;

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
            const documentId = driverDoc.id;
            const userToken = driverData.token;

            if (!userToken) {
                console.error('No token found for the driver.');
                return;
            }

            const payload = {
                notification: {
                    title: 'Complaint Status Updated!',
                    body: `The status of your complaint (ID: ${complaintId}) has been updated to ${newData.Status.toLowerCase()}. Open the app for more details.`,
                },
                data: {
                    sound: 'beep',
                    screen: 'ComplaintList',
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