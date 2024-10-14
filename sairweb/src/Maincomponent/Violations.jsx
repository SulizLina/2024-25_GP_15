import React, { useEffect, useState } from 'react';
import { db } from "../firebase"; // firebase configuration
import { collection, onSnapshot } from 'firebase/firestore';

const DriverList = () => {
const [drivers, setDrivers] = useState([]); // State to hold driver data in real time

// Fetch data from Firestores

useEffect(() => {
const driverCollection = collection(db, 'Driver'); // 1
const unsubscribe = onSnapshot(driverCollection, (snapshot) => { // 2
const driverData = snapshot.docs.map((doc) => ({
id: doc.id,
...doc.data() // Use doc.data() to extract all fields from Firestore document
}));



  setDrivers(driverData); // 3
});

return () => {
  unsubscribe(); // Cleanup subscription
};
}, []);

return (
    //here html UI
<div>
<h1>Drivers List</h1>
<ul>
{drivers.map((driver) => (
<li key={driver.id}>
{driver.id} - {driver.Fname} - {driver.PhoneNumber}
</li>
))}
</ul>
</div>
);
};

export default DriverList;
