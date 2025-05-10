require('dotenv').config();

const express = require("express");
const admin = require("firebase-admin");
const cors = require('cors');

const serviceAccount =JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

const db = admin.firestore();

const axios = require("axios");
const app = express();
app.use(cors()); // Enable CORS for all routes

// Create an Express server
const PORT = process.env.PORT || 3000;

let gpsState = {
    active: [],
    inactive: []
  };

// Wialon API credentials
const WIALON_TOKEN =process.env.WIALON_TOKEN
const WIALON_BASE_URL = "https://hst-api.wialon.com";

// Function to log in to Wialon and retrieve a session ID
const loginToWialon = async () => {
  const loginUrl =
`${WIALON_BASE_URL}/wialon/ajax.html?svc=token/login&params={"token":"${WIALON_TOKEN}"}`;
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
  const unitsUrl =
`${WIALON_BASE_URL}/wialon/ajax.html?sid=${sessionId}&svc=core/search_items&params={"spec":{"itemsType":"avl_unit","propName":"sys_name","propValueMask":"*","sortType":"sys_name"},"force":1,"flags":${flags},"from":0,"to":0}`;
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
    const radius = 20; // 10 meters radius
    const query = `[out:json];(way["maxspeed"](around:${radius},${lat},${lon}););out;`;

//     const overpassUrl =
// `http://overpass-api.de/api/interpreter?data=[out:json];(way["maxspeed"](around:${radius},${lat},${lon}););out;`;

const url = `http://overpass-api.de/api/interpreter?data=${query}`;


try {
    const response = await axios.get(url);
    console.log(response.data);

    // Handle successful response
    const ways = response.data.elements;

    if (ways.length > 0) {
      // Get the first way found with a maxspeed tag
      const firstWay = ways[0];
      const maxspeed = firstWay.tags.maxspeed || 'No maxspeed found';
      console.log('Max speed from API in fetchmax:', maxspeed);

      // Ensure to handle parsing, e.g., if maxspeed is in the form of "50 km/h"
      return parseMaxSpeed(maxspeed);
    } else {
      console.log('No maxspeed found');
      return 0; // Return 0 if no speed limit is found
    }

  } catch (error) {
    // Handle errors if something goes wrong
    console.error('Error fetching max speed:', error);
    return 0; // Return 0 on error
  }



    // try {
    // //   const response = await axios.get(url);
    //   const ways = response.data.elements;


    //   if (ways.length > 0) {
    //     // Get the first way found with a maxspeed tag
    //     const firstWay = ways[0];
    //     const maxspeed = firstWay.tags.maxspeed || 'No maxspeed found';
    //     console.log('Max speed from API in fetchmax:', maxspeed);

    //     return parseMaxSpeed(maxspeed); // Use parseMaxSpeed to convert to a number
    //   } else {
    //     console.log('no mexspeed');
    //     return 0; // Return 0 if no speed limit is found
    //   }
    // } catch (error) {
    //   console.error('Error fetching max speed:', error);
    //   return 0; // Return 0 on error
    // }
  };



  const parseMaxSpeed = (maxspeed) => {
    // If the maxspeed is a string with units (e.g., "50 km/h"), extract the numeric value
    const match = maxspeed.match(/(\d+)(?:\s*km\/h|\s*mph)?/);
    if (match) {
      return parseInt(match[1], 10); // Convert the number to an integer
    }
    return 0; // Return 0 if parsing fails
  };

  const processUnits1 = async (units,sessionId) => {
    for (const unit of units) {

        const pos = unit.pos; // Position object from Wialon unit.pos
        console.log(pos);

        if (pos && unit.lmsg) {
            const GPSserialnumber = unit.nm; // Get unit name as GPS serial number
            console.log('gpsnum:', GPSserialnumber);

            const maxSpeed = await fetchMaxSpeed( pos.y,pos.x );//await fetchMaxSpeed( pos.y,pos.x ); Fetch max speed
            console.log('Max speed from API in process method:', maxSpeed);

            if (maxSpeed !== 0 ) {
                console.log(maxSpeed);
                console.log('hhhere');
                const driverSpeed = pos.s; // Get the driver's speed  pos.s
                console.log('driverspeed:', driverSpeed);

                if (driverSpeed > maxSpeed) {
                    const driverQuerySnapshot = await db.collection('Driver')
                        .where('GPSnumber', '==', GPSserialnumber)
                        .get();

                    if (!driverQuerySnapshot.empty) {
                        const driverid =
driverQuerySnapshot.docs[0].data().DriverID;
                        console.log('DriverID:', driverid);

                        let price = calculatePrice(driverSpeed, maxSpeed);
                        console.log('price:', price);

                        if (price !== 0) {
                            const motorcycleSnapshot = await
db.collection('Motorcycle')
                                .where('GPSnumber', '==', GPSserialnumber)
                                .get();

                            if (!motorcycleSnapshot.empty) {
                                const motorcycleData =
motorcycleSnapshot.docs[0].data();
                                const Brand = motorcycleData.Brand;
                                const LicensePlate =
motorcycleData.LicensePlate;
                                const Model = motorcycleData.Model;
                                const MotorcycleID =
motorcycleData.MotorcycleID;
                                const Type = motorcycleData.Type;

                                const ViolationID = generateViolationId();
                                const newViolationTime = unit.lmsg.rt;
// Real-time timestamp of this violation
                                console.log('viotime:', newViolationTime);

                                let count50 = 0;
                                let count30 = 0;

                                if (maxSpeed <= 120) {
                                    if (price === 1500) {
                                        count50 = 1;
                                        const starttime =
newViolationTime - 365 * 24 * 60 * 60;
                                        const endtime = newViolationTime;

                                        const querySnapshot1 = await
db.collection('Violation')
                                            .where('GPSnumber', '==',
GPSserialnumber)
                                            .where('driverID', '==', driverid)
                                            .where('time', '>=', starttime)
                                            .where('time', '<=', endtime)
                                            .get();

                                        if (!querySnapshot1.empty) {
                                            querySnapshot1.forEach((doc) => {
                                                const violationData =
doc.data();
                                                count50 +=
violationData.count50 || 0;
                                            });
                                        }

                                        if (count50 > 1) {
                                            price = 2000; // Max fine
                                        }
                                    }
                                } else {
                                    if (price === 1500) {
                                        count30 = 1;
                                        const starttime =
newViolationTime - 365 * 24 * 60 * 60;
                                        const endtime = newViolationTime;

                                        const querySnapshot2 = await
db.collection('Violation')
                                            .where('GPSnumber', '==',
GPSserialnumber)
                                            .where('driverID', '==', driverid)
                                            .where('time', '>=', starttime)
                                            .where('time', '<=', endtime)
                                            .get();

                                        if (!querySnapshot2.empty) {
                                            querySnapshot2.forEach((doc) => {
                                                const violationData =
doc.data();
                                                count30 +=
violationData.count30 || 0;
                                            });
                                        }

                                        if (count30 > 1) {
                                            price = 2000; // Max fine
                                        }
                                    }
                                }

                                const querySnapshot = await
db.collection('Violation')
                                    .where('GPSnumber', '==', GPSserialnumber)
                                    .where('driverID', '==', driverid)
                                    .orderBy('time', 'desc')
                                    .get();

                                const position = { longitude: pos.x,
latitude: pos.y };


                                const location = await
fetchLocationWithGoogleMaps( pos.y, pos.x);
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
                                        await
storeViolation(ViolationID, driverid, GPSserialnumber, location,
position, driverSpeed, maxSpeed, newViolationTime, price, count50,
count30);
                                        await
storeHistory(ViolationID, driverid, GPSserialnumber, Brand,
LicensePlate, Model, MotorcycleID, Type);
                                    } else {
                                        const tenMinutesInSeconds = 10 * 60;

                                        if
(!areDatesEqual(lastViolation.data().time, newViolationTime)) {
                                            console.log('New violation date');
                                            await
storeViolation(ViolationID, driverid, GPSserialnumber, location,
position, driverSpeed, maxSpeed, newViolationTime, price, count50,
count30);
                                            await
storeHistory(ViolationID, driverid, GPSserialnumber, Brand,
LicensePlate, Model, MotorcycleID, Type);
                                        } else if (newViolationTime -
lastViolation.data().time > tenMinutesInSeconds) {
                                            console.log('Violation exceeds 10 minutes');
                                            await
storeViolation(ViolationID, driverid, GPSserialnumber, location,
position, driverSpeed, maxSpeed, newViolationTime, price, count50,
count30);
                                            await
storeHistory(ViolationID, driverid, GPSserialnumber, Brand,
LicensePlate, Model, MotorcycleID, Type);
                                        } else {
                                            console.log('Violation ignored due to proximity.');
                                        }
                                    }
                                } else {
                                    await storeViolation(ViolationID,
driverid, GPSserialnumber, location, position, driverSpeed, maxSpeed,
newViolationTime, price, count50, count30);
                                    await storeHistory(ViolationID,
driverid, GPSserialnumber, Brand, LicensePlate, Model, MotorcycleID,
Type);
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


const GOOGLE_MAPS_API_KEY =process.env.GOOGLE_MAPS_API_KEY

// Function to perform reverse geocoding using Google Maps API
const fetchLocationWithGoogleMaps = async (lat, lon) => {
    const googleMapsUrl =
`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`;

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
        console.error("Error fetching location from Google Maps:",
error.message);
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

  const storeViolation = async (ViolationID, driverid, GPSnumber,
location, position, speed, maxSpeed, time, price, count50, count30) =>
{
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
            Status:'Active',
        });
        console.log('Violation stored successfully.');
    } catch (e) {
        console.error('Error storing violation:', e);
        console.log('Failed to store violation.');
    }
};

const storeHistory = async (id, driverid, GPSserialnumber, Brand,
LicensePlate, Model, MotorcycleID, Type) => {
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
             const driverSpeed = 20; //pos.s; Speed from position
            console.log("Driver Speed:", driverSpeed);

            // Query for the driver in Firestore
            const driverQuerySnapshot = await db.collection("Driver")
                .where("GPSnumber", "==", GPSserialnumber)
                .get();

            if (driverQuerySnapshot.empty) {
                console.log(`No driver found for GPS number:
${GPSserialnumber}. Skipping.`);
            } else {
                const driverid = driverQuerySnapshot.docs[0].data().DriverID;
                console.log("Driver ID:", driverid);

                // Query for motorcycle details
                const motorcycleQuerySnapshot = await
db.collection("Motorcycle")
                    .where("GPSnumber", "==", GPSserialnumber)
                    .get();

                if (!motorcycleQuerySnapshot.empty) {
                    const motorcycleData =
motorcycleQuerySnapshot.docs[0].data();
                       const Brand = motorcycleData.Brand;
                       const LicensePlate = motorcycleData.LicensePlate;
                       const Model = motorcycleData.Model;
                       const MotorcycleID = motorcycleData.MotorcycleID;
                       const Type = motorcycleData.Type;
                    const CrashID = generateCrashId();
                    const newCrashTime = unit.lmsg.rt ; // Last message time from Wialon unit.lmsg.rt 
                    console.log("Crash time:", newCrashTime);

                    const position = { longitude: pos.x, latitude: pos.y };
                    console.log("Position:", position);

                    const recentSpeeds = {};
                    const to = newCrashTime; // Current time
                    const from = to - 3000; // Check the last 10 seconds for relevant messages
                    console.log("Fetching messages from:", from, "to:", to);

                        const messages = await
fetchMessages(sessionId, id, from, to);

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
                                for (let i = 1; i <
recentSpeeds[GPSserialnumber].length; i++) {
                                    const prevRead =
recentSpeeds[GPSserialnumber][i - 1];
                                    const currRead =
recentSpeeds[GPSserialnumber][i];
                                    const deltaVelocity =
currRead.speed - prevRead.speed;
                                    const deltaTime = currRead.time -
prevRead.time;
                                    const deceleration = deltaVelocity
/ deltaTime;
console.log('ffffffffffffffffffffffffffffff');
                                    console.log("Deceleration:", deceleration);

                                    if (deceleration <= -7) { 
                                        console.log("Potential crash detected for:", GPSserialnumber);
                                        // Check for recent crashes in Firestore
                                        const starttime = newCrashTime - 5 * 60; // 5 minutes earlier
                                        const endtime = newCrashTime;
                                        const crashQuerySnapshot =
await db.collection("Crash")
                                            .where("GPSnumber", "==",
GPSserialnumber)
                                            .where("driverID", "==", driverid)
                                            .where("time", ">=", starttime)
                                            .where("time", "<=", endtime)
                                            .get();
                                        if (!crashQuerySnapshot.empty) {
                                            console.log("Crash already recorded in the last 5 minutes.");
                                        } else {
                                            const location = await
fetchLocationWithGoogleMaps( pos.y, pos.x);
                                            console.log(location);
                                            // Store crash and history
                                            await storeCrash(CrashID,
driverid, GPSserialnumber, location, position, driverSpeed,
newCrashTime);
                                            await
storeHistory(CrashID, driverid, GPSserialnumber, Brand, LicensePlate,
Model, MotorcycleID, Type);
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



const fetchActiveLocations= async (units,sessionId) => {

    // gpsState.active = [];
    // gpsState.inactive = [];
    let newActive = [...gpsState.active];
let newInactive = [...gpsState.inactive];
    
    // Helper functions
    const activeMap = new Map(gpsState.active.map(item => [item.gpsNumber, item]));
    const inactiveMap = new Map(gpsState.inactive.map(item => [item.gpsNumber, item]));
    

    for (const unit of units) {
        const nowTime = unit.lmsg.rt; 
        console.log('newwwwwwwwwwwwww',nowTime);
        const id = unit.id; // Wialon unit ID
        console.log("Unit ID:", id);

        const pos = unit.pos; // Position object from Wialon
       console.log('pooooooooooos',pos);
            const GPSserialnumber = unit.nm; // Unit name in Wialon
            console.log("GPS Serial Number:", GPSserialnumber);
            

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
                    
                    
                    const latitude = pos ? pos.y : null;
                    const longitude = pos ? pos.x : null;   

                    

                    const url = `${WIALON_BASE_URL}/wialon/ajax.html?sid=${sessionId}&svc=core/search_items&params=${encodeURIComponent(JSON.stringify({
                        spec: {
                          itemsType: "avl_unit",
                          propName: "sys_name",
                          propValueMask: GPSserialnumber,
                          sortType: "sys_name"
                        },
                        force: 1,
                        flags: 2097152,  
                        from: 0,
                        to: 0
                      }))}`;
                      
                      const res = await fetch(url);
                      const data = await res.json();
                      console.log('Unit data:', data.items);
                      const online=data.items[0].netconn ;
                      console.log(online); 
                      
                    const now = Math.floor(Date.now() / 1000); // Current Unix time in seconds
                    const to = nowTime; // Current Unix timestamp       nowTime 
                   const from = to - 3600; // Unix timestamp one hour ago
const fr= from+100;
                    // const to = newCrashTime; // Current time
                    // const from = to - 500; 

                    console.log("Fetching messages from:", from, "to:", to);

                        const messages = await fetchMessages2(sessionId, id, from, to);
                        console.log(messages);
                        // let poss = messages[0].pos;
                        const oldPos = messages?.[0]?.pos;
                        console.log(messages[0]);


// console.log(poss);
console.log('oldpos',oldPos)
const currentData = {
    lat: latitude,
    lng: longitude,
    gpsNumber: GPSserialnumber
  };
const shouldBeInactive = !messages.length>0 || oldPos === null || oldPos === 0 || (online === 0) || (oldPos.y === latitude && oldPos.x === longitude);
// First remove from both maps (if it exists)
activeMap.delete(GPSserialnumber);
inactiveMap.delete(GPSserialnumber);

// Then add to the correct map
if (shouldBeInactive) {
  inactiveMap.set(GPSserialnumber, currentData);
} else {
  activeMap.set(GPSserialnumber, currentData);
}


                        // if (oldPos === null || oldPos===0|| !messages.length>0) {
                        //     console.log('here');
                           
                            
                        //     if(online==0){  
                        //         gpsState.inactive.push({ 
                        //             lat: latitude,
                        //             lng: longitude,
                        //             gpsNumber: GPSserialnumber});  
                        //     }
                        //     else{
                        //         gpsState.active.push({
                        //             lat: latitude,
                        //             lng: longitude,
                        //             gpsNumber: GPSserialnumber});

                        //     }

                           

                        // } else {
                        //     if(online==0){  
                        //         gpsState.inactive.push({ 
                        //             lat: latitude,
                        //             lng: longitude,
                        //             gpsNumber: GPSserialnumber});  
                        //     }
                        //     else{
                        //     if(oldPos.y === latitude && oldPos.x=== longitude){
                        //         console.log('gggggggggggggggggggggggggg');
                        //         gpsState.inactive.push({ 
                        //             lat: latitude,
                        //             lng: longitude,
                        //             gpsNumber: GPSserialnumber});

                        //     }
                        //     else{
                        //         gpsState.active.push({
                        //             lat: latitude,
                        //             lng: longitude,
                        //             gpsNumber: GPSserialnumber});

                        //     }

                            

                            

    console.log('gpsState',gpsState);
   // Convert back to arrays, preserving insertion order
gpsState.active = Array.from(activeMap.values());
gpsState.inactive = Array.from(inactiveMap.values());
                }
            }
        
    }

}



  
  

const fetchMessages2 = async (sessionId, unitId, from, to) => {
    const url = `${WIALON_BASE_URL}/wialon/ajax.html?sid=${sessionId}&svc=messages/load_interval&params={"itemId":${unitId},"timeFrom":${from},"timeTo":${to},"flags":1,"flagsMask":1,"loadCount":100}`;
    
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


const fetchMessages = async (sessionId, unitId, from, to) => {
    const url =
`${WIALON_BASE_URL}/wialon/ajax.html?sid=${sessionId}&svc=messages/load_interval&params={"itemId":${unitId},"timeFrom":${from},"timeTo":${to},"flags":0,"flagsMask":0,"loadCount":100}`;

    try {
        const response = await axios.post(url, null, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        // Check if messages exist in the response
        if (response.data && response.data.messages) {
            console.log("Messages retrieved successfully:",
response.data.messages);
            return response.data.messages;
        } else {
            console.log("No messages found for the given interval.");
            return [];
        }
    } catch (error) {
        console.error("Error fetching messages from Wialon API:",
error.message);
        return [];
    }
};


const storeCrash = async (CrashID, driverid, GPSnumber, location,
position, speed, time) => {
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
            RespondedBy:null,
            isAuto:true,
            isAutoshown:true,
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

// potential violation function

const processUnits3 = async (units,sessionId) => {
    for (const unit of units) {
console.log('potentiaaaaaaaaaaaaaaaaaaaaaaal');
        const pos = unit.pos; // Position object from Wialon
        console.log(pos);

        if (pos && unit.lmsg) {
            const GPSserialnumber = unit.nm; // Get unit name as GPS serial number
            console.log('gpsnum:', GPSserialnumber);

             const maxSpeed =  await fetchMaxSpeed(pos.y, pos.x);; //  Fetch max speed   
            console.log('Max speed from API in process method:', maxSpeed);

            if (maxSpeed !== 0) {
                const driverSpeed = pos.s; // Get the driver's speed     
                console.log('driverspeed:', driverSpeed);

                if (driverSpeed+10 == maxSpeed) {
                    const driverQuerySnapshot = await db.collection('Driver')
                        .where('GPSnumber', '==', GPSserialnumber)
                        .get();

                    if (!driverQuerySnapshot.empty) {
                        const driverid =
driverQuerySnapshot.docs[0].data().DriverID;
                        console.log('DriverID:', driverid);

                        const motorcycleSnapshot = await
db.collection('Motorcycle')
                                .where('GPSnumber', '==', GPSserialnumber)
                                .get();

                         if (!motorcycleSnapshot.empty) {
                            const motorcycleData =
motorcycleSnapshot.docs[0].data();
                            const Brand = motorcycleData.Brand;
                            const LicensePlate = motorcycleData.LicensePlate;
                            const Model = motorcycleData.Model;
                            const MotorcycleID = motorcycleData.MotorcycleID;
                            const Type = motorcycleData.Type;

                            const PotentialViolationID =
generatePotentialViolationId();
                            const PotentialViolationTime =
unit.lmsg.rt; // Real-time timestamp of this violation
                            console.log('potentialviotime:',
PotentialViolationTime);


                            const position = { longitude: pos.x,
latitude: pos.y };


                            const location = await
fetchLocationWithGoogleMaps( pos.y, pos.x);
                            console.log(location);


                            const querySnapshot = await
db.collection('PotentialViolation')
                            .where('GPSnumber', '==', GPSserialnumber)
                            .where('driverID', '==', driverid)
                            .orderBy('time', 'desc')
                            .get();

                            if (!querySnapshot.empty) {
                                const lastViolation = querySnapshot.docs[0];

                                    const threeMinutesInSeconds = 3 * 60;

                                    if (PotentialViolationTime -lastViolation.data().time > threeMinutesInSeconds) {
                                       console.log('exceed 3 min.');
                                       

                                       await
storePotentialViolation(PotentialViolationID, driverid,
GPSserialnumber, location, position, driverSpeed, maxSpeed,
PotentialViolationTime);
                                       await
storeHistory(PotentialViolationID, driverid, GPSserialnumber, Brand,
LicensePlate, Model, MotorcycleID, Type);
                                     }

                            } else {
                                await
storePotentialViolation(PotentialViolationID, driverid,
GPSserialnumber, location, position, driverSpeed, maxSpeed,
PotentialViolationTime);
                                await
storeHistory(PotentialViolationID, driverid, GPSserialnumber, Brand,
LicensePlate, Model, MotorcycleID, Type);
                                console.log('potential violation for this GPS.');
                            }





                            }

                    }
                }
            }
        }
    }
};


const generatePotentialViolationId = () => {
    const min = 100000000;
    const max = 999999999;
    const randomNineDigits = Math.floor(Math.random() * (max - min + 1)) + min;

    return `4${randomNineDigits}`;
  };


  const storePotentialViolation = async (PotentialViolationID,
driverid, GPSnumber, location, position, speed, maxSpeed, time) => {
    try {
        await db.collection('PotentialViolation').add({
            PotentialViolationID: PotentialViolationID,
            driverID: driverid,
            GPSnumber: GPSnumber,
            location: location,
            position: position,
            driverSpeed: speed,
            streetMaxSpeed: maxSpeed,
            time: time,
            timestamp: admin.firestore.Timestamp.now(),
        });
        console.log('Potential Violation stored successfully.');
    } catch (e) {
        console.error('Error storing Potential violation:', e);
        console.log('Failed to store Potential violation.');
    }
};






// Function to monitor Wialon units
const monitorWialon = async () => {
  try {
    const sessionId = await loginToWialon();
    const units = await fetchUnits(sessionId);
    //    processUnits1(units,sessionId);
    //    processUnits2(units,sessionId);
    processUnits3(units,sessionId);
    await fetchActiveLocations(units, sessionId);

  } catch (error) {
    console.error("Error monitoring Wialon:", error.message);
  }
};

const startMonitoring = () => {
  setInterval(async () => {
    console.log("Running Wialon monitoring...");
    await monitorWialon();
  }, 3000);
};

app.get('/api/gps-state', (req, res) => {
    res.json(gpsState); // Send the gpsState object as a response
  });

// Start monitoring and Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startMonitoring();
});
