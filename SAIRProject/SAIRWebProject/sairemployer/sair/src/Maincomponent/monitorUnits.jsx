import { db } from '../firebase';
import { collection, addDoc, Timestamp, getDocs, query, where, orderBy } from 'firebase/firestore';
import axios from 'axios';


export const monitorUnits = (sess, fetchInterval) => {

    const fetchMaxSpeed = async (lat, lon) => {
        const radius = 10; // 10 meters radius
        const overpassUrl = `http://overpass-api.de/api/interpreter?data=[out:json];(way["maxspeed"](around:${radius},${lat},${lon}););out body;`;
      
        try {
          const response = await axios.get(overpassUrl);
          const ways = response.data.elements;
      
       
          if (ways.length > 0) {
            // Get the first way found with a maxspeed tag
            const firstWay = ways[0];
            const maxspeed = firstWay.tags.maxspeed || 'No maxspeeddddddddd found';
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




      const fetchUnits = async () => {
        const flags = window.wialon.item.Item.dataFlag.base | window.wialon.item.Unit.dataFlag.lastMessage;
        try {
          const code = await new Promise((resolve) => {
            sess.updateDataFlags([{ type: 'type', data: 'avl_unit', flags: flags, mode: 0 }], resolve);
          });
    
          if (code) {
            return;
          }
          const loadedUnits = sess.getItems('avl_unit');
          if (loadedUnits) {
            //  await processUnits1(loadedUnits);
              //await processUnits2(loadedUnits);
    
          } else {
            console.log('No units found.');
          }
        } catch (error) {
          console.error('Error fetching units:', error);
        }
      };

  // violation function

  const processUnits1 = async (units) => {
    for (const unit of units) { //change foreach to for loop
        const pos = unit.getPosition();
        console.log(pos);
        // Fetch max speed based on current position
        if(pos){
          const GPSserialnumber = unit.getName();
          console.log('gpsnum:',GPSserialnumber);
          const maxSpeed = await fetchMaxSpeed(pos.y,pos.x); 
          console.log('Max speed from API in proccess method:', maxSpeed);

        
       if (maxSpeed!==0) {
        const driverSpeed = pos.s;
        console.log('driverspeed:',driverSpeed);
        if (driverSpeed > maxSpeed) {
         const driverQuerySnapshot = await getDocs(
            query(
                collection(db, 'Driver'), 
                where('GPSnumber', '==', GPSserialnumber)
            )
         );
         if (!driverQuerySnapshot.empty) {
          const driverid = driverQuerySnapshot.docs[0].data().DriverID;
          console.log('DriverID:', driverid);
          var price = calculatePrice(driverSpeed, maxSpeed);
          console.log('price:',price);
          if(price!==0){
            const querySnapshot3 = await getDocs(
              query(
                collection(db, 'Motorcycle'),
                where('GPSnumber', '==', GPSserialnumber)
              )
            );
            if (!querySnapshot3.empty) {
         const Brand = querySnapshot3.docs[0].data().Brand;
         const LicensePlate = querySnapshot3.docs[0].data().LicensePlate;
         const Model = querySnapshot3.docs[0].data().Model;
         const MotorcycleID = querySnapshot3.docs[0].data().MotorcycleID;
         const Type = querySnapshot3.docs[0].data().Type;
         const ViolationID = generateViolationId(); 
         const newViolationTime=unit.getLastMessage().rt;//time of this violation
         console.log('viotime:',newViolationTime);
         var count50=0; //count if there is reckless violation when maxspeed<=120
         var count30=0; //count if there is reckless violation when maxspeed>120
         if (maxSpeed <= 120){
          if(price==1500){
            count50=1;
            const starttime = newViolationTime - 365 * 24 * 60 * 60;// one year
            const endtime = newViolationTime;
            const querySnapshot1 = await getDocs(
              query(
                collection(db, 'Violation'),
                where('GPSnumber', '==', GPSserialnumber),
                where('driverID', '==', driverid),
                where('time', '>=', starttime),
                where('time', '<=', endtime)
              )
            );
            if (!querySnapshot1.empty){
              querySnapshot1.forEach((doc) => {
              const violationData = doc.data();
              count50 += violationData.count50;
            });
            }
            if(count50>1){
              price=2000;//max limit price for violation
             }
          }
         }
         else{
          if(price==1500){
            count30=1;
            const starttime = newViolationTime - 365 * 24 * 60 * 60;// one year
            const endtime = newViolationTime;
            const querySnapshot2 = await getDocs(
              query(
                collection(db, 'Violation'),
                where('GPSnumber', '==', GPSserialnumber),
                where('driverID', '==', driverid),
                where('time', '>=', starttime),
                where('time', '<=', endtime)
              )
            );
            if (!querySnapshot2.empty){
              querySnapshot2.forEach((doc) => {
              const violationData = doc.data();
              count30 += violationData.count30;
            });
            }
            if(count30>1){
              price=2000;//max limit price for violation
             }
          }
         }

         const querySnapshot = await getDocs(
          query(
              collection(db, 'Violation'),// I already done construct violation table
              where('GPSnumber', '==', GPSserialnumber),
              where('driverID', '==', driverid),
              orderBy('time', 'desc'), // Order by time in descending order 
          )
         );          
            const position = { longitude: pos.x, latitude: pos.y };
            console.log(position);
            // Fetch location using GIS asynchronously
            const location = await new Promise((resolve) => {
              window.wialon.util.Gis.getLocations([{ lon: pos.x, lat: pos.y }], (code, address) => {
                  resolve(address[0]); // Resolve the promise with the first address
              });
           });
           console.log(location);
           if (!querySnapshot.empty){//condition distance<30 if yes new condition about if same data no give مخالفه if yes new condition يكون about time 30-45 
            console.log('helo');
             const lastViolation = querySnapshot.docs[0];    
             console.log(lastViolation.data().position.latitude);
             const distance = haversineDistance(lastViolation.data().position.latitude, lastViolation.data().position.longitude, pos.y, pos.x);
             console.log("distance before condition:",distance);
             console.log('retrived in query to in 30km:',lastViolation.data().GPSnumber, ' have :', lastViolation.data().location,' pri:',lastViolation.data().time , 'position lat:',lastViolation.data().position.latitude, ' long:',lastViolation.data().position.longitude);
             if (distance>30){
               console.log("more than 30km",distance);
               await storeViolation(ViolationID,driverid,GPSserialnumber, location ,position, driverSpeed,maxSpeed, newViolationTime,price,count50,count30);
               await storeHistory(ViolationID,driverid,GPSserialnumber, Brand ,LicensePlate, Model,MotorcycleID, Type);
             }
             else{
              const tenMinutesInSeconds = 10 * 60; //10*60
              console.log('less than 30km');
              if (!areDatesEqual(lastViolation.data().time, newViolationTime)) {
                console.log('not same date');
               await storeViolation(ViolationID,driverid,GPSserialnumber, location ,position, driverSpeed,maxSpeed, newViolationTime,price,count50,count30);
               await storeHistory(ViolationID,driverid,GPSserialnumber, Brand ,LicensePlate, Model,MotorcycleID, Type);

              }
              else if(newViolationTime-lastViolation.data().time>tenMinutesInSeconds){
                console.log('exceed 10 min');
                await storeViolation(ViolationID,driverid,GPSserialnumber, location ,position, driverSpeed,maxSpeed, newViolationTime,price,count50,count30);
                await storeHistory(ViolationID,driverid,GPSserialnumber, Brand ,LicensePlate, Model,MotorcycleID, Type);
              }
              else{
                console.log('same date and did not exceed 10 min');//i will remove this else 
              } }
           }
           else{
             await storeViolation(ViolationID,driverid,GPSserialnumber, location ,position, driverSpeed,maxSpeed,newViolationTime,price,count50,count30);
             await storeHistory(ViolationID,driverid,GPSserialnumber, Brand ,LicensePlate, Model,MotorcycleID, Type);
            console.log('no violation for this GPS before.');
           } }} } 
         }//end of loop check speed>max     
      }}
      };
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
        price = 1;//=0 
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

  const storeViolation = async (ViolationID,driverid,GPSnumber, location,position, speed,maxSpeed, time,price,count50,count30) => {
    try {
      await addDoc(collection(db, 'Violation'), {
        violationID:ViolationID,
        driverID:driverid,
        GPSnumber: GPSnumber,
        location:location,
        position: position,
        driverSpeed: speed,
        streetMaxSpeed:maxSpeed,
        price:price,
        time: time,
        timestamp: Timestamp.now(),
        count50:count50,
        count30:count30,
      });
      console.log('Violation stored successfully.');
    } catch (e) {
      console.error('Error storing violation:', e);
      console.log('Failed to store violation.');
    }
   };

   const storeHistory = async (id,driverid,GPSserialnumber, Brand ,LicensePlate, Model,MotorcycleID, Type) => {
    try {
      await addDoc(collection(db, 'History'), {
        ID:id, //crash or violation id
        Driverid:driverid,
        GPSnumber: GPSserialnumber,
        Brand:Brand,
        LicensePlate: LicensePlate,
        Model: Model,
        MotorcycleID:MotorcycleID,
        Type:Type,
      });
      console.log('history stored successfully.');
    } catch (e) {
      console.error('Error storing history:', e);
      console.log('Failed to store history.');
    }
   };


   //crash function 

   const processUnits2 = async (units) => {
    for (const unit of units) { 
      console.log("crashh");
        const id=unit.getId();
        console.log("id:",id); 
        const pos = unit.getPosition();
        console.log(pos);
        if(pos){
         const GPSserialnumber = unit.getName();
         console.log('crash gpsnum:',GPSserialnumber);
         const driverSpeed = pos.s;
         console.log('driverspeed:',driverSpeed);
         const driverQuerySnapshot1 = await getDocs(
            query(
                collection(db, 'Driver'), 
                where('GPSnumber', '==', GPSserialnumber)//GPSserialnumber
            )
         );
         if (driverQuerySnapshot1.empty) {
          console.log(`No driver found for GPS number: ${GPSserialnumber}. Skipping.`);
      }
         else{
          const driverid = driverQuerySnapshot1.docs[0].data().DriverID;
          console.log('DriverID:', driverid);
          const querySnapshot3 = await getDocs(
            query(
              collection(db, 'Motorcycle'),
              where('GPSnumber', '==', GPSserialnumber)
            )
          );
          if (!querySnapshot3.empty) {
       const Brand = querySnapshot3.docs[0].data().Brand;
       const LicensePlate = querySnapshot3.docs[0].data().LicensePlate;
       const Model = querySnapshot3.docs[0].data().Model;
       const MotorcycleID = querySnapshot3.docs[0].data().MotorcycleID;
       const Type = querySnapshot3.docs[0].data().Type;
       const CrashID = generateCrashId(); 
         const newcrashTime=unit.getLastMessage().rt;//time of this unit read
         console.log('current crashtime:',newcrashTime);
         
            const position = { longitude:pos.x , latitude: pos.y }; 
            console.log(position);
            // Fetch location using GIS asynchronously
            const location = await new Promise((resolve) => {
              window.wialon.util.Gis.getLocations([{ lon: pos.x, lat: pos.y }], (code, address) => {
                  resolve(address[0]); // Resolve the promise with the first address
              });
           });
           console.log(location);
           const recentSpeeds = {}; // Dictionary to store recent speeds for each unit
           const to = newcrashTime; // Current time
           const from = to - 100; // Check the last 10 seconds for relevant messages
           console.log("from: ",from," to: ",to); 
           var ml = sess.getMessagesLoader();
           ml.loadInterval(id, from, to, 0, 0, 100, async function (code, data) {
            if ( code || !data.messages) { 
                console.log(data.messages);
                console.log(data);
                console.log("Insufficient data for acceleration check");
            }
          else{
            const messages = data.messages;
            console.log("messages: ",messages);
            // update recentSpeeds for the unit
            recentSpeeds[GPSserialnumber] = messages.filter(message => message.pos !== null).map(message => ({
                speed: message.pos.s, 
                time: message.t
            }));
            console.log("recentarray: ",recentSpeeds);
            if (recentSpeeds[GPSserialnumber].length < 2)  {
              console.log("less that 2 reads after filter");
              }
            else{
            // Calculate deceleration over the retrieved messages
            for (let i = 1; i < recentSpeeds[GPSserialnumber].length; i++) { // In recentSpeds 1=25 first, 2=15 last ... 
                const prevread = recentSpeeds[GPSserialnumber][i - 1]; //25
                const currread = recentSpeeds[GPSserialnumber][i]; //15
                const deltaViolocity = currread.speed - prevread.speed;
                const deltaTime = currread.time - prevread.time;
                const deceleration = deltaViolocity / deltaTime;
                console.log(deceleration);
    
                // Check if deceleration indicates crash
                if (deceleration <= -7 ) {  // Emergency deceleration   
                    console.log("Potential crash detected for :", GPSserialnumber, "Acceleration:", deceleration);
                    const starttime = newcrashTime - 5 * 60; // crashes in 5 min before.  
                    const endtime = newcrashTime;
                    const querySnapshot = await getDocs(
                      query(
                        collection(db, 'Crash'),
                        where('GPSnumber', '==', GPSserialnumber),
                        where('driverID', '==', driverid),
                        where('time', '>=', starttime),
                        where('time', '<=', endtime)
                      )
                    );
                    if (!querySnapshot.empty){
                       console.log("there is crash is last 5 min.");
                    }
                    else{
                        await storeCrash(CrashID,driverid,GPSserialnumber, location ,position, driverSpeed, newcrashTime);
                        await storeHistory(CrashID,driverid,GPSserialnumber, Brand ,LicensePlate, Model,MotorcycleID, Type);

                    }
                    break; //exit when crash is detected.
                }
            }}}
        });

        }} 
      }
      };
};


const storeCrash = async (CrashID,driverid, GPSnumber, location, position, speed, time) => {
    try {
      await addDoc(collection(db, 'Crash'), {
        crashID:CrashID,
        driverID:driverid,
        GPSnumber: GPSnumber,
        location:location,
        position: position,
        driverSpeed: speed,
        time: time,
        timestamp: Timestamp.now(),
        Status:"Pending",
        Flag:false,
        isRead:false,
      });
      console.log('crash stored successfully.');
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


  // Set up the interval
  const intervalId = setInterval(fetchUnits, fetchInterval);

  // Start fetching units immediately
  fetchUnits();

  // Return the cleanup function for clearing the interval
  return () => clearInterval(intervalId);



};