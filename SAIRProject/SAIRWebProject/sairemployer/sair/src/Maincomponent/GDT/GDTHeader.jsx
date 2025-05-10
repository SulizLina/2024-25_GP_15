import { DownOutlined, UserOutlined, BellOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Modal, Button, Badge } from "antd";
import { Link, useNavigate } from "react-router-dom";
import SAIRLogo from "../../images/SAIRlogo.png";
import { auth, db } from "../../firebase";
import { useEffect, useState,useCallback , useRef} from 'react';
import { doc, getDoc } from "firebase/firestore";
import s from "../../css/Header.module.css";
import "../../css/CustomModal.css";
import styles from "../../css/BadgeStyles.module.css";
import { FirstNameContext } from "../../FirstNameContext";
import { useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { collection, onSnapshot, query, where,orderBy,updateDoc } from 'firebase/firestore';

const GDTHeader = ({ active }) => {
  const GDTUID = sessionStorage.getItem("gdtUID"); 
  const { firstName, setFirstName } = useContext(FirstNameContext);
  const navigate = useNavigate();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  // const [isAdmin, setIsAdmin] = useState(false); // New state for isAdmin
  const isAdmin = sessionStorage.getItem("isAdmin") === "true"; // Retrieve isAdmin once

  const [drivers, setDrivers] = useState({});

  const [notReadCrashes, setNotReadCrashes] = useState([]);
  const [readCrashesgdt, setReadCrashesgdt] = useState(
    JSON.parse(localStorage.getItem(`readCrashesgdt_${GDTUID}`)) || {}
  );
  const [isShown, setIsShown] = useState(false);
  const [activeTab, setActiveTab] = useState('Crashes'); // Default tab is 
  const [notReadCrashes22gdt, setnotReadCrashes22gdt] = useState(
    JSON.parse(localStorage.getItem(`notReadCrashes22gdt_${GDTUID}`)) || {}
  );
  
  const [notReadViolations, setnotReadViolations] = useState([]);
  const [readViolationsgdt, setReadViolationsgdt] = useState(
    JSON.parse(localStorage.getItem(`readViolationsgdt_${GDTUID}`)) || {}
  );
  const [notReadViolations22gdt, setnotReadViolations22gdt] = useState(
    JSON.parse(localStorage.getItem(`notReadViolations22gdt_${GDTUID}`)) || {}
  );

  const [notReadComplaints, setnotReadComplaints] = useState([]);
  const [readComplaintsgdt, setReadComplaintsgdt] = useState(
    JSON.parse(localStorage.getItem(`readComplaintsgdt_${GDTUID}`)) || {}
  );
  const [notReadComplaints22gdt, setnotReadComplaints22gdt] = useState(
    JSON.parse(localStorage.getItem(`notReadComplaints22gdt_${GDTUID}`)) || {}
  );
  // const [hasNewCrashesgdt, setHasNewCrashesgdt] = useState(Object.keys(notReadCrashes22gdt).length > 0|| Object.keys(notReadViolations22gdt).length > 0 || Object.keys(notReadComplaints22gdt).length > 0);
  // const [hasNewCrashesgdt, setHasNewCrashesgdt] = useState(() => {
  //   return JSON.parse(localStorage.getItem(`hasNewCrashesgdt_${GDTUID}`)) || false;
  // });
  const [hasNewCrashesgdt, setHasNewCrashesgdt] = useState(() => {
    // Move complex initialization logic into useState callback
    return (
      Object.keys(notReadCrashes).length > 0 ||
      Object.keys(notReadViolations).length > 0 ||
      Object.keys(notReadComplaints).length > 0
    );
  });




  useEffect(() => {
    const fetchFirstName = async () => {
      console.log(firstName);
      if (!firstName) {
        // Fetch only if not already set
        const gdtUID = sessionStorage.getItem("gdtUID");
        if (gdtUID) {
          try {
            const userDocRef = doc(db, "GDT", gdtUID);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setFirstName(data.Fname || "");
            }
          } catch (error) {
            console.error("Error fetching first name:", error);
          }
        }
      }
    };

    fetchFirstName();
  }, [firstName, setFirstName]); // Only rerun when `firstName` or `setFirstName` changes


  useEffect(() => {
    fetchDrivers();
  }, [notReadCrashes,notReadCrashes22gdt,notReadViolations,notReadViolations22gdt,notReadComplaints,notReadComplaints22gdt]);

  useEffect(() => {
    const hasNew = 
      Object.keys(notReadCrashes).length > 0 ||
      Object.keys(notReadViolations).length > 0 ||
      Object.keys(notReadComplaints).length > 0;

      const storedHasNew = JSON.parse(localStorage.getItem(`hasNewCrashesgdt_${GDTUID}`));

      if (storedHasNew !== hasNew) {
  
    localStorage.setItem(`hasNewCrashesgdt_${GDTUID}`, JSON.stringify(hasNew));
    setHasNewCrashesgdt(hasNew);
      }

  }, [notReadCrashes, notReadViolations, notReadComplaints]);

  // Effect to handle storage events
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === `hasNewCrashesgdt_${GDTUID}`) {
        setHasNewCrashesgdt(JSON.parse(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [GDTUID]);




const fetchDrivers = useCallback(async () => {
      // Fetch drivers
      const driverCollection = query(
        collection(db, 'Driver'),
      );

      const unsubscribeDrivers = onSnapshot(driverCollection, (snapshot) => {
        const driverIds = [];
        const driverMap = {};

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.DriverID) {
            driverIds.push(data.DriverID);
            driverMap[data.DriverID] = `${data.Fname} ${data.Lname}`;
          }
        });

        if (driverIds.length === 0) {
          console.error("No valid Driver IDs found.");
          return;
        }

        setDrivers(driverMap);
        fetchCrashes(driverIds);
        fetchViolations(driverIds);
        fetchComplaints(driverIds);

      });

      return () => unsubscribeDrivers();
    
  }, []);



 // Fetch crash data
  const fetchCrashes = useCallback((driverIds) => {
    const chunkSize = 10; // Customize as needed
    for (let i = 0; i < driverIds.length; i += chunkSize) {
      const chunk = driverIds.slice(i, i + chunkSize);
      const now = Math.floor(Date.now() / 1000);
      const twentyFourHoursAgo = now - 24 * 60 * 60;
      const crashCollection = query(
        collection(db, 'Crash'),
        where('driverID', 'in', driverIds),
        where('Status', '==', 'Emergency SOS'),
        where('RespondedBy', '==', null),
        where("time", ">=", twentyFourHoursAgo), 
        orderBy('time', 'desc') // Order crashes by time in descending order
      );
      const unsubscribeCrashes = onSnapshot(crashCollection, (snapshot) => {
        
        const storedReadCrashes = JSON.parse(localStorage.getItem(`readCrashesgdt_${GDTUID}`)) || {}; // Get read crashes from localStorage

        const crashList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // setCrashes(crashList);
        // const newCrashIds = crashList.map((crash) => crash.id);
        // console.log("Fetched new crash IDs:", newCrashIds);
        // console.log('old',storedCrashIds);
       

        const newCrashes = crashList.filter(crash => !storedReadCrashes[crash.id]);

        const updatedReadCrashes = { ...notReadCrashes22gdt};

        newCrashes.forEach(crash => {
           updatedReadCrashes[crash.id]=crash ;
        })

        localStorage.setItem(`notReadCrashes22gdt_${GDTUID}`, JSON.stringify(updatedReadCrashes));

            //   const hasNew = 
            //   Object.keys(notReadCrashes).length > 0 ||
            //   Object.keys(notReadViolations).length > 0 ||
            //   Object.keys(notReadComplaints).length > 0;
        
            //   const storedHasNew = JSON.parse(localStorage.getItem(`hasNewCrashesgdt_${GDTUID}`));
        
            //   if (storedHasNew !== hasNew) {
          
            // localStorage.setItem(`hasNewCrashesgdt_${GDTUID}`, JSON.stringify(hasNew));
            // setHasNewCrashesgdt(hasNew);
            //   }

        setNotReadCrashes(newCrashes);
      });
      
      return () => unsubscribeCrashes();
    }
  });//not sure


 // Update crash as read and navigate to details page
 const handleNotificationClick = async (crash) => {
  try {
    console.log('id:',crash.id);
    const updatedReadCrashes = { ...readCrashesgdt, [crash.id]: crash };
    console.log('updated',updatedReadCrashes);
    localStorage.setItem(`readCrashesgdt_${GDTUID}`, JSON.stringify(updatedReadCrashes));
   const r= JSON.parse(localStorage.getItem(`readCrashesgdt_${GDTUID}`)) || {};
  console.log('r:',r);
    setReadCrashesgdt(updatedReadCrashes);
    // Move crash to read notifications
    setNotReadCrashes(prev => prev.filter(c => c.id !== crash.id));

   

    let notReadCrashes22 = JSON.parse(localStorage.getItem(`notReadCrashes22gdt_${GDTUID}`)) || {};
    delete notReadCrashes22[crash.id];
    localStorage.setItem(`notReadCrashes22gdt_${GDTUID}`, JSON.stringify(notReadCrashes22));

    // const hasNew = 
    //   Object.keys(notReadCrashes).length > 0 ||
    //   Object.keys(notReadViolations).length > 0 ||
    //   Object.keys(notReadComplaints).length > 0;

    //   const storedHasNew = JSON.parse(localStorage.getItem(`hasNewCrashesgdt_${GDTUID}`));

    //   if (storedHasNew !== hasNew) {
  
    // localStorage.setItem(`hasNewCrashesgdt_${GDTUID}`, JSON.stringify(hasNew));
    // setHasNewCrashesgdt(hasNew);
    //   }

    navigate(`/gdtcrash/general/${crash.id}`);
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};
//
 // Fetch violation data
  const fetchViolations = useCallback((driverIds) => {
    const chunkSize = 10; // Customize as needed
    for (let i = 0; i < driverIds.length; i += chunkSize) {
      const chunk = driverIds.slice(i, i + chunkSize);
      const violationCollection = query(
        collection(db, 'Violation'),
        where('driverID', 'in', driverIds),
        where('Status','==','Active'),
        orderBy('time', 'desc') 
      );
      const unsubscribeViolations = onSnapshot(violationCollection, (snapshot) => {
        
        const storedReadViolations = JSON.parse(localStorage.getItem(`readViolationsgdt_${GDTUID}`)) || {}; // Get read crashes from localStorage

        const violationList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const newViolation = violationList.filter(violation => !storedReadViolations[violation.id]);

        const updatedReadViolations = { ...notReadViolations22gdt};

        newViolation.forEach(violation => {
         updatedReadViolations[violation.id]=violation;
        })

        localStorage.setItem(`notReadViolations22gdt_${GDTUID}`, JSON.stringify(updatedReadViolations));///for the red circul

    //     const hasNew = 
    //   Object.keys(notReadCrashes).length > 0 ||
    //   Object.keys(notReadViolations).length > 0 ||
    //   Object.keys(notReadComplaints).length > 0;

    //   const storedHasNew = JSON.parse(localStorage.getItem(`hasNewCrashesgdt_${GDTUID}`));

    //   if (storedHasNew !== hasNew) {
  
    // localStorage.setItem(`hasNewCrashesgdt_${GDTUID}`, JSON.stringify(hasNew));
    // setHasNewCrashesgdt(hasNew);
    //   }
        setnotReadViolations(newViolation);
        console.log(notReadViolations);


      });
      
        ///ABOUT RED CIRCULE VISIBILITY
      return () => unsubscribeViolations();
    }
  });//not sure

  

  // Update crash as read and navigate to details page
  const handleviolationNotificationClick = async (violation) => {
    try {
      console.log('id:',violation.id);
      const updatedReadViolations = { ...readViolationsgdt, [violation.id]: violation };
      console.log('updated',updatedReadViolations);
      localStorage.setItem(`readViolationsgdt_${GDTUID}`, JSON.stringify(updatedReadViolations));
     const r= JSON.parse(localStorage.getItem(`readViolationsgdt_${GDTUID}`)) || {};
    console.log('r:',r);
    setReadViolationsgdt(updatedReadViolations);
      // Move crash to read notifications
      setnotReadViolations(prev => prev.filter(c => c.id !== violation.id));
    
  
      let notReadViolations22 = JSON.parse(localStorage.getItem(`notReadViolations22gdt_${GDTUID}`)) || {};
      delete notReadViolations22[violation.id];
      localStorage.setItem(`notReadViolations22gdt_${GDTUID}`, JSON.stringify(notReadViolations22));
      

    //   const hasNew = 
    //   Object.keys(notReadCrashes).length > 0 ||
    //   Object.keys(notReadViolations).length > 0 ||
    //   Object.keys(notReadComplaints).length > 0;

    //   const storedHasNew = JSON.parse(localStorage.getItem(`hasNewCrashesgdt_${GDTUID}`));

    //   if (storedHasNew !== hasNew) {
  
    // localStorage.setItem(`hasNewCrashesgdt_${GDTUID}`, JSON.stringify(hasNew));
    // setHasNewCrashesgdt(hasNew);
    //   }

      navigate(`/gdtviolation/general/${violation.id}`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

 // Fetch complaint data
  const fetchComplaints = useCallback((driverIds) => {
    const chunkSize = 10; // Customize as needed
    for (let i = 0; i < driverIds.length; i += chunkSize) {
      const chunk = driverIds.slice(i, i + chunkSize);
      const complaintCollection = query(
        collection(db, 'Complaint'),
        where('driverID', 'in', driverIds),
        where('RespondedBy', '==', null),
        orderBy('DateTime', 'desc') 
      );
      const unsubscribeComplaint = onSnapshot(complaintCollection, (snapshot) => {
        
        const storedReadComplaints = JSON.parse(localStorage.getItem(`readComplaintsgdt_${GDTUID}`)) || {}; // Get read crashes from localStorage
// console.log('storedReadComplaints',storedReadComplaints);
        const complaintList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const newComplaint = complaintList.filter(complaint => !storedReadComplaints[complaint.id]);

        const updatedReadComplaints = { ...notReadComplaints22gdt};

        newComplaint.forEach(complaint => {
           updatedReadComplaints[complaint.id]=complaint ;
        })

        localStorage.setItem(`notReadComplaints22gdt_${GDTUID}`, JSON.stringify(updatedReadComplaints));///for the red circul

    //     const hasNew = 
    //   Object.keys(notReadCrashes).length > 0 ||
    //   Object.keys(notReadViolations).length > 0 ||
    //   Object.keys(notReadComplaints).length > 0;

    //   const storedHasNew = JSON.parse(localStorage.getItem(`hasNewCrashesgdt_${GDTUID}`));

    //   if (storedHasNew !== hasNew) {
  
    // localStorage.setItem(`hasNewCrashesgdt_${GDTUID}`, JSON.stringify(hasNew));
    // setHasNewCrashesgdt(hasNew);
    //   }

        setnotReadComplaints(newComplaint);
      });
      
        ///ABOUT RED CIRCULE VISIBILITY
      return () => unsubscribeComplaint();
    }
  });//not sure

  

  // Update crash as read and navigate to details page
  const handlecomplaintNotificationClick = async (complaint) => {
    try {
      console.log('id:',complaint.id);
      const updatedReadComplaint = { ...readComplaintsgdt, [complaint.id]: complaint };
      console.log('updated',updatedReadComplaint);
      localStorage.setItem(`readComplaintsgdt_${GDTUID}`, JSON.stringify(updatedReadComplaint));
     const r= JSON.parse(localStorage.getItem(`readComplaintsgdt_${GDTUID}`)) || {};
    console.log('r:',r);
    setReadComplaintsgdt(updatedReadComplaint);
      // Move crash to read notifications
      setnotReadComplaints(prev => prev.filter(c => c.id !== complaint.id));
     
      let notReadComplaints22 = JSON.parse(localStorage.getItem(`notReadComplaints22gdt_${GDTUID}`)) || {};
      delete notReadComplaints22[complaint.id];
      localStorage.setItem(`notReadComplaints22gdt_${GDTUID}`, JSON.stringify(notReadComplaints22));

    //   const hasNew = 
    //   Object.keys(notReadCrashes).length > 0 ||
    //   Object.keys(notReadViolations).length > 0 ||
    //   Object.keys(notReadComplaints).length > 0;

    //   const storedHasNew = JSON.parse(localStorage.getItem(`hasNewCrashesgdt_${GDTUID}`));

    //   if (storedHasNew !== hasNew) {
  
    // localStorage.setItem(`hasNewCrashesgdt_${GDTUID}`, JSON.stringify(hasNew));
    // setHasNewCrashesgdt(hasNew);
    //   }


      navigate(`/gdtcomplaints/general/${complaint.id}`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };



  const handleallreadcrash = async (notReadCrashes) => {
    // Retrieve 'notReadCrashes22' from localStorage once
    console.log('check',notReadCrashes);
    // Create a new object for updated read crashes
    let updatedReadCrashes = { ...readCrashesgdt};
    let notReadCrashes22 = JSON.parse(localStorage.getItem(`notReadCrashes22gdt_${GDTUID}`)) || {};

    notReadCrashes.forEach(crash => {
      updatedReadCrashes[crash.id] = crash;

      delete notReadCrashes22[crash.id];
  
      // Update localStorage and state after the loop ends
      localStorage.setItem(`readCrashesgdt_${GDTUID}`, JSON.stringify(updatedReadCrashes));
      });
  
      setReadCrashesgdt(updatedReadCrashes);
      setNotReadCrashes([]);
      localStorage.setItem(`notReadCrashes22gdt_${GDTUID}`, JSON.stringify({}));

  
  //   const hasNew = 
  //   Object.keys(notReadCrashes).length > 0 ||
  //   Object.keys(notReadViolations).length > 0 ||
  //   Object.keys(notReadComplaints).length > 0;

  //   const storedHasNew = JSON.parse(localStorage.getItem(`hasNewCrashesgdt_${GDTUID}`));

  //   if (storedHasNew !== hasNew) {

  // localStorage.setItem(`hasNewCrashesgdt_${GDTUID}`, JSON.stringify(hasNew));
  // setHasNewCrashesgdt(hasNew);
  //   }
  };


  const handleallreadviolation = async (notReadViolations) => {
    // Retrieve 'notReadCrashes22' from localStorage once
    console.log('check',notReadViolations);
    // Create a new object for updated read crashes
    let updatedReadViolation = { ...readViolationsgdt};
    let notReadViolations22 = JSON.parse(localStorage.getItem(`notReadViolations22gdt_${GDTUID}`)) || {};

    notReadViolations.forEach(violation => {
      updatedReadViolation[violation.id] = violation;

      delete notReadViolations22[violation.id];
  
      // Update localStorage and state after the loop ends
      localStorage.setItem(`readViolationsgdt_${GDTUID}`, JSON.stringify(updatedReadViolation));
  
    });

    setReadViolationsgdt(updatedReadViolation);
    setnotReadViolations([]);
    localStorage.setItem(`notReadViolations22gdt_${GDTUID}`, JSON.stringify({}));


    // const hasNew = 
    //   Object.keys(notReadCrashes).length > 0 ||
    //   Object.keys(notReadViolations).length > 0 ||
    //   Object.keys(notReadComplaints).length > 0;

    //   const storedHasNew = JSON.parse(localStorage.getItem(`hasNewCrashesgdt_${GDTUID}`));

    //   if (storedHasNew !== hasNew) {
  
    // localStorage.setItem(`hasNewCrashesgdt_${GDTUID}`, JSON.stringify(hasNew));
    // setHasNewCrashesgdt(hasNew);
    //   }

  };
  

  const handleallreadcomplaint = async (notReadComplaints) => {
    // Retrieve 'notReadCrashes22' from localStorage once
    console.log('check',notReadComplaints);
    // Create a new object for updated read crashes
    let updatedReadComplaint = { ...readComplaintsgdt};
    let notReadComplaints22 = JSON.parse(localStorage.getItem(`notReadComplaints22gdt_${GDTUID}`)) || {};

    notReadComplaints.forEach(complaint => {
      updatedReadComplaint[complaint.id] = complaint;

      delete notReadComplaints22[complaint.id];
  
      // Update localStorage and state after the loop ends
      localStorage.setItem(`readComplaintsgdt_${GDTUID}`, JSON.stringify(updatedReadComplaint));
  
    });
  
    setReadComplaintsgdt(updatedReadComplaint);
    setnotReadComplaints([]);
    localStorage.setItem(`notReadComplaints22gdt_${GDTUID}`, JSON.stringify({}));



    // const hasNew = 
    //   Object.keys(notReadCrashes).length > 0 ||
    //   Object.keys(notReadViolations).length > 0 ||
    //   Object.keys(notReadComplaints).length > 0;

    //   const storedHasNew = JSON.parse(localStorage.getItem(`hasNewCrashesgdt_${GDTUID}`));

    //   if (storedHasNew !== hasNew) {
  
    // localStorage.setItem(`hasNewCrashesgdt_${GDTUID}`, JSON.stringify(hasNew));
    // setHasNewCrashesgdt(hasNew);
    //   }

  };
  
  
  useEffect(() => {
    fetchDrivers();
  }, []);


  const formatDate = (time) => {
    const date = new Date(time * 1000);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
  };



  // Function to remove all staff-related session storage keys and navigate
  const handleNavigation = (path) => {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("staff_")) {
        sessionStorage.removeItem(key);
      }
    });

    navigate(path);
  };

  const showModal = () => {
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };




  const handleLogout = async () => {
    try {
      await auth.signOut(); // Sign out the user
      sessionStorage.removeItem("gdtUID");
      sessionStorage.removeItem("FirstName");
      sessionStorage.removeItem("isAdmin");

      // localStorage.removeItem(`readCrashesgdt_${GDTUID}`);
      // localStorage.removeItem(`notReadCrashes22gdt_${GDTUID}`);

      // localStorage.removeItem(`readViolationsgdt_${GDTUID}`);
      // localStorage.removeItem(`notReadViolations22gdt_${GDTUID}`);

      // localStorage.removeItem(`readComplaintsgdt_${GDTUID}`);
      // localStorage.removeItem(`notReadComplaints22gdt_${GDTUID}`);
      
      localStorage.removeItem(`hasNewCrashesgdt_${GDTUID}`);

      window.dispatchEvent(new Event("storage")); // Notify other components
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setModalVisible(false);
    }
  };



  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };
  
 const NumberOfAllNotifications =()=>{
  let num= notReadCrashes.length+ notReadViolations.length+ notReadComplaints.length;
  return num;
 }
 
 const NumberOfcrashesNotifications =()=>{
  let num = notReadCrashes.length;
  if(num>0)
  return num;
else
return null;
 } 
 const NumberOfviolationsNotifications =()=>{
  let num = notReadViolations.length;
  if(num>0)
  return num;
else
return null;
 } 
 const NumberOfcomplaintsNotifications =()=>{
  let num = notReadComplaints.length;
  if(num>0)
  return num;
else
return null;
 } 















 const notificationMenu = (
  <div
    style={{
      width: '380px', // Increase the width
      height: '430px', // Increase the height
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      overflowY: 'auto', // Enable scrolling for long lists
      scrollbarWidth: 'none', // Hide scrollbar (Firefox)
      msOverflowStyle: 'none', // Hide scrollbar (IE/Edge)
      display: 'flex',
    flexDirection: 'column',
    }}
  >
        <div style={{ position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 1, paddingBottom: '10px' }}>

  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
  <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' ,display: 'inline-flex',alignItems: 'center'}}>
  Notifications 
  <span style={{
        display: 'inline-flex',
        width: `${Math.max(23, NumberOfAllNotifications().toString().length * 6)}px`,  
        height: `${Math.max(23, NumberOfAllNotifications().toString().length * 6)}px`,  
        backgroundColor: 'red',
        borderRadius: '50%',
        display: 'flex',
        marginLeft:'3px',
        paddingRight:'2px',
        paddingLeft:'2px',
        paddingBottom:'2px',
        paddingTop:'2px',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: `${Math.max(14 - (NumberOfAllNotifications().toString().length - 2) * 2, 10)}px`,  
        // verticalAlign: 'middle',
      }}>
        {NumberOfAllNotifications()}
      </span>
        </h3>
        
{/* Show All Notifications Icon */}
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>


{/* Mark All as Read Icon */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    position: "relative",
  }}
  onClick={() => {
    if (activeTab === 'Crashes') {
      handleallreadcrash(notReadCrashes);
    } else if (activeTab === 'Violations') {
      handleallreadviolation(notReadViolations);
    }else if (activeTab === 'Complaints') {
      handleallreadcomplaint(notReadComplaints);
    }
  }}
  onMouseEnter={() => setIsShown(true)}
  onMouseLeave={() => setIsShown(false)}
>
  <IoCheckmarkDoneSharp size={25} color="black" />
  {isShown && (
    <div
      style={{
        position: "absolute",
        bottom: "-30px",
        left: "-25px",
        transform: "translateX(-50%)",
        backgroundColor: "white",
        color: "black",
        border: "1px solid black",
        padding: "5px 10px",
        borderRadius: "5px",
        fontSize: "12px",
        whiteSpace: "nowrap",
        boxShadow: "0px 2px 4px rgba(0,0,0,0.3)",
        opacity: 1,
        transition: "opacity 0.2s ease-in-out",
        zIndex: 2,
      }}
    >
      Mark all as read       
    </div>
  )}
</div></div>
</div>

    <hr
    style={{
      border: '0',
      borderTop: '1px solid #ddd',
      marginTop: '0', // Controls the spacing between the title and the line
      marginBottom: '10px', 

    }}
  />



{/* <div style={{ marginBottom: '10px' }}> */}
<div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', }}>
        <div
          onClick={() => handleTabClick('Crashes')}
          style={{
            cursor: 'pointer',
            padding: '5px 30px',
            paddingLeft: '30px',  
            width:'119px',
            alignItems: 'center', 
            borderBottom: activeTab === 'Crashes' ? '2px solid black' : 'none',
            position: 'relative',
          }}
        >
         Crashes 
         {NumberOfcrashesNotifications() !== null && (
  <span
    style={{
      position: 'absolute',
      top: '-3px',  // Adjusts the position to be above the title
      right: '19px',  // Adjusts the position to the right
      width: `${Math.max(19, NumberOfcrashesNotifications().toString().length * 6)}px`,  
      height: `${Math.max(19, NumberOfcrashesNotifications().toString().length * 6)}px`,  
      backgroundColor: 'red',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      fontSize: `${Math.max(11 - (NumberOfcrashesNotifications().toString().length - 2) * 2, 10)}px`,  
      zIndex: 1,
    }}
  >
    {NumberOfcrashesNotifications()}
  </span>
)}

</div>
        <div
          onClick={() => handleTabClick('Violations')}
          style={{
            cursor: 'pointer',
            width:'119px',
            alignItems: 'center', 
            padding: '5px 23px',
            paddingLeft: '25px',  
            borderBottom: activeTab === 'Violations' ? '2px solid black' : 'none',
            position: 'relative',
          }}
        >
          Violations 
          {NumberOfviolationsNotifications() !== null && (
  <span
    style={{
      position: 'absolute',
      top: '-3px',  // Adjusts the position to be above the title
      left: '88px',  // Adjusts the position to the right
      width: `${Math.max(19, NumberOfviolationsNotifications().toString().length * 6)}px`,  
      height: `${Math.max(19, NumberOfviolationsNotifications().toString().length * 6)}px`,  
      backgroundColor: 'red',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      fontSize: `${Math.max(11 - (NumberOfviolationsNotifications().toString().length - 2) * 2, 10)}px`,  
      zIndex: 1,
    //  fontWeight: 'bold',
    }}
  >
    {NumberOfviolationsNotifications()}
  </span>
)}
        </div>
        <div
          onClick={() => handleTabClick('Complaints')}
          style={{
            cursor: 'pointer',
            width:'119px',
            alignItems: 'center', 
            padding: '5px 20px',
            paddingLeft: '20px',  
            borderBottom: activeTab === 'Complaints' ? '2px solid black' : 'none',
            position: 'relative',
          }}
        >
          Complaints 
          {NumberOfcomplaintsNotifications() !== null && (
  <span
    style={{
      position: 'absolute',
      top: '-3px',  // Adjusts the position to be above the title
      left: '92px',  // Adjusts the position to the right
      width: `${Math.max(19, NumberOfcomplaintsNotifications().toString().length * 6)}px`,  
      height: `${Math.max(19, NumberOfcomplaintsNotifications().toString().length * 6)}px`,  
      backgroundColor: 'red',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      fontSize: `${Math.max(11 - (NumberOfcomplaintsNotifications().toString().length - 2) * 2, 10)}px`,  
      zIndex: 1,
    }}
  >
    {NumberOfcomplaintsNotifications()}
  </span>
)}
        </div>
      </div>
    </div>
   </div>
  
    {activeTab === 'Crashes' ? (
notReadCrashes.length > 0 ? (
  <>
   <div
      style={{
        flex: 1, // Makes this section take up the remaining space
        overflowY: 'auto', // Scrollable vertically
        scrollbarWidth: 'thin', // For Firefox (optional)
      }}
    >
      <style jsx>{`
        /* Webkit browsers (Chrome, Safari) */
        ::-webkit-scrollbar {
          width: 6px; /* Thin scrollbar */
        }
    
        ::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2); /* Semi-transparent thumb */
          border-radius: 10px; /* Rounded corners */
          transition: background-color 0.3s ease;
        }
    
        ::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.5); /* Darker when hovered */
        }
    
        ::-webkit-scrollbar-track {
          background: transparent; /* Make track transparent */
        }
    
        /* Firefox */
        * {
          scrollbar-width: thin; /* Thin scrollbar */
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent; /* Thumb color and track transparent */
        }
      `}</style>

    {notReadCrashes.map((crash) => {
      const date = formatDate(crash.time);
      const time = new Date(crash.time * 1000).toLocaleTimeString();
      const driverName = drivers[crash.driverID] || 'Unknown Driver';
     
      return (
       
        <div
          key={crash.id}
          style={{
            borderBottom: '1px solid #ddd',
            padding: '10px',
            paddingLeft: '-17px',
            cursor: 'pointer',
            transition: 'background 0.3s ease',
          }}
          onClick={() => handleNotificationClick(crash)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center', // Aligns the line and text
              gap: '7px', // Space between line and text
            }}
          >
            {/* Vertical Red Line */}
            <div
              style={{
                width: '2px', // Thin width for a line
                height: '30px', // Adjust height for line length
                backgroundColor: 'red',
                borderRadius: '0', // No rounded corners
                flexShrink: 0,
              }}
            ></div>

            {/* Text Container */}
            <div>
              <strong>Driver: {driverName}</strong>
              <br />
              <span>Crash detected on {date} at {time}.</span>
            </div>
          </div>
        </div>
      );
    })}</div>
        <div style={{ position: 'sticky', bottom: 0, backgroundColor: '#ffffff', zIndex: 1, paddingTop: '1px',marginBottom:'5px', }}>

     <button 
      onClick={() => navigate('/gdtnotificationslist')}//we may change the path
      style={{
        marginTop:'20px',
        padding: '8px 8px',
        fontSize: '13px',
        cursor: 'pointer',
        border: 'none', 
        backgroundColor: '	#059855',
        color: 'white',
        borderRadius: '5px',
        transition: 'background-color 0.3s ease', 
        marginLeft: 'auto', // Align to the right
        display: 'block', 
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = '#1c7a50'}  // Change to darker green on hover
      onMouseLeave={(e) => e.target.style.backgroundColor = '#059855'}  // Revert back on mouse leave
    >
      View all notifications 
    </button></div>
  </>
  
) : (
  <div style={{ textAlign: 'center', marginTop: '80px', color: '#aaa' }}>
    <BellOutlined style={{ fontSize: '36px', marginBottom: '10px' }} />
    <p style={{ marginBottom: '141.50px' }}>No new crashes</p>
    
    <button 
      onClick={() => navigate('/gdtnotificationslist')}
      style={{
        marginTop:'20px',
        padding: '8px 8px',
        fontSize: '13px',
        cursor: 'pointer',
        border: 'none', 
        backgroundColor: '	#059855',
        color: 'white',
        borderRadius: '5px',
        transition: 'background-color 0.3s ease', 
        marginLeft: 'auto', // Align to the right
        display: 'block', 
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = '#1c7a50'}  // Change to darker green on hover
      onMouseLeave={(e) => e.target.style.backgroundColor = '#059855'}  // Revert back on mouse leave
    >
      View all notifications 
    </button></div>
)
) : activeTab === 'Violations' ? (
notReadViolations.length > 0 ? (
  <>
   <div
         style={{
          flex: 1, // Makes this section take up the remaining space
          overflowY: 'auto', // Scrollable vertically
          scrollbarWidth: 'thin', // For Firefox (optional)
        }}
      >
        <style jsx>{`
          /* Webkit browsers (Chrome, Safari) */
          ::-webkit-scrollbar {
            width: 6px; /* Thin scrollbar */
          }
      
          ::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.2); /* Semi-transparent thumb */
            border-radius: 10px; /* Rounded corners */
            transition: background-color 0.3s ease;
          }
      
          ::-webkit-scrollbar-thumb:hover {
            background-color: rgba(0, 0, 0, 0.5); /* Darker when hovered */
          }
      
          ::-webkit-scrollbar-track {
            background: transparent; /* Make track transparent */
          }
      
          /* Firefox */
          * {
            scrollbar-width: thin; /* Thin scrollbar */
            scrollbar-color: rgba(0, 0, 0, 0.2) transparent; /* Thumb color and track transparent */
          }
        `}</style>

    {notReadViolations.map((violation) => {
      const date = formatDate(violation.time);
      const time = new Date(violation.time * 1000).toLocaleTimeString();
      const driverName = drivers[violation.driverID] || 'Unknown Driver';

      return (
       
        <div
          key={violation.id}
          style={{
            borderBottom: '1px solid #ddd',
            padding: '10px',
            paddingLeft: '-17px',
            cursor: 'pointer',
            transition: 'background 0.3s ease',
          }}
          onClick={() => handleviolationNotificationClick(violation)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center', // Aligns the line and text
              gap: '7px', // Space between line and text
            }}
          >
            {/* Vertical Red Line */}
            <div
              style={{
                width: '2px', // Thin width for a line
                height: '30px', // Adjust height for line length
                backgroundColor: 'red',
                borderRadius: '0', // No rounded corners
                flexShrink: 0,
              }}
            ></div>

            {/* Text Container */}
            <div>
              <strong>Driver: {driverName}</strong>
              <br />
              <span>Violation detected on {date} at {time}.</span>
            </div>
          </div>
        </div>
      );
    })}</div>
        <div style={{ position: 'sticky', bottom: 0, backgroundColor: '#ffffff', zIndex: 1, paddingTop: '1px',marginBottom:'5px', }}>

        <button 
      onClick={() => navigate('/gdtnotificationslist')}
      style={{
        marginTop:'20px',
        padding: '8px 8px',
        fontSize: '13px',
        cursor: 'pointer',
        border: 'none', 
        backgroundColor: '	#059855',
        color: 'white',
        borderRadius: '5px',
        transition: 'background-color 0.3s ease', 
        marginLeft: 'auto', // Align to the right
        display: 'block', 
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = '#1c7a50'}  // Change to darker green on hover
      onMouseLeave={(e) => e.target.style.backgroundColor = '#059855'}  // Revert back on mouse leave
    >
      View all notifications 
    </button></div>
  </>
) : (
  <div style={{ textAlign: 'center', marginTop: '80px', color: '#aaa' }}>
    <BellOutlined style={{ fontSize: '36px', marginBottom: '10px' }} />
    <p style={{ marginBottom: '141.50px' }}>No new violations</p>
    <button 
      onClick={() => navigate('/gdtnotificationslist')}
      style={{
        marginTop:'20px',
        padding: '8px 8px',
        fontSize: '13px',
        cursor: 'pointer',
        border: 'none', 
        backgroundColor: '	#059855',
        color: 'white',
        borderRadius: '5px',
        transition: 'background-color 0.3s ease', 
        marginLeft: 'auto', // Align to the right
        display: 'block', 
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = '#1c7a50'}  // Change to darker green on hover
      onMouseLeave={(e) => e.target.style.backgroundColor = '#059855'}  // Revert back on mouse leave
    >
      View all notifications 
    </button></div>
  )
) : activeTab === 'Complaints' ? (
  notReadComplaints.length > 0 ? (
    <>
     <div
       style={{
        flex: 1, // Makes this section take up the remaining space
        overflowY: 'auto', // Scrollable vertically
        scrollbarWidth: 'thin', // For Firefox (optional)
      }}
    >
      <style jsx>{`
        /* Webkit browsers (Chrome, Safari) */
        ::-webkit-scrollbar {
          width: 6px; /* Thin scrollbar */
        }
    
        ::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2); /* Semi-transparent thumb */
          border-radius: 10px; /* Rounded corners */
          transition: background-color 0.3s ease;
        }
    
        ::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.5); /* Darker when hovered */
        }
    
        ::-webkit-scrollbar-track {
          background: transparent; /* Make track transparent */
        }
    
        /* Firefox */
        * {
          scrollbar-width: thin; /* Thin scrollbar */
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent; /* Thumb color and track transparent */
        }
      `}</style>
      {notReadComplaints.map((complaint) => {
     const dateTime = new Date(complaint.DateTime.seconds * 1000); // Convert seconds to milliseconds
     const date = dateTime.toLocaleDateString();
     const time = dateTime.toLocaleTimeString();
     
      
        const driverName = drivers[complaint.driverID] || 'Unknown Driver';
       
        return (
          <div
            key={complaint.id}
            style={{
              borderBottom: '1px solid #ddd',
              padding: '10px',
              paddingLeft: '-17px',
              cursor: 'pointer',
              transition: 'background 0.3s ease',
            }}
            onClick={() => handlecomplaintNotificationClick(complaint)}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center', // Aligns the line and text
                gap: '7px', // Space between line and text
              }}
            >
              {/* Vertical Red Line */}
              <div
                style={{
                  width: '2px', // Thin width for a line
                  height: '30px', // Adjust height for line length
                  backgroundColor: 'red',
                  borderRadius: '0', // No rounded corners
                  flexShrink: 0,
                }}
              ></div>

              {/* Text Container */}
              <div>
                <strong>Driver: {driverName}</strong>
                <br />
                <span>Complaint raised on {date} at {time}.</span>
              </div>
            </div>
          </div>
        );
      })}</div>
     <div style={{ position: 'sticky', bottom: 0, backgroundColor: '#ffffff', zIndex: 1, paddingTop: '1px',marginBottom:'5px',}}>

     <button 
      onClick={() => navigate('/gdtnotificationslist')}
      style={{
        marginTop:'20px',
        padding: '8px 8px',
        fontSize: '13px',
        cursor: 'pointer',
        border: 'none', 
        backgroundColor: '	#059855',
        color: 'white',
        borderRadius: '5px',
        transition: 'background-color 0.3s ease', 
        marginLeft: 'auto', // Align to the right
        display: 'block', 
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = '#1c7a50'}  // Change to darker green on hover
      onMouseLeave={(e) => e.target.style.backgroundColor = '#059855'}  // Revert back on mouse leave
    >
      View all notifications 
    </button></div>
    </>
  ) : (
    <div style={{ textAlign: 'center', marginTop: '80px', color: '#aaa' }}>
      <BellOutlined style={{ fontSize: '36px', marginBottom: '10px' }} />
      <p style={{ marginBottom: '141.50px' }}>No new complaints</p>
      <button 
      onClick={() => navigate('/gdtnotificationslist')}
      style={{
        marginTop:'20px',
        padding: '8px 8px',
        fontSize: '13px',
        cursor: 'pointer',
        border: 'none', 
        backgroundColor: '	#059855',
        color: 'white',
        borderRadius: '5px',
        transition: 'background-color 0.3s ease', 
        marginLeft: 'auto', // Align to the right
        display: 'block', 
      }}
      onMouseEnter={(e) => e.target.style.backgroundColor = '#1c7a50'}  // Change to darker green on hover
      onMouseLeave={(e) => e.target.style.backgroundColor = '#059855'}  // Revert back on mouse leave
    >
      View all notifications 
    </button></div>
    )
  ) : null}
 


{/* <p style={{ fontSize: '18px', marginBottom: '10px', color: '#333', marginTop:'20px',marginLeft:'5px' }}>Read</p> */}

{/* { hasRecentCrashes ? (
<>

{Object.values(readCrashes).map((crash) => {

const currentDate = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(currentDate.getMonth() - 1); // Set to one month ago
  const crashDate = new Date(crash.time * 1000); // Convert Unix timestamp to Date
  
  const date = formatDate(crash.time);
  const time = new Date(crash.time * 1000).toLocaleTimeString();
  const driverName = drivers[crash.driverID] || 'Unknown Driver';
if(crashDate >= oneMonthAgo){
  return (
    <div
      key={crash.id}
      style={{
        paddingLeft:'18px',
        padding: '10px',
        borderBottom: '1px solid #ddd',
        cursor: 'pointer',
        backgroundColor:'#f0f0f0',
      }}
      onClick={() => handleNotificationClick2(crash)}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#B8B8B8')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
    >
      <strong>Driver: {driverName}</strong>
      <br />
      <span>
        Crash detected on {date} at {time}.
      </span>
    </div>
  );}
})}

</>
) : (
<div style={{ textAlign: 'center', marginTop: '50px', color: '#aaa' }}>
  <BellOutlined style={{ fontSize: '36px', marginBottom: '10px' }} />
  <p
  style={{
    marginBottom: '90px', 
  }}
  >No read notifications</p>
</div>
)} */}
  </div>
);













  const menu = (
    <Menu>
      <Menu.Item
        key="profile"
        onClick={() => {
          const randomQuery = isAdmin ? `?${uuidv4()}` : '';
          handleNavigation(`/gdtprofile${randomQuery}`);
        }}
      >
        Profile
      </Menu.Item>
      <Menu.Item
        key="logout"
        onClick={() => setModalVisible(true)}
        style={{ color: "red" }}
      >
        Logout
      </Menu.Item>
    </Menu>
  );
  

  const navItems = [
    { path: "gdthome", label: "Home" },
    { path: "gdtstafflist", label: "Staff List", adminOnly: true },
    { path: "gdtdriverlist", label: "Drivers List" },
    { path: "gdtviolations", label: "Violations List" },
    { path: "gdtcomplaints", label: "Complaints List" },
    { path: "gdtcrashes", label: "Crashes List" },
    { path: "GDTDashBoard", label: "Dashboard" },
    { path: "gdtheatmap", label: "Heat Map" },
  ];

  return (
    <header>
      <nav>
        <img
          className={s.logo}
          src={SAIRLogo}
          alt="SAIR Logo"
          onClick={() => {
            const randomQuery = isAdmin ? `?${uuidv4()}` : '';
            handleNavigation(`/gdthome${randomQuery}`);
          }}
        />

        <div className={s.navLinks} id="navLinks">
          <ul>
            {navItems.map((item) => {
              // Only render if not adminOnly or user is admin
              if (!item.adminOnly || isAdmin) {
                const randomQuery = isAdmin ? `?${uuidv4()}` : ""; // Add randomQuery only for admins

                return (
                  <li key={item.path}>
                    <a
                      className={active === item.path ? s.active : ""}
                      onClick={() =>
                        handleNavigation(`/${item.path}${randomQuery}`)
                      }
                      style={{ cursor: "pointer" }} 
                    >
                      {item.label}
                    </a>
                  </li>
                );
              }

              // Skip rendering if the condition fails
              return null;
            })}
          </ul>
        </div>

        <div className={s.logoutButton}>
        <Dropdown overlay={menu} trigger={['click']} style={{ fontSize: '15px', zIndex: 999999 }}>
            <Link
              to={(e) => e.preventDefault()}
              style={{ display: 'flex', alignItems: 'center', color: 'black', fontSize: '17px' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#059855')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'black')}
            >
              <UserOutlined style={{ marginRight: 10 }} />
              Hello {firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : ""}
              <DownOutlined style={{ marginLeft: 15 }} />
            </Link>
          </Dropdown>

            <Dropdown overlay={notificationMenu} trigger={['click']}   
                    onVisibleChange={(visible) => {
                    if (!visible) {
                    setActiveTab('Crashes'); // Reset to "Crashes" when clicking outside
              }
            }}
          >
                       
                     <Badge dot={hasNewCrashesgdt}  className={styles.customBadge}   style={{ right: '-22px', left: 'auto' }}>
                     <BellOutlined className={styles.bellIcon} 
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#059855')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'black')}
                        />
                      </Badge>
                    </Dropdown>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <Modal
        title="Confirm Logout"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        centered
        style={{ top: "1%" }}
        className="custom-modal"
        closeIcon={<span className="custom-modal-close-icon">×</span>}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="logout"
            onClick={handleLogout}
            style={{ backgroundColor: "red", color: "white" }}
          >
            Logout
          </Button>,
        ]}
      >
        <p>Are you sure you want to log out?</p>
      </Modal>
    </header>
  );
};

export default GDTHeader;