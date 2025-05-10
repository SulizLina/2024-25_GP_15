import { useEffect, useState, useRef } from 'react';
import { db } from './firebase';
import { collection, doc, getDoc, onSnapshot, getDocs,updateDoc, query, where } from 'firebase/firestore';
import { notification } from 'antd';

notification.config({
    placement: 'topRight',
    duration: 5, // Default duration for notifications
    closeIcon: <span style={{ 
        fontSize: '20px' ,
        color: '#ffffff', 
        
        
    }}>×</span>, // Custom close icon
  });  
  

export const CrashNotification = () => {
  const [companyDrivers, setCompanyDrivers] = useState({}); // Store drivers for all employers
  const [employerUID, setEmployerUID] = useState(sessionStorage.getItem('employerUID')); // Track employerUID dynamically
  const crashListeners = useRef({}); // Store listeners for each company
  const violationListeners = useRef({}); // Store listeners for each company
  const complaintListeners = useRef({}); // Store listeners for each company

 
// Cleanup all listeners
const cleanupAllListeners = () => {
  Object.values(crashListeners.current).forEach((unsubscribe) => unsubscribe());
  crashListeners.current = {};
};
const cleanupvioListeners = () => {
  Object.values(violationListeners.current).forEach((unsubscribe) => unsubscribe());
  violationListeners.current = {};
};
const cleanupcomplaintListeners = () => {
  Object.values(complaintListeners.current).forEach((unsubscribe) => unsubscribe());
  complaintListeners.current = {};
};

  // Track changes to `sessionStorage` for employerUID
  useEffect(() => {
    const handleStorageChange = () => {
      setEmployerUID(sessionStorage.getItem('employerUID'));
    };

    window.addEventListener('storage', handleStorageChange);

    // Also react to immediate changes
    const originalSetItem = sessionStorage.setItem;
    sessionStorage.setItem = function (key, value) {
      originalSetItem.apply(this, arguments);
      if (key === 'employerUID') {
        setEmployerUID(value); // Trigger state change immediately
      }
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      sessionStorage.setItem = originalSetItem; // Restore original setItem
    };
  }, []);

  // Fetch drivers for all companies
  useEffect(() => {
    const employerQuery = collection(db, 'Employer');
  
    const unsubscribeEmployers = onSnapshot(employerQuery, async (employerSnapshot) => {
      const updatedDrivers = {};

      for (const employerDoc of employerSnapshot.docs) {
        const companyName = employerDoc.data().CompanyName;
        const driverQuery = query(
          collection(db, 'Driver'),
          where('CompanyName', '==', companyName)
        );

        const unsubscribeDrivers = onSnapshot(driverQuery, async (driverSnapshot) => {
          const drivers = driverSnapshot.docs.map((doc) => ({
            id: doc.data().DriverID,
            name: `${doc.data().Fname} ${doc.data().Lname}`,
            PhoneNumber: doc.data().PhoneNumber,
          }));

          // Aggregate drivers under the current company
          updatedDrivers[companyName] = drivers.reduce((acc, driver) => {
            acc[driver.id] = { name: driver.name, PhoneNumber: driver.PhoneNumber };
            return acc;
          }, {});

          setCompanyDrivers((prev) => ({
            ...prev,
            [companyName]: updatedDrivers[companyName],
          }));

          console.log('Updated Drivers for Company:', updatedDrivers[companyName]);

            // Handle crash listeners based on employerUID
        if (employerUID) {
            console.log(employerUID);
            const currentEmployerCompanyName = await getCurrentCompanyName(employerUID);
            if (currentEmployerCompanyName === companyName) {
              console.log('inside employer found');
              setupCrashListeners(updatedDrivers[companyName], companyName, true); // Show notifications for current employer
              setupViolationListeners(updatedDrivers[companyName], companyName, true); 
              setupComplaintListeners(updatedDrivers[companyName], companyName, true); 
            } else {
              console.log('inside else under employer found');
              setupCrashListeners(updatedDrivers[companyName], companyName, false); // Silent processing for other employers
              setupViolationListeners(updatedDrivers[companyName], companyName, false); // Silent processing for other employers
              setupComplaintListeners(updatedDrivers[companyName], companyName, false); // Silent processing for other employers

            }
          } else {
            console.log('inside else');
            setupCrashListeners(updatedDrivers[companyName], companyName, false); // Silent processing globally
            setupViolationListeners(updatedDrivers[companyName], companyName, false); // Silent processing globally
            setupComplaintListeners(updatedDrivers[companyName], companyName, false); // Silent processing globally

          }
        });
        }
  
        // Update state with the drivers for all companies
      });
  
      return () => {
        cleanupAllListeners();
        cleanupvioListeners();
        cleanupcomplaintListeners();
        unsubscribeEmployers();
      };
    }, [employerUID]);
  

  const getCurrentCompanyName = async (employerUID) => {
    if (!employerUID) return null;
  
    try {
      // Reference to the Employer document
      const employerRef = doc(db, 'Employer', employerUID);
      const employerDoc = await getDoc(employerRef);
  
      // Check if the document exists and return the CompanyName
      if (employerDoc.exists()) {
        return employerDoc.data().CompanyName;
      } else {
        console.error('Employer document not found for UID:', employerUID);
        return null;
      }
    } catch (error) {
      console.error('Error fetching company name for UID:', employerUID, error);
      return null;
    }
  };
  
 

  // Setup crash listeners
  const setupCrashListeners = (drivers, companyName, showNotifications) => {
    console.log('data1: ',drivers);
    console.log('data1: ',companyName);
    console.log('data1: ',showNotifications);
    if (!drivers || Object.keys(drivers).length === 0) return;
    console.log('data: ',drivers);
    console.log('data: ',companyName);
    console.log('data: ',showNotifications);


    if (crashListeners.current[companyName]) {
      crashListeners.current[companyName](); // Cleanup existing listener
      delete crashListeners.current[companyName];
    }

    const driverIds = Object.keys(drivers);
    const chunkSize = 10;

    for (let i = 0; i < driverIds.length; i += chunkSize) {
      const chunk = driverIds.slice(i, i + chunkSize);
      const crashQuery = query(
        collection(db, 'Crash'),
        where('driverID', 'in', driverIds),
        where('Status', '==', 'Emergency SOS'),
        where('RespondedBy', '==', null),

      );
      console.log('hfhfhfhfh');

      const unsubscribeCrash = onSnapshot(crashQuery, (snapshot) => {
        snapshot.docs.forEach(async (crashDoc) => {
          const crash = { id: crashDoc.id, ...crashDoc.data() };
          const driver = drivers[crash.driverID] || { name: 'Unknown', phoneNumber: 'Unavailable' };
          const date=formatDate(crash.time);
          const time= new Date(crash.time * 1000).toLocaleTimeString();
          console.log('crash:',crash);


// Check if the crash has already been notified
const notifiedCrashesEmployer = JSON.parse(localStorage.getItem("notifiedCrashesEmployer")) || {};
if (notifiedCrashesEmployer[crash.id]) return; // Skip if already notified

console.log('local storage:',notifiedCrashesEmployer);
console.log('helo');
// Save the crash ID to localStorage
notifiedCrashesEmployer[crash.id] = true;
localStorage.setItem("notifiedCrashesEmployer", JSON.stringify(notifiedCrashesEmployer));








          // Show notification only if employer is logged in
          if (showNotifications && employerUID) {
            notification.open({
              message: <strong>Crash Alert</strong>,
              description: `Crash detected for driver ${driver.name} on ${date} at ${time} Phone: ${driver.PhoneNumber}. Please call the driver to confirm the crash and provide necessary support.`,
              placement: 'topRight',
              closeIcon: null, 
              duration: 20,
              className: 'custom-notification',
              style: { width: 450,
                backgroundColor: 'rgba(255, 77, 79, 0.6)', // Red with 80% opacity
                color: '#ffffff',
                borderRadius: '10px',
               },
            });
          }
          

          // Mark crash as handled globally
          // const crashDocRef = doc(db, 'Crash', crash.id);
          // await updateDoc(crashDocRef, { Flag: true });
        });
      });

      crashListeners.current[companyName] = unsubscribeCrash; // Track listener for cleanup
    }
  };

  


  // Setup violation listeners
  const setupViolationListeners = (drivers, companyName, showNotifications) => {
    console.log('data1: ',drivers);
    console.log('data1: ',companyName);
    console.log('data1: ',showNotifications);
    if (!drivers || Object.keys(drivers).length === 0) return;
    console.log('data: ',drivers);
    console.log('data: ',companyName);
    console.log('data: ',showNotifications);


    if (violationListeners.current[companyName]) {
      violationListeners.current[companyName](); // Cleanup existing listener
      delete violationListeners.current[companyName];
    }

    const driverIds = Object.keys(drivers);
    const chunkSize = 10;

    for (let i = 0; i < driverIds.length; i += chunkSize) {
      const chunk = driverIds.slice(i, i + chunkSize);
      const violationQuery = query(
        collection(db, "Violation"),
        where("driverID", "in", driverIds),
        where('Status','==','Active')
      );

      const unsubscribeViolation = onSnapshot(violationQuery, (snapshot) => {
        snapshot.docs.forEach(async (violationdoc) => {
          const violation = { id: violationdoc.id, ...violationdoc.data() };
          const driver = drivers[violation.driverID] || { name: 'Unknown', phoneNumber: 'Unavailable' };
          const date=formatDate(violation.time);
          const time= new Date(violation.time * 1000).toLocaleTimeString();
          console.log('violation:',violation);


// Check if the crash has already been notified
const notifiedViolationEmployer = JSON.parse(localStorage.getItem("notifiedViolationEmployer")) || {};
if (notifiedViolationEmployer[violation.id]) return; // Skip if already notified

console.log('local storage:',notifiedViolationEmployer);
console.log('helo');
// Save the crash ID to localStorage
notifiedViolationEmployer[violation.id] = true;
localStorage.setItem("notifiedViolationEmployer", JSON.stringify(notifiedViolationEmployer));

          // Show notification only if employer is logged in
          if (showNotifications && employerUID) {
            notification.open({
              message: <strong>Violation Alert</strong>,
              description: `Violation detected for driver ${driver.name} on ${date} at ${time} Phone: ${driver.PhoneNumber}.`,
              placement: "topRight",
              closeIcon: null,
              duration: 20,
              className: "custom-notification",
              style: {
                width: 450,
                backgroundColor: "rgba(75, 75, 75,0.25)",
                color: "#ffffff",
                borderRadius: "10px",
              },
            });
          }
          

          // Mark crash as handled globally
          // const crashDocRef = doc(db, 'Crash', crash.id);
          // await updateDoc(crashDocRef, { Flag: true });
        });
      });

      violationListeners.current[companyName] = unsubscribeViolation; // Track listener for cleanup
    }
  };

  
    // Setup complaint listeners
    const setupComplaintListeners = (drivers, companyName, showNotifications) => {
      console.log('data1: ',drivers);
      console.log('data1: ',companyName);
      console.log('data1: ',showNotifications);
      if (!drivers || Object.keys(drivers).length === 0) return;
      console.log('data: ',drivers);
      console.log('data: ',companyName);
      console.log('data: ',showNotifications);
  
  
      if (complaintListeners.current[companyName]) {
        complaintListeners.current[companyName](); // Cleanup existing listener
        delete complaintListeners.current[companyName];
      }
  
      const driverIds = Object.keys(drivers);
      const chunkSize = 10;
  
      for (let i = 0; i < driverIds.length; i += chunkSize) {
        const chunk = driverIds.slice(i, i + chunkSize);
        const complaintQuery = query(
         collection(db, 'Complaint'),
                 where('driverID', 'in', driverIds),
                 where('RespondedBy', '==', null),
        );
  
        const unsubscribeComplaint = onSnapshot(complaintQuery, (snapshot) => {
          snapshot.docs.forEach(async (complaintdoc) => {
            const complaint = { id: complaintdoc.id, ...complaintdoc.data() };
            const driver = drivers[complaint.driverID] || { name: 'Unknown', phoneNumber: 'Unavailable' };
            const dateTime = new Date(complaint.DateTime.seconds * 1000); // Convert seconds to milliseconds
            const date = dateTime.toLocaleDateString();
            const time = dateTime.toLocaleTimeString();
            console.log('complaint:',complaint);
  
  
  // Check if the crash has already been notified
  const notifiedComplaintEmployer = JSON.parse(localStorage.getItem("notifiedComplaintEmployer")) || {};
  if (notifiedComplaintEmployer[complaint.id]) return; // Skip if already notified
  
  console.log('local storage:',notifiedComplaintEmployer);
  console.log('helo');
  // Save the crash ID to localStorage
  notifiedComplaintEmployer[complaint.id] = true;
  localStorage.setItem("notifiedComplaintEmployer", JSON.stringify(notifiedComplaintEmployer));
  
            // Show notification only if employer is logged in
            if (showNotifications && employerUID) {
              notification.open({
                message: <strong>Complaint Alert</strong>,
                description: `Complaint raised by driver ${driver.name} on ${date} at ${time} Phone: ${driver.PhoneNumber}.`,
                placement: "topRight",
                closeIcon: null,
                duration: 20,
                className: "custom-notification",
                style: {
                  width: 450,
                  backgroundColor: "rgba(75, 75, 75,0.25)",
                  color: "#ffffff",
                  borderRadius: "10px",
                },
              });
            }
            
  
            // Mark crash as handled globally
            // const crashDocRef = doc(db, 'Crash', crash.id);
            // await updateDoc(crashDocRef, { Flag: true });
          });
        });
  
        complaintListeners.current[companyName] = unsubscribeComplaint; // Track listener for cleanup
      }
    };
  


  const formatDate = (time) => {
    const date = new Date(time * 1000);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
  };

   // Clear notification when clicking outside
   useEffect(() => {
    const handleClickOutside = (event) => {
      const notificationElement = document.querySelector('.custom-notification');
      if (notificationElement && !notificationElement.contains(event.target)) {
        notification.destroy();
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
// Clear notification when clicking outside


return null;
};
