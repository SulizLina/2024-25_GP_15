import { DownOutlined, UserOutlined, BellOutlined } from '@ant-design/icons';
import { Dropdown, Menu, Modal, Button,Badge ,Divider} from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import SAIRLogo from '../images/SAIRlogo.png';
import { auth, db } from '../firebase';
import { useEffect, useState,useCallback , useRef} from 'react';
import { doc, getDoc } from 'firebase/firestore';
import s from '../css/Header.module.css';
import { useContext } from 'react';
import { ShortCompanyNameContext } from '../ShortCompanyNameContext';
import '../css/CustomModal.css';
import { collection, onSnapshot, query, where,orderBy,updateDoc } from 'firebase/firestore';
import styles from "../css/BadgeStyles.module.css";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { BiShow } from "react-icons/bi";


const Header = ({ active }) => {
  const { shortCompanyName , setShortCompanyName} = useContext(ShortCompanyNameContext);
  const navigate = useNavigate();
  const [modalVisible, setModalVisible] = useState(false);
  const [drivers, setDrivers] = useState({});
  const [notReadCrashes, setNotReadCrashes] = useState([]);
  const [readCrashes, setReadCrashes] = useState(
    JSON.parse(localStorage.getItem("readCrashes")) || {}
  );
  const [isShown, setIsShown] = useState(false);
  const [activeTab, setActiveTab] = useState('Crashes'); // Default tab is 
  const [notReadCrashes22, setnotReadCrashes22] = useState(
    JSON.parse(localStorage.getItem("notReadCrashes22")) || {}
  );
     const [storedCrashIds, setStoredCrashIds] = useState(() => {
    const saved = localStorage.getItem("crashIds");
    return saved ? JSON.parse(saved) : []; // Parse JSON if found, else initialize as an empty array
  });
  const [notReadViolations, setnotReadViolations] = useState([]);
  const [readViolations, setReadViolations] = useState(
    JSON.parse(localStorage.getItem("readViolations")) || {}
  );
  const [notReadViolations22, setnotReadViolations22] = useState(
    JSON.parse(localStorage.getItem("notReadViolations22")) || {}
  );

  const [notReadComplaints, setnotReadComplaints] = useState([]);
  const [readComplaints, setReadComplaints] = useState(
    JSON.parse(localStorage.getItem("readComplaints")) || {}
  );
  const [notReadComplaints22, setnotReadComplaints22] = useState(
    JSON.parse(localStorage.getItem("notReadComplaints22")) || {}
  );
  // const [hasNewCrashes, setHasNewCrashes] = useState(Object.keys(notReadCrashes22).length > 0|| Object.keys(notReadViolations22).length > 0 || Object.keys(notReadComplaints22).length > 0);
  // const [hasNewCrashes, setHasNewCrashes] = useState(() => {
  //   return JSON.parse(localStorage.getItem('hasNewCrashes')) || false;
  // });
  const [hasNewCrashes, setHasNewCrashes] = useState(() => {
    // Move complex initialization logic into useState callback
    return (
      Object.keys(notReadCrashes).length > 0 ||
      Object.keys(notReadViolations).length > 0 ||
      Object.keys(notReadComplaints).length > 0
    );
  });

  const employerUID = sessionStorage.getItem('employerUID');


  useEffect(() => {
    const fetchShortCompanyName = async () => {
      console.log('in headerr',shortCompanyName);
      if (!shortCompanyName) { // Only fetch if it's not set
        const employerUID = sessionStorage.getItem('employerUID');
        if (employerUID) {
          try {
            const userDocRef = doc(db, 'Employer', employerUID);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setShortCompanyName(data.ShortCompanyName || '');
              console.log('in headerr',shortCompanyName);
            }
          } catch (error) {
            console.error('Error fetching short company name:', error);
          }
        }
      }
    };

    fetchShortCompanyName();
  }, [shortCompanyName, setShortCompanyName]);

  useEffect(() => {
    const hasNew = 
    Object.keys(notReadCrashes).length > 0 ||
    Object.keys(notReadViolations).length > 0 ||
    Object.keys(notReadComplaints).length > 0

    const storedHasNew = JSON.parse(localStorage.getItem('hasNewCrashes'));

    if (storedHasNew !== hasNew) {

    localStorage.setItem('hasNewCrashes', JSON.stringify(hasNew));
    setHasNewCrashes(hasNew);
    }

  }, [notReadCrashes, notReadViolations, notReadComplaints]);

  // // Effect to handle storage events
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'hasNewCrashes') {
        setHasNewCrashes(JSON.parse(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [employerUID]);


  useEffect(() => {
    // Update localStorage whenever storedCrashIds changes
    localStorage.setItem("crashIds", JSON.stringify(storedCrashIds));
  }, [storedCrashIds]);
 
  // useEffect(() => {
  //   // Update localStorage whenever storedCrashIds changes
  //   localStorage.setItem("notReadCrashes22", JSON.stringify(notReadCrashes));
  // }, [notReadCrashes]);
  
  // Fetch drivers and crashes based on employer UID and company name
  
  useEffect(() => {
    fetchDrivers();
  }, [notReadCrashes,notReadCrashes22,notReadViolations,notReadViolations22,notReadComplaints,notReadComplaints22]);


  


  const fetchDrivers = useCallback(async () => {
    const employerUID = sessionStorage.getItem('employerUID');
    if (employerUID) {
      const userDocRef = doc(db, 'Employer', employerUID);
      const docSnap = await getDoc(userDocRef);
      const companyName = docSnap.data().CompanyName;

      // Fetch drivers
      const driverCollection = query(
        collection(db, 'Driver'),
        where('CompanyName', '==', companyName)
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
    }
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
        const storedReadCrashes = JSON.parse(localStorage.getItem("readCrashes")) || {}; // Get read crashes from localStorage

        const crashList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      
        const newCrashes = crashList.filter(crash => !storedReadCrashes[crash.id]);

const updatedReadCrashes = { ...notReadCrashes22};
        newCrashes.forEach(crash => {
         updatedReadCrashes[crash.id]=crash ;
        })
        localStorage.setItem("notReadCrashes22", JSON.stringify(updatedReadCrashes));///for the red circul
        console.log('44444444444444444444444444444444444444444');
        console.log(notReadCrashes22);

        const r= JSON.parse(localStorage.getItem("notReadCrashes")) || {};
       

        // if(Object.keys(r).length > 0|| Object.keys(notReadViolations).length > 0 || Object.keys(notReadComplaints).length > 0 ){

        //   if (storedHasNew !== hasNew) {
        //   setHasNewCrashes(true);
        //   localStorage.setItem("hasNewCrashes", JSON.stringify(true));
        //   console.log('yees',hasNewCrashes);}
        //       }
        //       else{
        //         if (storedHasNew !== hasNew) {
        //         setHasNewCrashes(false);
        //         localStorage.setItem("hasNewCrashes", JSON.stringify(false));
        //       }}

        
        // const hasNew = 
        // Object.keys(notReadCrashes).length > 0 ||
        // Object.keys(notReadViolations).length > 0 ||
        // Object.keys(notReadComplaints).length > 0
    
        // const storedHasNew = JSON.parse(localStorage.getItem('hasNewCrashes'));
    
        // if (storedHasNew !== hasNew) {
    
        // localStorage.setItem('hasNewCrashes', JSON.stringify(hasNew));
        // setHasNewCrashes(hasNew);
        // }

        setNotReadCrashes(newCrashes);
      });
      
      return () => unsubscribeCrashes();
    }
  });//not sure

  

  // Update crash as read and navigate to details page
  const handleNotificationClick = async (crash) => {
    try {
     
      console.log('id:',crash.id);
      const updatedReadCrashes = { ...readCrashes, [crash.id]: crash };
      console.log('updated',updatedReadCrashes);
      localStorage.setItem("readCrashes", JSON.stringify(updatedReadCrashes));
     const r= JSON.parse(localStorage.getItem("readCrashes")) || {};
    console.log('r:',r);
      setReadCrashes(updatedReadCrashes);
      // Move crash to read notifications
      setNotReadCrashes(prev => prev.filter(c => c.id !== crash.id));

      let notReadCrashes22 = JSON.parse(localStorage.getItem("notReadCrashes22")) || {};
      delete notReadCrashes22[crash.id];
      localStorage.setItem("notReadCrashes22", JSON.stringify(notReadCrashes22));

      const rr= JSON.parse(localStorage.getItem("notReadCrashes")) || {};
      console.log('check11',rr);

      // const hasNew = 
      // Object.keys(notReadCrashes).length > 0 ||
      // Object.keys(notReadViolations).length > 0 ||
      // Object.keys(notReadComplaints).length > 0
  
      // const storedHasNew = JSON.parse(localStorage.getItem('hasNewCrashes'));
  
      // if (storedHasNew !== hasNew) {
  
      // localStorage.setItem('hasNewCrashes', JSON.stringify(hasNew));
      // setHasNewCrashes(hasNew);
      // }



      console.log('after remove:',notReadCrashes22);

      navigate(`/crash/general/${crash.id}`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  
  // useEffect(() => {
  //   console.log('hasNewCrashes updated:', hasNewCrashes);
  // }, [hasNewCrashes, refreshKey]); // Add refreshKey as a dependency

  

  // Fetch violation data
  const fetchViolations = useCallback((driverIds) => {
    const chunkSize = 10; // Customize as needed
    for (let i = 0; i < driverIds.length; i += chunkSize) {
      const chunk = driverIds.slice(i, i + chunkSize);
      const violationCollection = query(
        collection(db, 'Violation'),
        where('driverID', 'in', chunk),
        where('Status','==','Active'),
        orderBy('time', 'desc') 
      );
      const unsubscribeViolations = onSnapshot(violationCollection, (snapshot) => {
        
        const storedReadViolations = JSON.parse(localStorage.getItem("readViolations")) || {}; // Get read crashes from localStorage

        const violationList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const newViolation = violationList.filter(violation => !storedReadViolations[violation.id]);

        const updatedReadViolations = { ...notReadViolations22};

        newViolation.forEach(violation => {
           updatedReadViolations[violation.id]= violation;
        })
        localStorage.setItem("notReadViolations22", JSON.stringify(updatedReadViolations));///for the red circul

        // const hasNew = 
        // Object.keys(notReadCrashes).length > 0 ||
        // Object.keys(notReadViolations).length > 0 ||
        // Object.keys(notReadComplaints).length > 0
    
        // const storedHasNew = JSON.parse(localStorage.getItem('hasNewCrashes'));
    
        // if (storedHasNew !== hasNew) {
    
        // localStorage.setItem('hasNewCrashes', JSON.stringify(hasNew));
        // setHasNewCrashes(hasNew);
        // }


        setnotReadViolations(newViolation);
      });
      
        ///ABOUT RED CIRCULE VISIBILITY
      return () => unsubscribeViolations();
    }
  });//not sure

  

  // Update crash as read and navigate to details page
  const handleviolationNotificationClick = async (violation) => {
    try {
     
      console.log('id:',violation.id);
      const updatedReadViolations = { ...readViolations, [violation.id]: violation };
      console.log('updated',updatedReadViolations);
      localStorage.setItem("readViolations", JSON.stringify(updatedReadViolations));
     const r= JSON.parse(localStorage.getItem("readViolations")) || {};
    console.log('r:',r);
    setReadViolations(updatedReadViolations);
      // Move crash to read notifications
      setnotReadViolations(prev => prev.filter(c => c.id !== violation.id));

      let notReadViolations22 = JSON.parse(localStorage.getItem("notReadViolations22")) || {};
      delete notReadViolations22[violation.id];
      localStorage.setItem("notReadViolations22", JSON.stringify(notReadViolations22));

      const rr= JSON.parse(localStorage.getItem("notReadViolations")) || {};
      console.log('check11',rr);

      // const hasNew = 
      // Object.keys(notReadCrashes).length > 0 ||
      // Object.keys(notReadViolations).length > 0 ||
      // Object.keys(notReadComplaints).length > 0
  
      // const storedHasNew = JSON.parse(localStorage.getItem('hasNewCrashes'));
  
      // if (storedHasNew !== hasNew) {
  
      // localStorage.setItem('hasNewCrashes', JSON.stringify(hasNew));
      // setHasNewCrashes(hasNew);
      // }


      console.log('after remove:',notReadViolations22);

      navigate(`/violation/general/${violation.id}`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };





  // Fetch complaint data
  const fetchComplaints = useCallback((driverIds) => {
    console.log('jfjfjfjf');
    const chunkSize = 10; // Customize as needed
    for (let i = 0; i < driverIds.length; i += chunkSize) {
      const chunk = driverIds.slice(i, i + chunkSize);
      const complaintCollection = query(
        collection(db, 'Complaint'),
        where('driverID', 'in', chunk),
        where('RespondedBy', '==', null),
        orderBy('DateTime', 'desc') 
      );
      const unsubscribeComplaint = onSnapshot(complaintCollection, (snapshot) => {
        
        const storedReadComplaints = JSON.parse(localStorage.getItem("readComplaints")) || {}; // Get read crashes from localStorage
console.log('storedReadComplaints',storedReadComplaints);
        const complaintList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const newComplaint = complaintList.filter(complaint => !storedReadComplaints[complaint.id]);

        const updatedReadComplaints = { ...notReadComplaints22};

        newComplaint.forEach(complaint => {
           updatedReadComplaints[complaint.id]=complaint;
        })
        localStorage.setItem("notReadComplaints22", JSON.stringify(updatedReadComplaints));///for the red circul

        // const hasNew = 
        // Object.keys(notReadCrashes).length > 0 ||
        // Object.keys(notReadViolations).length > 0 ||
        // Object.keys(notReadComplaints).length > 0
    
        // const storedHasNew = JSON.parse(localStorage.getItem('hasNewCrashes'));
    
        // if (storedHasNew !== hasNew) {
    
        // localStorage.setItem('hasNewCrashes', JSON.stringify(hasNew));
        // setHasNewCrashes(hasNew);
        // }


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
      const updatedReadComplaint = { ...readComplaints, [complaint.id]: complaint };
      console.log('updated',updatedReadComplaint);
      localStorage.setItem("readComplaints", JSON.stringify(updatedReadComplaint));
     const r= JSON.parse(localStorage.getItem("readComplaints")) || {};
    console.log('r:',r);
    setReadComplaints(updatedReadComplaint);
      // Move crash to read notifications
      setnotReadComplaints(prev => prev.filter(c => c.id !== complaint.id));

      let notReadComplaints22 = JSON.parse(localStorage.getItem("notReadComplaints22")) || {};
      delete notReadComplaints22[complaint.id];
      localStorage.setItem("notReadComplaints22", JSON.stringify(notReadComplaints22));

      const rr= JSON.parse(localStorage.getItem("notReadComplaints")) || {};
      console.log('check11',rr);

      // const hasNew = 
      // Object.keys(notReadCrashes).length > 0 ||
      // Object.keys(notReadViolations).length > 0 ||
      // Object.keys(notReadComplaints).length > 0
  
      // const storedHasNew = JSON.parse(localStorage.getItem('hasNewCrashes'));
  
      // if (storedHasNew !== hasNew) {
  
      // localStorage.setItem('hasNewCrashes', JSON.stringify(hasNew));
      // setHasNewCrashes(hasNew);
      // }



      navigate(`/complaint/general/${complaint.id}`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };






  const handleallreadcrash = async (notReadCrashes) => {
    // Retrieve 'notReadCrashes22' from localStorage once
    console.log('check',notReadCrashes);
    // Create a new object for updated read crashes
    let updatedReadCrashes = { ...readCrashes};
    let notReadCrashes22 = JSON.parse(localStorage.getItem("notReadCrashes22")) || {};

    notReadCrashes.forEach(crash => {
      updatedReadCrashes = { ...updatedReadCrashes, [crash.id]: crash };
      delete notReadCrashes22[crash.id];
  
      // Update localStorage and state after the loop ends
      localStorage.setItem("readCrashes", JSON.stringify(updatedReadCrashes));
  
      // Log to check intermediate values
      console.log('updatedReadCrashes:', updatedReadCrashes);
      console.log('notReadCrashes22:', notReadCrashes22);
    });
  
    // Update state after the loop
    setReadCrashes(updatedReadCrashes);
    setNotReadCrashes([]);
    localStorage.setItem("notReadCrashes22", JSON.stringify({}));

    // const hasNew = 
    // Object.keys(notReadCrashes).length > 0 ||
    // Object.keys(notReadViolations).length > 0 ||
    // Object.keys(notReadComplaints).length > 0

    // const storedHasNew = JSON.parse(localStorage.getItem('hasNewCrashes'));

    // if (storedHasNew !== hasNew) {

    // localStorage.setItem('hasNewCrashes', JSON.stringify(hasNew));
    // setHasNewCrashes(hasNew);
    // }
  };

  const handleallreadviolation = async (notReadViolations) => {
    // Retrieve 'notReadCrashes22' from localStorage once
    console.log('check',notReadViolations);
    // Create a new object for updated read crashes
    let updatedReadViolation = { ...readViolations};
    let notReadViolations22 = JSON.parse(localStorage.getItem("notReadViolations22")) || {};

    notReadViolations.forEach(violation => {
      updatedReadViolation = { ...updatedReadViolation, [violation.id]: violation };
      delete notReadViolations22[violation.id];
  
      // Update localStorage and state after the loop ends
      localStorage.setItem("readViolations", JSON.stringify(updatedReadViolation));
  
      // Log to check intermediate values
      console.log('updatedReadViolation:', updatedReadViolation);
      console.log('notReadViolations22:', notReadViolations22);
    });
  
    // Update state after the loop
    setReadViolations(updatedReadViolation);
    setnotReadViolations([]);
    localStorage.setItem("notReadViolations22", JSON.stringify({}));

    // const hasNew = 
    // Object.keys(notReadCrashes).length > 0 ||
    // Object.keys(notReadViolations).length > 0 ||
    // Object.keys(notReadComplaints).length > 0

    // const storedHasNew = JSON.parse(localStorage.getItem('hasNewCrashes'));

    // if (storedHasNew !== hasNew) {

    // localStorage.setItem('hasNewCrashes', JSON.stringify(hasNew));
    // setHasNewCrashes(hasNew);
    // }
  };
  

  const handleallreadcomplaint = async (notReadComplaints) => {
    // Retrieve 'notReadCrashes22' from localStorage once
    console.log('check',notReadComplaints);
    // Create a new object for updated read crashes
    let updatedReadComplaint = { ...readComplaints};
    let notReadComplaints22 = JSON.parse(localStorage.getItem("notReadComplaints22")) || {};

    notReadComplaints.forEach(complaint => {
      updatedReadComplaint = { ...updatedReadComplaint, [complaint.id]: complaint };
      delete notReadComplaints22[complaint.id];
  
      // Update localStorage and state after the loop ends
      localStorage.setItem("readComplaints", JSON.stringify(updatedReadComplaint));
  
      // Log to check intermediate values
      console.log('updatedReadComplaint:', updatedReadComplaint);
      console.log('notReadComplaints22:', notReadComplaints22);
    });
  
    // Update state after the loop
    setReadComplaints(updatedReadComplaint);
    setnotReadComplaints([]);
    localStorage.setItem("notReadComplaints22", JSON.stringify({}));

    // const hasNew = 
    // Object.keys(notReadCrashes).length > 0 ||
    // Object.keys(notReadViolations).length > 0 ||
    // Object.keys(notReadComplaints).length > 0

    // const storedHasNew = JSON.parse(localStorage.getItem('hasNewCrashes'));

    // if (storedHasNew !== hasNew) {

    // localStorage.setItem('hasNewCrashes', JSON.stringify(hasNew));
    // setHasNewCrashes(hasNew);
    // }
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


  const showModal = () => {
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  

 
  const handleLogout = async () => {
    try {
      await auth.signOut(); // Sign out the user
      // Clear all session-specific data
      sessionStorage.removeItem('ShortCompanyName');
      sessionStorage.removeItem('employerUID');
      localStorage.removeItem('crashIds');
      localStorage.removeItem('readCrashes');
      localStorage.removeItem('notReadCrashes');
      localStorage.removeItem('notReadCrashes22');

      localStorage.removeItem('readViolations');
      localStorage.removeItem('notReadViolations');
      localStorage.removeItem('notReadViolations22');

      localStorage.removeItem('readComplaints');
      localStorage.removeItem('notReadComplaints');
      localStorage.removeItem('notReadComplaints22');

      localStorage.removeItem('hasNewCrashes');
      window.dispatchEvent(new Event('storage')); // Notify other components
      // Navigate to the login page
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setModalVisible(false); // Close the logout confirmation modal
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
        onClick={() => navigate('/notificationslist')}
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
        onClick={() => navigate('/notificationslist')}
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
        onClick={() => navigate('/notificationslist')}
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
        onClick={() => navigate('/notificationslist')}
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
        onClick={() => navigate('/notificationslist')}
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
        onClick={() => navigate('/notificationslist')}
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
      <Menu.Item key='profile' onClick={() => navigate('/employee-profile')}>
        Profile
      </Menu.Item>
      <Menu.Item key='logout' onClick={showModal} style={{ color: 'red' }}>
        Logout
      </Menu.Item>
    </Menu>
  );


  // onClick={() => handleNotificationClick(index, notification)}
  const navItems = [
    { path: 'employer-home', label: 'Home' },
    { path: 'violations', label: 'Violations List' },
    { path: 'crashes', label: 'Crashes List' },
    { path: 'complaints', label: 'Complaints List' },
    { path: 'driverslist', label: 'Drivers List' },
    { path: 'motorcycleslist', label: 'Motorcycles List' },
    { path: 'EmployerHeatMap', label: 'Heat Map' },

  ];

  return (
    <header>
      <nav>
        <Link to={'/employer-home'}>
          <img className={s.logo} src={SAIRLogo} alt='SAIR Logo' />
        </Link>

        <div className={s.navLinks} id='navLinks'>
<ul>
      {navItems.map((item) => (
        <li key={item.path}>
          <Link className={active === item.path ? s.active : ''} to={`/${item.path}`}>
            {item.label}
          </Link>
        </li>
      ))}
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
              Hello {shortCompanyName || ''}
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
             
           <Badge dot={hasNewCrashes}  className={styles.customBadge}   style={{ right: '-22px', left: 'auto' }}>
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
        onCancel={handleCancel}
        centered
        style={{ top: '1%' }}
        className="custom-modal"
        closeIcon={
          <span className="custom-modal-close-icon">
            ×
          </span>
        }
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="logout" onClick={handleLogout} style={{ backgroundColor: 'red', color: 'white' }}>
            Logout
          </Button>,
        ]}
      >
        <p>Are you sure you want to log out?</p>
      </Modal>
    </header>
  );
};

export default Header;