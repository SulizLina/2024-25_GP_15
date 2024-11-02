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
    console.log('Fetching units...');
    const flags = window.wialon.item.Item.dataFlag.base | window.wialon.item.Unit.dataFlag.lastMessage;

    try {
      const code = await new Promise((resolve) => {
        sess.updateDataFlags([{ type: 'type', data: 'avl_unit', flags: flags, mode: 0 }], resolve);
      });

      if (code) {
        console.log(window.wialon.core.Errors.getErrorText(code));
        return;
      }

      const loadedUnits = sess.getItems('avl_unit');
      if (loadedUnits) {
        console.log('Loaded units:', loadedUnits);
        loadedUnits.forEach(element => {
            console.log(element.getName());
          });
        await processUnits(loadedUnits);
      } else {
        console.log('No units found.');
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const processUnits = async (units) => {
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
          const price = calculatePrice(driverSpeed, maxSpeed);
          console.log('price:',price);
          if(price!==0){
         const newViolationTime=unit.getLastMessage().rt;//time of this violation
         console.log('viotime:',newViolationTime);
         const querySnapshot = await getDocs(
          query(
              collection(db, 'Violation'),// I already done construct t table
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
             console.log(lastViolation.data().position.latitude);// make suuuuuuuuuuuuuuuuure
             const distance = haversineDistance(lastViolation.data().position.latitude, lastViolation.data().position.longitude, pos.y, pos.x);
             console.log("distance before condition:",distance);
             console.log('retrived in query to in 30km:',lastViolation.data().GPSnumber, ' have :', lastViolation.data().location,' pri:',lastViolation.data().time , 'position lat:',lastViolation.data().position.latitude, ' long:',lastViolation.data().position.longitude);
             if (distance>30){
               console.log("more than 30km",distance);
               await storeViolation(driverid,GPSserialnumber, location ,position, driverSpeed,maxSpeed, newViolationTime,price);
             }
             else{
              const tenMinutesInSeconds = 1 * 60;
              console.log('less than 30km');
              if (!areDatesEqual(lastViolation.data().time, newViolationTime)) {
                console.log('not same date');
               await storeViolation(driverid,GPSserialnumber, location ,position, driverSpeed,maxSpeed, newViolationTime,price);
              }
              else if(newViolationTime-lastViolation.data().time>tenMinutesInSeconds){
                console.log('exceed 10 min');
                await storeViolation(driverid,GPSserialnumber, location ,position, driverSpeed,maxSpeed, newViolationTime,price);
              }
              else{
                console.log('same date and did not exceed 10 min');//i will remove this else 
              }
     
            }

           }

           else{
             await storeViolation(driverid,GPSserialnumber, location ,position, driverSpeed,maxSpeed,newViolationTime,price);
            console.log('no violation for this GPS before.');
           }
          
           }

          } 

          
        }//end of loop check speed>max

        // else {
        //   console.log("No need to store violation for", unit.getName());
        // }
      
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
  const min = 1000000000; // Minimum 10-digit number
  const max = 9999999999; // Maximum 10-digit number

  return Math.floor(Math.random() * (max - min + 1)) + min;
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

  const storeViolation = async (driverid,GPSnumber, location,position, speed,maxSpeed, time,price) => {
    try {
      const ViolationID = generateViolationId(); // Generate a unique ID for the violation
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
      });
      console.log('Violation stored successfully.');
    } catch (e) {
      console.error('Error storing violation:', e);
      console.log('Failed to store violation.');
    }
   };


  // Set up the interval
  const intervalId = setInterval(fetchUnits, fetchInterval);

  // Start fetching units immediately
  fetchUnits();

  // Return the cleanup function for clearing the interval
  return () => clearInterval(intervalId);


};