import { useEffect, useState, useRef } from "react";
import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { notification, Modal, Button } from 'antd'; // Import Modal and Button

notification.config({
  placement: "topRight",
  duration: 5,
  closeIcon: (
    <span style={{ fontSize: "20px", color: "#ffffff" }}>×</span>
  ),
});

export const GDTNotification = () => {
  const [GdtDrivers, setGdtDrivers] = useState({});
  const [gdtUID, setgdtUID] = useState(sessionStorage.getItem("gdtUID"));
  const cleanupListeners = useRef([]);
  const [currentCrash, setCurrentCrash] = useState(null);
  const [GDT, setGDT] = useState({ Fname: '', Lname: '' });
  const [originalGDTData, setOriginalGDTData] = useState({});
  const crashId = currentCrash?.id;

  const cleanupAllListeners = () => {
    cleanupListeners.current.forEach((unsubscribe) => unsubscribe());
    cleanupListeners.current = [];
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setgdtUID(sessionStorage.getItem("gdtUID"));
    };
    const fetchGDT = async () => {
      try {
        const docRef = doc(db, "GDT", gdtUID); // Replace GDTUID with gdtUID
        const docSnap = await getDoc(docRef);
    
        if (docSnap.exists()) {
          console.log("Document data:", docSnap.data());
          setGDT(docSnap.data()); // Set the retrieved data to the GDT state
          setOriginalGDTData(docSnap.data()); // Store the original data
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);

    const originalSetItem = sessionStorage.setItem;
    sessionStorage.setItem = function (key, value) {
      originalSetItem.apply(this, arguments);
      if (key === "gdtUID") {
        setgdtUID(value);
      }
    };
    fetchGDT();
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      sessionStorage.setItem = originalSetItem;
    };
  }, []);

  useEffect(() => {
    const driverQuery = query(collection(db, "Driver"));
    let updatedDrivers = {};

    const unsubscribeDrivers = onSnapshot(driverQuery, async (driverSnapshot) => {
      const drivers = driverSnapshot.docs.map((doc) => ({
        id: doc.data().DriverID,
        name: `${doc.data().Fname} ${doc.data().Lname}`,
        PhoneNumber: doc.data().PhoneNumber,
      }));
      updatedDrivers = drivers.reduce((acc, driver) => {
        acc[driver.id] = {
          name: driver.name,
          PhoneNumber: driver.PhoneNumber,
        };
        return acc;
      }, {});

      setGdtDrivers((prev) => ({
        ...prev,
        ...updatedDrivers,
      }));

      if (gdtUID) {
        setupCrashListeners(updatedDrivers, true);
        setupViolationListeners(updatedDrivers, true);
        setupComplaintListeners(updatedDrivers, true);
      } else {
        setupCrashListeners(updatedDrivers, false);
        setupViolationListeners(updatedDrivers, false);
        setupComplaintListeners(updatedDrivers, false);

      }
    });

    cleanupListeners.current.push(unsubscribeDrivers);
    return () => cleanupAllListeners();

  }, [gdtUID]);

  // Setup crash listeners
  const setupCrashListeners = (drivers, showNotifications) => {
    if (!drivers || Object.keys(drivers).length === 0) return;

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

      const unsubscribeCrash = onSnapshot(crashQuery, (snapshot) => {
        snapshot.docs.forEach(async (crashDoc) => {
          const crash = { id: crashDoc.id, ...crashDoc.data() };
          const driver = drivers[crash.driverID] || { name: "Unknown", phoneNumber: "Unavailable" };
          const date = formatDate(crash.time);
          const time = new Date(crash.time * 1000).toLocaleTimeString();

          const notifiedCrashes = JSON.parse(localStorage.getItem("notifiedCrashes")) || {};
          if (notifiedCrashes[crash.id]) return; // Skip if already notified

          notifiedCrashes[crash.id] = true;
          localStorage.setItem("notifiedCrashes", JSON.stringify(notifiedCrashes));
console.log('in gdt local storage',notifiedCrashes);
          if (showNotifications && gdtUID) {
            notification.open({
              message: <strong>Crash Alert</strong>,
              description: (
                <>
                  Crash detected for driver {driver.name} on {date} at {time}. Phone: {driver.PhoneNumber}.
                  Please view the crash details
                  {" "}
                  <a 
                     href={`/gdtcrash/general/${crash.id}`}
                    style={{ color: "black", textDecoration: "underline" }}
                  >
                    by clicking here
                  </a>.
                </>
              ),
              placement: "topRight",
              closeIcon: null,
              duration: 20,
              className: "custom-notification",
              style: {
                width: 450,
                backgroundColor: "rgba(255, 77, 79, 0.6)",
                color: "#ffffff",
                borderRadius: "10px",
              },
            });
          }
        });
      });
      cleanupListeners.current.push(unsubscribeCrash);
    }
  };

  // Setup violation listeners
  const setupViolationListeners = (drivers, showNotifications) => {
    if (!drivers || Object.keys(drivers).length === 0) return;

    const driverIds = Object.keys(drivers);
    const chunkSize = 10;

    for (let i = 0; i < driverIds.length; i += chunkSize) {
      const chunk = driverIds.slice(i, i + chunkSize);
      const ViolationQuery = query(
        collection(db, "Violation"),
        where("driverID", "in", driverIds),
        where('Status','==','Active')
      );

      const unsubscribeViolation = onSnapshot(ViolationQuery, (snapshot) => {
        snapshot.docs.forEach(async (violationDoc) => {
          const violation = { id: violationDoc.id, ...violationDoc.data() };
          const driver = drivers[violation.driverID] || { name: "Unknown", phoneNumber: "Unavailable" };
          const date = formatDate(violation.time);
          const time = new Date(violation.time * 1000).toLocaleTimeString();

          const notifiedViolation = JSON.parse(localStorage.getItem("notifiedViolation")) || {};
          if (notifiedViolation[violation.id]) return; // Skip if already notified

          notifiedViolation[violation.id] = true;
          localStorage.setItem("notifiedViolation", JSON.stringify(notifiedViolation));

          if (showNotifications && gdtUID) {
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
        });
      });
      cleanupListeners.current.push(unsubscribeViolation);
    }
  };

   // Setup complaint listeners
   const setupComplaintListeners = (drivers, showNotifications) => {
    if (!drivers || Object.keys(drivers).length === 0) return;

    const driverIds = Object.keys(drivers);
    const chunkSize = 10;

    for (let i = 0; i < driverIds.length; i += chunkSize) {
      const chunk = driverIds.slice(i, i + chunkSize);
      const ComplaintQuery = query(
        collection(db, "Complaint"),
        where("driverID", "in", driverIds),
        where('RespondedBy', '==', null),
      );

      const unsubscribeComplaint = onSnapshot(ComplaintQuery, (snapshot) => {
        snapshot.docs.forEach(async (complaintDoc) => {
          const complaint = { id: complaintDoc.id, ...complaintDoc.data() };
          const driver = drivers[complaint.driverID] || { name: "Unknown", phoneNumber: "Unavailable" };
          const dateTime = new Date(complaint.DateTime.seconds * 1000); // Convert seconds to milliseconds
          const date = dateTime.toLocaleDateString();
          const time = dateTime.toLocaleTimeString();

          const notifiedComplaint = JSON.parse(localStorage.getItem("notifiedComplaint")) || {};
          if (notifiedComplaint[complaint.id]) return; // Skip if already notified

          notifiedComplaint[complaint.id] = true;
          localStorage.setItem("notifiedComplaint", JSON.stringify(notifiedComplaint));

          if (showNotifications && gdtUID) {
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
        });
      });
      cleanupListeners.current.push(unsubscribeComplaint);
    }
  };


  const formatDate = (time) => {
    const date = new Date(time * 1000);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const notificationElement = document.querySelector(".custom-notification");
      if (notificationElement && !notificationElement.contains(event.target)) {
        notification.destroy();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
};