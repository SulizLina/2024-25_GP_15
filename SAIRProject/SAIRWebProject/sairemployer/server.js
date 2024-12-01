const express = require("express");
const admin = require("firebase-admin");

const serviceAccount = require("./sair-7310d-firebase-adminsdk-9tvud-c93be3a265.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

const db = admin.firestore();

const axios = require("axios");
const app = express();

// Create an Express server
const PORT = process.env.PORT || 3000;

// Wialon API credentials
const WIALON_TOKEN = "8ca297495a6d20aed50815e6f79cdd3b2D6292586C51CF2BE801FC0E4C312A5474C9BB71";
const WIALON_BASE_URL = "https://hst-api.wialon.com";

// Function to log in to Wialon and retrieve a session ID
const loginToWialon = async () => {
  const loginUrl = `${WIALON_BASE_URL}/wialon/ajax.html?svc=token/login&params={"token":"${WIALON_TOKEN}"}`;
  try {
    const response = await axios.post(loginUrl, null, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data.eid; // Session ID
  } catch (error) {
    console.error("Error logging into Wialon:", error.message);
    throw new Error("Failed to log in");
  }
};

// Function to fetch units using the session ID
const fetchUnits = async (sessionId) => {
    const flags = 1 | 1024; 
  const unitsUrl = `${WIALON_BASE_URL}/wialon/ajax.html?sid=${sessionId}&svc=core/search_items&params={"spec":{"itemsType":"avl_unit","propName":"sys_name","propValueMask":"*","sortType":"sys_name"},"force":1,"flags":${flags},"from":0,"to":0}`;
  try {
    const response = await axios.post(unitsUrl, null, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching units:", error.message);
    throw new Error("Failed to fetch units");
  }
};


const fetchMaxSpeed = async (lat, lon) => {
    const radius = 10; // 10 meters radius
    const overpassUrl = `http://overpass-api.de/api/interpreter?data=[out:json];(way["maxspeed"](around:${radius},${lat},${lon}););out body;`;
  
    try {
      const response = await axios.get(overpassUrl);
      const ways = response.data.elements;
  
   
      if (ways.length > 0) {
        // Get the first way found with a maxspeed tag
        const firstWay = ways[0];
        const maxspeed = firstWay.tags.maxspeed || 'No maxspeed found';
        console.log('Max speed from API in fetchmax:', maxspeed);

        return parseMaxSpeed(maxspeed); // Use parseMaxSpeed to convert to a number
      } else {
        console.log('no mexspeed');
        return 0; // Return 0 if no speed limit is found
      }
    } catch (error) {
      console.error('Error fetching max speed:', error);
      return 0; // Return 0 on error
    }
  };
  


  const parseMaxSpeed = (maxspeed) => {
    const match = maxspeed.match(/(\d+)\s*(km\/h|mph)?/);
    return match ? parseInt(match[1], 10) : 0; // Return 0 if no match
  };

  const processUnits1 = async (units,sessionId) => {
    for (const unit of units) {

        const pos = unit.pos; // Position object from Wialon
        console.log(pos);

        if (pos && unit.lmsg) {
            const GPSserialnumber = unit.nm; // Get unit name as GPS serial number
            console.log('gpsnum:', GPSserialnumber);

            const maxSpeed = await fetchMaxSpeed(pos.y, pos.x); // Fetch max speed
            console.log('Max speed from API in process method:', maxSpeed);

            if (maxSpeed !== 0) {
                const driverSpeed = pos.s; // Get the driver's speed
                console.log('driverspeed:', driverSpeed);

                if (driverSpeed > maxSpeed) {
                    const driverQuerySnapshot = await db.collection('Driver')
                        .where('GPSnumber', '==', GPSserialnumber)
                        .get();

                    if (!driverQuerySnapshot.empty) {
                        const driverid = driverQuerySnapshot.docs[0].data().DriverID;
                        console.log('DriverID:', driverid);

                        let price = calculatePrice(driverSpeed, maxSpeed);
                        console.log('price:', price);

                        if (price !== 0) {
                            const motorcycleSnapshot = await db.collection('Motorcycle')
                                .where('GPSnumber', '==', GPSserialnumber)
                                .get();

                            if (!motorcycleSnapshot.empty) {
                                const motorcycleData = motorcycleSnapshot.docs[0].data();
                                const Brand = motorcycleData.Brand;
                                const LicensePlate = motorcycleData.LicensePlate;
                                const Model = motorcycleData.Model;
                                const MotorcycleID = motorcycleData.MotorcycleID;
                                const Type = motorcycleData.Type;

                                const ViolationID = generateViolationId();
                                const newViolationTime = unit.lmsg.rt; // Real-time timestamp of this violation
                                console.log('viotime:', newViolationTime);

                                let count50 = 0;
                                let count30 = 0;

                                if (maxSpeed <= 120) {
                                    if (price === 1500) {
                                        count50 = 1;
                                        const starttime = newViolationTime - 365 * 24 * 60 * 60;
                                        const endtime = newViolationTime;

                                        const querySnapshot1 = await db.collection('Violation')
                                            .where('GPSnumber', '==', GPSserialnumber)
                                            .where('driverID', '==', driverid)
                                            .where('time', '>=', starttime)
                                            .where('time', '<=', endtime)
                                            .get();

                                        if (!querySnapshot1.empty) {
                                            querySnapshot1.forEach((doc) => {
                                                const violationData = doc.data();
                                                count50 += violationData.count50 || 0;
                                            });
                                        }

                                        if (count50 > 1) {
                                            price = 2000; // Max fine
                                        }
                                    }
                                } else {
                                    if (price === 1500) {
                                        count30 = 1;
                                        const starttime = newViolationTime - 365 * 24 * 60 * 60;
                                        const endtime = newViolationTime;

                                        const querySnapshot2 = await db.collection('Violation')
                                            .where('GPSnumber', '==', GPSserialnumber)
                                            .where('driverID', '==', driverid)
                                            .where('time', '>=', starttime)
                                            .where('time', '<=', endtime)
                                            .get();

                                        if (!querySnapshot2.empty) {
                                            querySnapshot2.forEach((doc) => {
                                                const violationData = doc.data();
                                                count30 += violationData.count30 || 0;
                                            });
                                        }

                                        if (count30 > 1) {
                                            price = 2000; // Max fine
                                        }
                                    }
                                }

                                const querySnapshot = await db.collection('Violation')
                                    .where('GPSnumber', '==', GPSserialnumber)
                                    .where('driverID', '==', driverid)
                                    .orderBy('time', 'desc')
                                    .get();

                                const position = { longitude: pos.x, latitude: pos.y };


                                const location = await fetchLocationWithGoogleMaps( pos.y, pos.x);
                                console.log(location);


                                if (!querySnapshot.empty) {
                                    const lastViolation = querySnapshot.docs[0];
                                    const distance = haversineDistance(
                                        lastViolation.data().position.latitude,
                                        lastViolation.data().position.longitude,
                                        pos.y,
                                        pos.x
                                    );
                                    console.log('distance:', distance);

                                    if (distance > 30) {
                                        await storeViolation(ViolationID, driverid, GPSserialnumber, location, position, driverSpeed, maxSpeed, newViolationTime, price, count50, count30);
                                        await storeHistory(ViolationID, driverid, GPSserialnumber, Brand, LicensePlate, Model, MotorcycleID, Type);
                                    } else {
                                        const tenMinutesInSeconds = 10 * 60;

                                        if (!areDatesEqual(lastViolation.data().time, newViolationTime)) {
                                            console.log('New violation date');
                                            await storeViolation(ViolationID, driverid, GPSserialnumber, location, position, driverSpeed, maxSpeed, newViolationTime, price, count50, count30);
                                            await storeHistory(ViolationID, driverid, GPSserialnumber, Brand, LicensePlate, Model, MotorcycleID, Type);
                                        } else if (newViolationTime - lastViolation.data().time > tenMinutesInSeconds) {
                                            console.log('Violation exceeds 10 minutes');
                                            await storeViolation(ViolationID, driverid, GPSserialnumber, location, position, driverSpeed, maxSpeed, newViolationTime, price, count50, count30);
                                            await storeHistory(ViolationID, driverid, GPSserialnumber, Brand, LicensePlate, Model, MotorcycleID, Type);
                                        } else {
                                            console.log('Violation ignored due to proximity.');
                                        }
                                    }
                                } else {
                                    await storeViolation(ViolationID, driverid, GPSserialnumber, location, position, driverSpeed, maxSpeed, newViolationTime, price, count50, count30);
                                    await storeHistory(ViolationID, driverid, GPSserialnumber, Brand, LicensePlate, Model, MotorcycleID, Type);
                                    console.log('First violation for this GPS.');
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};


const GOOGLE_MAPS_API_KEY = "AIzaSyB3Xj66Y-2nmAmpFilQ45qNWbNhH-CWhIA";

// Function to perform reverse geocoding using Google Maps API
const fetchLocationWithGoogleMaps = async (lat, lon) => {
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await axios.get(googleMapsUrl);

        if (response.data.status === "OK" && response.data.results.length > 0) {
            // Extract the formatted address from the response
            const location = response.data.results[0].formatted_address;
            console.log("Resolved Location (Google Maps):", location);
            return location;
        } else {
            console.log("No address data in Google Maps response.");
            return "Unknown Location";
        }
    } catch (error) {
        console.error("Error fetching location from Google Maps:", error.message);
        return "Unknown Location";
    }
};


const areDatesEqual = (unixTime1, unixTime2) => {
    // Convert UNIX timestamps (in seconds) to Date objects
    const date1 = new Date(unixTime1 * 1000);
    const date2 = new Date(unixTime2 * 1000);
  
    // Compare year, month, and date
    return (
      date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate()
    );
  };

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return distance;
}

const generateViolationId = () => {
  const min = 100000000; 
  const max = 999999999; 
  const randomNineDigits = Math.floor(Math.random() * (max - min + 1)) + min;
  
  return `1${randomNineDigits}`;
};


  const calculatePrice = (driverSpeed, maxSpeed) => {
    let price = 0;
    if (maxSpeed <= 120) {
      if (driverSpeed <= maxSpeed + 10) 
        price = 0;
       else if (driverSpeed >maxSpeed + 10 && driverSpeed <=maxSpeed + 20) 
        price = 150;
       else if (driverSpeed >maxSpeed + 20 && driverSpeed <=maxSpeed + 30) 
        price = 300;
       else if (driverSpeed >maxSpeed + 30 && driverSpeed <=maxSpeed + 40) 
        price = 800;
       else if (driverSpeed >maxSpeed + 40 && driverSpeed <=maxSpeed + 50) 
        price = 1200;
       else 
        price = 1500; 
      
    } else {
      if (driverSpeed <= maxSpeed + 5) 
        price = 0;
       else if (driverSpeed >maxSpeed + 5 && driverSpeed <=maxSpeed + 10) 
        price = 300;
       else if (driverSpeed >maxSpeed + 10 && driverSpeed <=maxSpeed + 20) 
        price = 800;
       else if (driverSpeed >maxSpeed + 20 && driverSpeed <=maxSpeed + 30) 
        price = 1200;
       else 
        price = 1500;
      
    }
    return price;
  };

  const storeViolation = async (ViolationID, driverid, GPSnumber, location, position, speed, maxSpeed, time, price, count50, count30) => {
    try {
        await db.collection('Violation').add({
            violationID: ViolationID,
            driverID: driverid,
            GPSnumber: GPSnumber,
            location: location,
            position: position,
            driverSpeed: speed,
            streetMaxSpeed: maxSpeed,
            price: price,
            time: time,
            timestamp: admin.firestore.Timestamp.now(),
            count50: count50,
            count30: count30,
            isAuto: true,
        });
        console.log('Violation stored successfully.');
    } catch (e) {
        console.error('Error storing violation:', e);
        console.log('Failed to store violation.');
    }
};

const storeHistory = async (id, driverid, GPSserialnumber, Brand, LicensePlate, Model, MotorcycleID, Type) => {
    try {
        await db.collection('History').add({
            ID: id, // crash or violation ID
            Driverid: driverid,
            GPSnumber: GPSserialnumber,
            Brand: Brand,
            LicensePlate: LicensePlate,
            Model: Model,
            MotorcycleID: MotorcycleID,
            Type: Type,
        });
        console.log('History stored successfully.');
    } catch (e) {
        console.error('Error storing history:', e);
        console.log('Failed to store history.');
    }
};

//crash function

const processUnits2 = async (units,sessionId) => {
    for (const unit of units) {

        const id = unit.id; // Wialon unit ID
        console.log("Unit ID:", id);

        const pos = unit.pos; // Position object from Wialon
        console.log("Position:", pos);

        if (pos) {
            const GPSserialnumber = unit.nm; // Unit name in Wialon
            console.log("GPS Serial Number:", GPSserialnumber);
            const driverSpeed = pos.s; // Speed from position
            console.log("Driver Speed:", driverSpeed);

            // Query for the driver in Firestore
            const driverQuerySnapshot = await db.collection("Driver")
                .where("GPSnumber", "==", GPSserialnumber)
                .get();

            if (driverQuerySnapshot.empty) {
                console.log(`No driver found for GPS number: ${GPSserialnumber}. Skipping.`);
            } else {
                const driverid = driverQuerySnapshot.docs[0].data().DriverID;
                console.log("Driver ID:", driverid);

                // Query for motorcycle details
                const motorcycleQuerySnapshot = await db.collection("Motorcycle")
                    .where("GPSnumber", "==", GPSserialnumber)
                    .get();

                if (!motorcycleQuerySnapshot.empty) {
                    const motorcycleData = motorcycleQuerySnapshot.docs[0].data();
                       const Brand = motorcycleData.Brand;
                       const LicensePlate = motorcycleData.LicensePlate;
                       const Model = motorcycleData.Model;
                       const MotorcycleID = motorcycleData.MotorcycleID;
                       const Type = motorcycleData.Type;
                    const CrashID = generateCrashId();
                    const newCrashTime = unit.lmsg.rt; // Last message time from Wialon
                    console.log("Crash time:", newCrashTime);

                    const position = { longitude: pos.x, latitude: pos.y };
                    console.log("Position:", position);

                    const recentSpeeds = {};
                    const to = newCrashTime; // Current time
                    const from = to - 100; // Check the last 10 seconds for relevant messages
                    console.log("Fetching messages from:", from, "to:", to);

                        const messages = await fetchMessages(sessionId, id, from, to);

                        if (! messages.length > 0) {
                            console.log("Insufficient data for acceleration check.");
                        } else {
                            
                            console.log("Messages:", messages);

                            // Filter and map recent speeds
                            recentSpeeds[GPSserialnumber] = messages
                                .filter((message) => message.pos !== null)
                                .map((message) => ({
                                    speed: message.pos.s,
                                    time: message.t,
                                }));
                            console.log("Recent speeds:", recentSpeeds);

                            if (recentSpeeds[GPSserialnumber].length < 2) {
                                console.log("Not enough data for speed analysis.");
                            } else {
                                // Calculate deceleration and check for crash
                                for (let i = 1; i < recentSpeeds[GPSserialnumber].length; i++) {
                                    const prevRead = recentSpeeds[GPSserialnumber][i - 1];
                                    const currRead = recentSpeeds[GPSserialnumber][i];
                                    const deltaVelocity = currRead.speed - prevRead.speed;
                                    const deltaTime = currRead.time - prevRead.time;
                                    const deceleration = deltaVelocity / deltaTime;
                                    console.log("Deceleration:", deceleration);

                                    if (deceleration <= -7) {  
                                        console.log("Potential crash detected for:", GPSserialnumber);
                                        // Check for recent crashes in Firestore
                                        const starttime = newCrashTime - 5 * 60; // 5 minutes earlier
                                        const endtime = newCrashTime;
                                        const crashQuerySnapshot = await db.collection("Crash")
                                            .where("GPSnumber", "==", GPSserialnumber)
                                            .where("driverID", "==", driverid)
                                            .where("time", ">=", starttime)
                                            .where("time", "<=", endtime)
                                            .get();
                                        if (!crashQuerySnapshot.empty) {
                                            console.log("Crash already recorded in the last 5 minutes.");
                                        } else {
                                            const location = await fetchLocationWithGoogleMaps( pos.y, pos.x);
                                            console.log(location);
                                            // Store crash and history
                                            await storeCrash(CrashID, driverid, GPSserialnumber, location, position, driverSpeed, newCrashTime);
                                            await storeHistory(CrashID, driverid, GPSserialnumber, Brand, LicensePlate, Model, MotorcycleID, Type);
                                        }
                                        break; // Exit loop once crash is detected
                                    }
                                }
                            }
                        }
                   
                }
            }
        }
    }
};


const fetchMessages = async (sessionId, unitId, from, to) => {
    const url = `${WIALON_BASE_URL}/wialon/ajax.html?sid=${sessionId}&svc=messages/load_interval&params={"itemId":${unitId},"timeFrom":${from},"timeTo":${to},"flags":0,"flagsMask":0,"loadCount":100}`;
    
    try {
        const response = await axios.post(url, null, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        // Check if messages exist in the response
        if (response.data && response.data.messages) {
            console.log("Messages retrieved successfully:", response.data.messages);
            return response.data.messages;
        } else {
            console.log("No messages found for the given interval.");
            return [];
        }
    } catch (error) {
        console.error("Error fetching messages from Wialon API:", error.message);
        return [];
    }
};


const storeCrash = async (CrashID, driverid, GPSnumber, location, position, speed, time) => {
    try {
        await db.collection('Crash').add({
            crashID: CrashID,
            driverID: driverid,
            GPSnumber: GPSnumber,
            location: location,
            position: position,
            driverSpeed: speed,
            time: time,
            timestamp: admin.firestore.Timestamp.now(),
            Status: "Pending",
            Flag: false,
            isRead: false,
        });
        console.log('Crash stored successfully.');
    } catch (e) {
        console.error('Error storing crash:', e);
        console.log('Failed to store crash.');
    }
};


const generateCrashId = () => {
    const min = 100000000; 
    const max = 999999999; 
    const randomNineDigits = Math.floor(Math.random() * (max - min + 1)) + min;
    
    return `2${randomNineDigits}`;
  };

// Function to monitor Wialon units
const monitorWialon = async () => {
  try {
    const sessionId = await loginToWialon();
    const units = await fetchUnits(sessionId);
    processUnits1(units,sessionId);
    processUnits2(units,sessionId);
  } catch (error) {
    console.error("Error monitoring Wialon:", error.message);
  }
};

const startMonitoring = () => {
  setInterval(async () => {
    console.log("Running Wialon monitoring...");
    await monitorWialon();
  }, 10000); 
};

// Start monitoring and Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startMonitoring();
});
