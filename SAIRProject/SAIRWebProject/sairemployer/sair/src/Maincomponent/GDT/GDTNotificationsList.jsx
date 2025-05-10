import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EyeIcon from "../../images/eye.png";
import s from "../../css/DriverList.module.css";
import f from "../../css/ComplaintList.module.css";
import v from "../../css/Violations.module.css";
import { db } from "../../firebase";
import Header from "./GDTHeader";
import { doc, getDoc } from "firebase/firestore";
import { FaEye } from 'react-icons/fa';
import "../../css/CustomModal.css";
import { Button, Table, Pagination } from "antd";
import { onSnapshot, orderBy } from "firebase/firestore";
import { getDocs, collection, query, where } from "firebase/firestore";
import { FaFilter } from "react-icons/fa";
import { useCallback } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
const GDTNotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All");
  const [notReadCrashes, setNotReadCrashes] = useState([]);
  const [notReadViolations, setnotReadViolations] = useState([]);
  const [notReadComplaints, setnotReadComplaints] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [notificationsList, setNotificationsList] = useState([]); //merged list
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const goBack = () => navigate(-1); // Go back to the previous page
  const statusDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
  const gdtUID = sessionStorage.getItem("gdtUID");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Number of items per page

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!gdtUID) {
      console.error("GDTUID is null or undefined");
      return;
    }

      const handleClickOutside = (event) => {
        if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
          setDropdownOpen(false);
        }
        if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
          setDropdownOpen(false);
        }
      };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    const readCrashes =
      JSON.parse(localStorage.getItem(`readCrashesgdt_${gdtUID}`)) || {};
    const readViolations =
      JSON.parse(localStorage.getItem(`readViolationsgdt_${gdtUID}`)) || {};
    const readComplaints =
      JSON.parse(localStorage.getItem(`readComplaintsgdt_${gdtUID}`)) || {};
    // Function to convert the custom DateTime string to a Date object
    const parseCustomDateTime = (dateTimeString) => {
      if (typeof dateTimeString !== "string") {
        console.warn("Invalid DateTime string:", dateTimeString);
        return new Date(0);
      }

      try {
        // Remove 'at', AM/PM, and trim
        let cleanedString = dateTimeString
          .replace("at", "")
          .replace(/\s?(AM|PM)/, "")
          .trim();

        // Handle timezone (removes "UTC+3")
        cleanedString = cleanedString.replace(/UTC[+-]\d+/, "").trim();

        const parsedDate = new Date(cleanedString);

        if (isNaN(parsedDate.getTime())) {
          console.error("Invalid parsed date:", cleanedString);
          return new Date(0);
        }

        return parsedDate;
      } catch (error) {
        console.error("Error parsing DateTime:", error, dateTimeString);
        return new Date(0);
      }
    };
    const normalizeTimestamp = (notification) => {
      if (notification.DateTime) {
        if (
          typeof notification.DateTime === "object" &&
          notification.DateTime.seconds
        ) {
          return new Date(notification.DateTime.seconds * 1000); // Firestore Timestamp
        } else if (typeof notification.DateTime === "string") {
          return parseCustomDateTime(notification.DateTime); // Custom DateTime String
        }
      } else if (notification.time) {
        return new Date(notification.time * 1000); // Unix timestamp
      }
      return new Date(0); // Default fallback
    };

    // Function to filter out notifications older than a month
    const filterOldNotifications = (notifications) => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      return notifications.filter((notification) => {
        const notificationDate = normalizeTimestamp(notification);
        console.log(
          `Checking Notification: ${
            notification.id || "Unknown"
          }, Date: ${notificationDate}, One Month Ago: ${oneMonthAgo}`
        );
        return notificationDate > oneMonthAgo;
      });
    };

    const filterCrashesOneDay = (notifications) => {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return notifications.filter((notification) => {
        const notificationDate = normalizeTimestamp(notification);
        console.log(
          `Checking Notification: ${
            notification.id || "Unknown"
          }, Date: ${notificationDate}, 24 Hours Ago: ${twentyFourHoursAgo}`
        );
        return notificationDate >= twentyFourHoursAgo;
      });
    };

    console.log(
      "All Read Complaints Before Filtering:",
      Object.values(readComplaints)
    );
    console.log(
      "Parsed Complaints Before Filtering:",
      Object.values(readComplaints).map(normalizeTimestamp)
    );

    // Filter read notifications
    const filteredReadCrashes = filterCrashesOneDay(Object.values(readCrashes));
    const filteredReadViolations = filterOldNotifications(
      //need to changed
      Object.values(readViolations)
    );
    const filteredReadComplaints = filterOldNotifications(
      Object.values(readComplaints)
    );

    // Merge notifications
    const mergedNotifications = [
      ...notReadCrashes.map((crash) => ({
        ...crash,
        Type: "Crash",
        FilterStatus: "Unread",
      })),
      ...notReadViolations.map((violation) => ({
        ...violation,
        Type: "Violation",
        FilterStatus: "Unread",
      })),
      ...notReadComplaints.map((complaint) => ({
        ...complaint,
        Type: "Complaint",
        FilterStatus: "Unread",
      })),
      ...filteredReadCrashes.map((crash) => ({
        ...crash,
        Type: "Crash",
        FilterStatus: "Read",
      })),
      ...filteredReadViolations.map((violation) => ({
        ...violation,
        Type: "Violation",
        FilterStatus: "Read",
      })),
      ...filteredReadComplaints.map((complaint) => ({
        ...complaint,
        Type: "Complaint",
        FilterStatus: "Read",
      })),
    ];
    console.log("Filtered Read Complaints:", filteredReadComplaints);
    console.log("Filtered Read Crashes:", filteredReadCrashes);
    console.log("Filtered Read Violations:", filteredReadViolations);

    // Sort notifications by date (newest first)
    const sortedNotifications = [...mergedNotifications].sort(
      (a, b) => normalizeTimestamp(b) - normalizeTimestamp(a)
    );

    setNotificationsList(sortedNotifications);
  }, [notReadCrashes, notReadViolations, notReadComplaints]);

  const filteredNotifications = useMemo(() => {
    let filtered = notificationsList;

    // Filter by selected statuses
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((item) => selectedStatuses.includes(item.FilterStatus));
    }

    // Filter by selected types
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((item) => selectedTypes.includes(item.Type));
    }

    return filtered;
  }, [notificationsList, selectedTypes, selectedStatuses]);

  useEffect(() => {
    fetchDrivers();
  }, [notReadCrashes, notReadViolations, notReadComplaints]);

  const fetchDrivers = useCallback(async () => {
    const gdtUID = sessionStorage.getItem("gdtUID");
    if (gdtUID) {
      const userDocRef = doc(db, "GDT", gdtUID);
      const docSnap = await getDoc(userDocRef);
      const companyName = docSnap.data().CompanyName;

      // Fetch drivers
      const driverCollection = query(collection(db, "Driver"));

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
    if (!driverIds || !Array.isArray(driverIds) || driverIds.length === 0)
      return;

    const chunkSize = 10; // Customize as needed
    for (let i = 0; i < driverIds.length; i += chunkSize) {
      const chunk = driverIds.slice(i, i + chunkSize);
      if (chunk.length === 0) return;

      const now = Math.floor(Date.now() / 1000);
      const twentyFourHoursAgo = now - 24 * 60 * 60;
      const crashCollection = query(
        collection(db, "Crash"),
        where("driverID", "in", chunk),
        where("Status", "==", "Emergency SOS"),
        where("RespondedBy", "==", null),
        where("time", ">=", twentyFourHoursAgo),
        orderBy("time", "desc") // Order crashes by time in descending order
      );
      const unsubscribeCrashes = onSnapshot(crashCollection, (snapshot) => {
        const storedReadCrashes =
          JSON.parse(localStorage.getItem(`readCrashesgdt_${gdtUID}`)) || {}; // Get read crashes from localStorage

        const crashList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const newCrashes = crashList.filter(
          (crash) => !storedReadCrashes[crash.id]
        );

        setNotReadCrashes(newCrashes);
      });

      return () => unsubscribeCrashes();
    }
  }); //not sure

  // Update crash as read and navigate to details page
  const handleNotificationClick1 = async (crash) => {
    try {
      console.log("id:", crash.id);
      const r =
        JSON.parse(localStorage.getItem(`readCrashesgdt_${gdtUID}`)) || {};
      const updatedReadCrashes = { ...r, [crash.id]: crash };

      localStorage.setItem(
        `readCrashesgdt_${gdtUID}`,
        JSON.stringify(updatedReadCrashes)
      );

      // setReadCrashes(updatedReadCrashes);

      setNotReadCrashes((prev) => prev.filter((c) => c.id !== crash.id));

      navigate(`/crash/general/${crash.id}`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Fetch violation data
  const fetchViolations = useCallback((driverIds) => {
    if (!driverIds || !Array.isArray(driverIds) || driverIds.length === 0)
      return;

    const chunkSize = 10; // Customize as needed
    for (let i = 0; i < driverIds.length; i += chunkSize) {
      const chunk = driverIds.slice(i, i + chunkSize);
      if (chunk.length === 0) return;

      const violationCollection = query(
        collection(db, "Violation"),
        where("driverID", "in", chunk),
        where("Status", "==", "Active"),
        orderBy("time", "desc")
      );
      const unsubscribeViolations = onSnapshot(
        violationCollection,
        (snapshot) => {
          const storedReadViolations =
            JSON.parse(localStorage.getItem(`readViolationsgdt_${gdtUID}`)) ||
            {}; // Get read crashes from localStorage

          const violationList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const newViolation = violationList.filter(
            (violation) => !storedReadViolations[violation.id]
          );

          setnotReadViolations(newViolation);
        }
      );

      ///ABOUT RED CIRCULE VISIBILITY
      return () => unsubscribeViolations();
    }
  }); //not sure

  // Update crash as read and navigate to details page
  const handleviolationNotificationClick = async (violation) => {
    try {
      console.log("id:", violation.id);
      const rr = JSON.parse(localStorage.getItem("notReadViolations22")) || {};
      const updatedReadViolations = { ...rr, [violation.id]: violation };

      localStorage.setItem(
        "readViolations",
        JSON.stringify(updatedReadViolations)
      );

      // setReadViolations(updatedReadViolations);
      setnotReadViolations((prev) => prev.filter((c) => c.id !== violation.id));

      navigate(`/violation/general/${violation.id}`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Fetch complaint data
  const fetchComplaints = useCallback((driverIds) => {
    if (!driverIds || !Array.isArray(driverIds) || driverIds.length === 0)
      return;

    const chunkSize = 10; // Customize as needed
    for (let i = 0; i < driverIds.length; i += chunkSize) {
      const chunk = driverIds.slice(i, i + chunkSize);
      if (chunk.length === 0) return;

      const complaintCollection = query(
        collection(db, "Complaint"),
        where("driverID", "in", chunk),
        where("RespondedBy", "==", null),
        orderBy("DateTime", "desc")
      );
      const unsubscribeComplaint = onSnapshot(
        complaintCollection,
        (snapshot) => {
          const storedReadComplaints =
            JSON.parse(localStorage.getItem(`readComplaintsgdt_${gdtUID}`)) ||
            {}; // Get read crashes from localStorage
          const complaintList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const newComplaint = complaintList.filter(
            (complaint) => !storedReadComplaints[complaint.id]
          );

          setnotReadComplaints(newComplaint);
        }
      );

      ///ABOUT RED CIRCULE VISIBILITY
      return () => unsubscribeComplaint();
    }
  }); //not sure

  // Update crash as read and navigate to details page
  const handlecomplaintNotificationClick = async (complaint) => {
    try {
      console.log("id:", complaint.id);
      const r =
        JSON.parse(localStorage.getItem(`readComplaintsgdt_${gdtUID}`)) || {};
      const updatedReadComplaint = { ...r, [complaint.id]: complaint };

      localStorage.setItem(
        `readComplaintsgdt_${gdtUID}`,
        JSON.stringify(updatedReadComplaint)
      );
      // setReadComplaints(updatedReadComplaint);
      setnotReadComplaints((prev) => prev.filter((c) => c.id !== complaint.id));

      navigate(`/complaint/general/${complaint.id}`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      console.log("id:", notification.id);
      let readKey, notReadSetter;

      if (notification.Type === "Crash") {
        readKey = `readCrashesgdt_${gdtUID}`;
        notReadSetter = setNotReadCrashes;
      } else if (notification.Type === "Violation") {
        readKey = `readViolationsgdt_${gdtUID}`;
        notReadSetter = setnotReadViolations;
      } else if (notification.Type === "Complaint") {
        readKey = `readComplaintsgdt_${gdtUID}`;
        notReadSetter = setnotReadComplaints;
      }

      const readData = JSON.parse(localStorage.getItem(readKey)) || {};
      const updatedReadData = { ...readData, [notification.id]: notification };
      localStorage.setItem(readKey, JSON.stringify(updatedReadData));

      notReadSetter((prev) =>
        prev.filter((item) => item.id !== notification.id)
      );
      if (notification.Type == "Crash" || notification.Type == "Violation") {
        navigate(
          `/gdt${notification.Type.toLowerCase()}/general/${notification.id}`
        );
      }
      if (notification.Type == "Complaint") {
        navigate(`/gdtcomplaints/general/${notification.id}`);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredNotifications.slice(startIndex, startIndex + pageSize);
  }, [filteredNotifications, currentPage, pageSize]);

  const fetchDetailsFromDatabase = async (type, id) => {
    try {
      const collectionName = type;
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        console.log(`No document found for ${type} with ID ${id}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching details for ${type} with ID ${id}:`, error);
      return null;
    }
  };

  const fetchDriverDetails = async (driverID) => {
    try {
      const q = query(
        collection(db, "Driver"),
        where("DriverID", "==", driverID)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      } else {
        console.log(`No driver found with ID ${driverID}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching driver details for ID ${driverID}:`, error);
      return null;
    }
  };

  const safeParse = (key) => {
    try {
      const data = localStorage.getItem(key);
      const parsedData = JSON.parse(data);
      if (
        parsedData &&
        typeof parsedData === "object" &&
        !Array.isArray(parsedData)
      ) {
        return Object.values(parsedData);
      }
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error(`Error parsing ${key}:`, error);
      return [];
    }
  };

  const isWithinLastMonth = (time) => {
    const now = new Date();
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
    const notificationDate = new Date(time);
    return notificationDate >= oneMonthAgo;
  };

  const formatDate = (time) => {
    let date;

    // Check if the time is a Unix timestamp (number in seconds)
    if (
      typeof time === "number" ||
      (typeof time === "string" && !isNaN(time))
    ) {
      date = new Date(time * 1000); // Convert to milliseconds
    } else if (time?.seconds) {
      // Handle Firestore Timestamp
      date = new Date(time.seconds * 1000);
    } else if (time instanceof Date) {
      // Handle JavaScript Date object
      date = time;
    } else {
      // Handle other cases (e.g., invalid date)
      return "Invalid Date";
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
  };
  // const handleDetailsClick = (record) => {
  //   let notReadKey, readKey;

  //   switch (record.Type) {
  //     case "Violation":
  //       notReadKey = "notReadViolations22";
  //       readKey = "readViolations";
  //       break;
  //     case "Crash":
  //       notReadKey = "notReadCrashes22";
  //       readKey = "readCrashes";
  //       break;
  //     case "Complaint":
  //       notReadKey = "notReadComplaints22";
  //       readKey = "readComplaints";
  //       break;
  //     default:
  //       return;
  //   }

  //   // Get existing data
  //   const notReadData = safeParse(notReadKey);
  //   const readData = safeParse(readKey);

  //   console.log("Not Read Data Before:", notReadData);
  //   console.log("Record ID to Remove:", record.ID);

  //   // Find and remove the notification from the unread list
  //   const updatedNotReadData = notReadData.filter(item => item.ID !== record.ID);

  //   console.log("Updated Not Read Data:", updatedNotReadData);

  //   // Add the notification to the read list
  //   const updatedReadData = [...readData, record];

  //   // Update localStorage
  //   localStorage.setItem(notReadKey, JSON.stringify(updatedNotReadData));
  //   localStorage.setItem(readKey, JSON.stringify(updatedReadData));

  //   // Force re-render by updating state
  //   setNotifications(prev =>
  //     prev.map(item =>
  //       item.ID === record.ID ? { ...item, FilterStatus: "Read" } : item
  //     )
  //   );

  //   // Navigate to the details page
  //   let route = "";
  //   switch (record.Type) {
  //     case "Violation":
  //       route = `/violation/general/${record.ID}`;
  //       break;
  //     case "Crash":
  //       route = `/crash/general/${record.ID}`;
  //       break;
  //     case "Complaint":
  //       route = `/complaint/general/${record.ID}`;
  //       break;
  //     default:
  //       route = "#";
  //   }

  //   navigate(route);
  // };

  

  const fetchData = useCallback(async () => {
    const types = [
      { key: "readComplaints", type: "Complaint", filterStatus: "Read" },
      { key: "readViolations", type: "Violation", filterStatus: "Read" },
      { key: "readCrashes", type: "Crash", filterStatus: "Read" },
    ];

    let allNotifications = [];
    let driverIDs = new Set();

    for (const { key, type, filterStatus } of types) {
      const parsedData = safeParse(key) || [];

      parsedData.forEach((item) => {
        driverIDs.add(item.driverID || item.DriverID);
      });

      const ids = parsedData.map((item) => item.id || item.ID);

      // Batch fetch all documents of this type
      const docRefs = ids.map((id) => doc(db, type, id));
      const docSnapshots = await Promise.all(docRefs.map((ref) => getDoc(ref)));

      const formattedData = parsedData.map((item, index) => {
        const details = docSnapshots[index]?.data() || {};
        return {
          ID: item.id || item.ID,
          DriverID: item.driverID || item.DriverID,
          Type: type,
          Status: details.Status || null,
          FilterStatus: filterStatus,
          ViolationID: details.violationID || null,
          CrashID: details.crashID || null,
          ComplaintID: details.ComplaintID || null,
          Time: details.time || details.DateTime || null,
        };
      });

      allNotifications = [...allNotifications, ...formattedData];
    }

    if (!driverIDs || !Array.isArray(driverIDs) || driverIDs.length === 0)
      return;

    // Batch fetch drivers
    const driverQuery = query(
      collection(db, "Driver"),
      where("DriverID", "in", Array.from(driverIDs))
    );

    const driverDocs = await getDocs(driverQuery);
    const driverMap = {};
    driverDocs.forEach((doc) => {
      driverMap[doc.data().DriverID] = doc.data();
    });

    // Attach driver details to notifications
    const finalData = allNotifications.map((notification) => ({
      ...notification,
      Fname: driverMap[notification.DriverID]?.Fname || "Unknown",
      Lname: driverMap[notification.DriverID]?.Lname || "Unknown",
    }));

    // Sort by time (latest first)
    finalData.sort((a, b) => {
      const timeA = a.Time ? new Date(a.Time).getTime() : 0;
      const timeB = b.Time ? new Date(b.Time).getTime() : 0;
      return timeB - timeA;
    });

    setNotifications(finalData);
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = [
    {
      title: "ID",
      dataIndex: "ID",
      key: "ID",
      align: "center",
      render: (text, record) => {
        switch (record.Type) {
          case "Violation":
            return record.violationID || "N/A";
          case "Crash":
            return record.crashID || "N/A";
          case "Complaint":
            return record.ComplaintID || "N/A";
          default:
            return "N/A";
        }
      },
    },
    {
      title: "Type",
      dataIndex: "Type",
      key: "Type",
      align: "center",
    },
    {
      title: "Driver Name",
      dataIndex: "DriverName",
      key: "DriverName",
      align: "center",
      render: (text, record) =>
        `${drivers[record.driverID] || "Unknown Driver"}`,
    },
    {
      title: "Date",
      dataIndex: "Time",
      key: "Time",
      align: "center",
      render: (text, record) => formatDate(record.time || record.DateTime),
    },
    {
      title: "Status",
      dataIndex: "Status",
      key: "Status",
      align: "center",
      render: (text, record) => {
        let color = "black";
        switch (record.Status) {
          case "Approved":
          case "Accepted":
          case "Active":
            color = "green";
            break;
          case "Pending":
            color = "orange";
            break;
          case "Rejected":
          case "Revoked":
          case "Emergency SOS":
            color = "red";
            break;
          default:
            color = "black";
        }
        return <span style={{ color }}>{record.Status}</span>;
      },
    },
    {
      title: "Details",
      key: "Details",
      align: "center",
      render: (text, record) => (
        <FaEye
    style={{ cursor: "pointer", fontSize: "1.5em", color: '#059855' }} 
    onClick={() => handleNotificationClick(record)} 
  />
      ),
    },
  ];


  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const statusOptions = ["All", "Read", "Unread"];
  const typeOptions = ["All", "Violation", "Crash", "Complaint"];

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleTypeOptionClick = (option) => {
    setSelectedTypes((prev) =>
      prev.includes(option) ? prev.filter((type) => type !== option) : [...prev, option]
    );
  };

  const handleStatusOptionClick = (option) => {
    setSelectedStatuses((prev) =>
      prev.includes(option) ? prev.filter((status) => status !== option) : [...prev, option]
    );
  };


  return (
    <div>
      <Header active="notificationslist" />
      <div className="breadcrumb" style={{ marginRight: "100px" }}>
        <a onClick={() => navigate("GDThome")}>Home</a>
        <span> / </span>
        <a onClick={() => navigate("/gdtnotificationslist")}>
          Notification List
        </a>
      </div>
      <main>
        <div className={s.container}>
          <h2 className={s.title}>Notification List</h2>
            {/* Type Filter */}
            <div className={s.searchContainer} ref={typeDropdownRef}>
             <div className={`${v.selectWrapper} ${s.dropdownContainer}`} style={{ width: '355px' }}>
              <FaFilter style={{ width: '17px' }} className={f.filterIcon} />
              <div style={{ position: 'relative', width: '100%' }}>
                <div
                  onClick={toggleDropdown}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    border: 'none',
                    color: 'grey',
                    lineHeight: '1.0',
                    fontSize: '14px',
                  }}
                >
                  {selectedTypes.length > 0 || selectedStatuses.length > 0 
                    ? [...selectedTypes, ...selectedStatuses].join(', ') 
                    : 'Filter Notifications'}
                </div>
                {dropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      background: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      zIndex: 1000,
                      width: '350px',
                      left: '-33px',
                    }}
                  >
                    <div style={{ padding: '10px', fontWeight: 'bold' }}>Type</div>
                    {["Violation", "Crash", "Complaint"].map((option) => (
                      <div key={option} style={{ padding: '10px', cursor: 'pointer' }}>
                        <label style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(option)}
                            onChange={() => handleTypeOptionClick(option)}
                            style={{ marginRight: '10px' }}
                          />
                          {option}
                        </label>
                      </div>
                    ))}
                    <div style={{ padding: '10px', fontWeight: 'bold' }}>Status</div>
                    {["Read", "Unread"].map((option) => (
                      <div key={option} style={{ padding: '10px', cursor: 'pointer' }}>
                        <label style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(option)}
                            onChange={() => handleStatusOptionClick(option)}
                            style={{ marginRight: '10px' }}
                          />
                          {option}
                        </label>
                      </div>
                    ))}
                    <div style={{ padding: '10px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedTypes([]);
                          setSelectedStatuses([]);
                          toggleDropdown();
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          color: 'blue',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 0',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                        }}
                      >
                        Reset Filter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <style>
          {`
            .unread-row {
              background-color: #d0e0d0!important;
            }
          `}
        </style>

        <br />
<Table
  columns={columns}
  dataSource={paginatedNotifications} // Use paginated data
  rowKey={(record) => record.ID || record.id}
  pagination={false} // Disable default pagination
  style={{ width: "1200px", margin: "0 auto", marginBottom: "20px" }}
  rowClassName={(record) =>
    (record.FilterStatus || "").toLowerCase() === "unread"
      ? "unread-row"
      : ""
  }
/>
        {/* Flexbox container for button and pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Button
            onClick={goBack}
            style={{
              height: "60px",
              fontSize: "15px",
              color: "#059855",
              borderColor: "#059855",
            }}
          >
            <ArrowLeftOutlined style={{ marginRight: "8px" }} /> Go Back
          </Button>

          {/* Pagination component with custom style */}
          <Pagination
  current={currentPage} // Current page state
  onChange={(page) => setCurrentPage(page)} // Handle page change
  total={filteredNotifications.length} // Total number of notifications for correct pagination
  pageSize={pageSize} // Items per page
  showSizeChanger={false} // Disable size changer
  itemRender={(page, type, originalElement) => {
    if (type === "page") {
      return (
        <div
          style={{
            borderRadius: "4px",
            padding: "8px",
            margin: "0 4px",
            cursor: "pointer",
            color: "#059855",
            height: "29px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {page}
        </div>
      );
    }
    return originalElement; // Return default for other types (e.g., prev, next)
  }}
/>
        </div>
      </main>
    </div>
  );
};

export default GDTNotificationsList;
