import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaEye } from 'react-icons/fa';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import EyeIcon from "../../images/eye.png";
import { Button, Modal } from "antd";
import { Table } from "antd";
import Header from "./GDTHeader";
import { FaFilter } from "react-icons/fa";
import s from "../../css/CrashList.module.css"; 
import c from "../../css/ComplaintList.module.css";
import v from "../../css/Violations.module.css";
import formstyle from "../../css/Profile.module.css";
import { useParams } from "react-router-dom";
import "../../css/CustomModal.css";
import { Tooltip } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Pagination } from "antd";

const CrashList = () => {
  const { GDTID } = useParams();
  const [searchParams] = useSearchParams();
  const company = searchParams.get("company");
  const date = searchParams.get("date");

  const [motorcycles, setMotorcycles] = useState({});
  const [crashes, setCrashes] = useState([]);
  const [currentCrash, setCurrentCrash] = useState({});
  const [drivers, setDrivers] = useState({});
  const [GDT, setGDT] = useState({ Fname: "", Lname: "" });
  const [gdtInfo, setGdtInfo] = useState({
    Fname: "",
    Lname: "",
    ID: "",
    GDTEmail: "",
    PhoneNumber: "",
  });

  const [companyInfo, setCompanyInfo] = useState({
    Name: "",
    ShortName: "",
    CommercialNum: "",
    CompamyEmail: "",
    ComPhoneNumber: "",
  });
  const [isPopupVisibleStaff, setIsPopupVisibleStaff] = useState(false);
  const [isPopupVisibleCompany, setIsPopupVisibleCompany] = useState(false);

  const [respondingGDT, setRespondingGDT] = useState({
    Fname: "",
    Lname: "",
    ID: "",
    GDTEmail: "",
    PhoneNumber: "",
  });
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchDriverID, setSearchDriverID] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(""); // Single search input
  const gdtUID = sessionStorage.getItem("gdtUID");
  const [modalVisible, setModalVisible] = useState(false);
  const [respondedByNames, setRespondedByNames] = useState({});

  const goBack = () => {
    navigate(-1);
  };

  // State to track viewed crashes
  const [viewedCrashes, setViewedCrashes] = useState(() => {
    const storedViewedCrashes = sessionStorage.getItem("viewedCrashes");
    return storedViewedCrashes ? JSON.parse(storedViewedCrashes) : {};
  });

  const fetchGDT = async () => {
    try {
      const docRef = doc(db, "GDT", gdtUID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
        setGDT(docSnap.data()); // Set the retrieved data to the GDT state
      } else {
        console.error("No such document!");
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  };

  const fetchGDTName = async (GDTID) => {
    try {
      const gdtQuery = query(collection(db, "GDT"), where("ID", "==", GDTID));
      const snapshot = await getDocs(gdtQuery);
      if (!snapshot.empty) {
        const gdtData = snapshot.docs[0].data();
        return {
          Fname: gdtData.Fname || "",
          Lname: gdtData.Lname || "",
          ID: gdtData.ID || "",
          GDTEmail: gdtData.GDTEmail || "",
          PhoneNumber: gdtData.PhoneNumber || "",
          // Add other fields as needed
        };
      }
      return {
        Fname: "Unknown",
        Lname: "",
        ID: "",
        GDTEmail: "",
        PhoneNumber: "",
      };
    } catch (error) {
      console.error("Error fetching GDT data:", error);
      return {
        Fname: "Error",
        Lname: "",
        ID: "",
        GDTEmail: "",
        PhoneNumber: "",
      };
    }
  };

  const fetchCompany = async (company) => {
    try {
      const compayQuery = query(collection(db, "Employer"), where("CompanyName", "==", company));
      const snapshot = await getDocs(compayQuery);
      if (!snapshot.empty) {
        const companyData = snapshot.docs[0].data();
        return {
          Name: companyData.CompanyName  || "",
          ShortName: companyData.ShortCompanyName || "",
          CommercialNum: companyData.commercialNumber || "",
          CompanyEmail: companyData.CompanyEmail || "",
          PhoneNumber: companyData.PhoneNumber || "",
        };
      }
      return {
        Name: "",
        ShortName: "",
        CommercialNum: "",
        CompanyEmail: "",
        PhoneNumber: "",
      };
    } catch (error) {
      console.error("Error fetching GDT data:", error);
      return {
        Name: "",
        ShortName: "",
        CommercialNum: "",
        CompanyEmail: "",
        PhoneNumber: "",
      };
    }
  };

  useEffect(() => {
    const fetchDriversAndCrashes = async () => {
      if (!gdtUID) return;

      const GDTDoc = await getDoc(doc(db, "GDT", gdtUID));

      const driverCollection = query(collection(db, "Driver"));

      const unsubscribeDrivers = onSnapshot(driverCollection, (snapshot) => {
        const driverIds = [];
        const driverMap = {};
        const companyPromises = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.DriverID) {
            driverMap[data.DriverID] = {
              name: `${data.Fname} ${data.Lname}`,
              companyName: data.CompanyName,
              shortCompanyName: "", // Placeholder for ShortCompanyName
            };
          }

          driverIds.push(data.DriverID);
          companyPromises.push(
            fetchCompany(data.CompanyName).then((shortName) => {
              driverMap[data.DriverID].shortCompanyName = shortName;
            })
          );
        });

        if (driverIds.length === 0) {
          console.error("No valid Driver IDs found.");
          return;
        }

        setDrivers(driverMap);
        fetchCrashes(driverIds);
        fetchGDT();
      });

      return () => unsubscribeDrivers();
    };

    const fetchCompany = async (companyName) => {
      console.log("fetchCompany called with companyName:", companyName); // Debugging line
      if (!companyName) {
        console.error("fetchCompany ERROR: companyName is undefined or empty!");
        return "";
      }
      const companyQuery = query(
        collection(db, "Employer"),
        where("CompanyName", "==", companyName)
      );

      const snapshot = await getDocs(companyQuery);
      if (!snapshot.empty) {
        const companyData = snapshot.docs[0].data();
        return companyData.ShortCompanyName || companyName; // Fallback to full name if short name not available
      }
      return companyName; // Return the original name if no match found
    };

    const fetchCrashes = (driverIds) => {
      if (!driverIds || driverIds.length === 0) {
        console.error("Driver IDs are invalid.");
        return;
      }

      const crashCollection = query(
        collection(db, "Crash"),
        where("driverID", "in", driverIds)
      );

      const unsubscribeCrashes = onSnapshot(crashCollection, (snapshot) => {
        const crashList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Fetched Crashes:", crashList); // Debugging

        setCrashes(crashList);
        fetchMotorcycles(crashList);
      });

      return () => unsubscribeCrashes();
    };

    const fetchMotorcycles = (crashList) => {
      const crashIDs = crashList
        .map((crash) => crash.crashID)
        .filter((id) => id); // Filter out undefined or null;

      if (!crashIDs || crashIDs.length === 0) {
        console.error("No valid Crash IDs found.");
        return;
      }

      const motorcycleCollection = query(
        collection(db, "History"),
        where("ID", "in", crashIDs) // Ensure this matches the ID field in History
      );

      const unsubscribeMotorcycles = onSnapshot(
        motorcycleCollection,
        (snapshot) => {
          const motorcycleMap = {};
          snapshot.forEach((doc) => {
            const data = doc.data();
            motorcycleMap[data.ID] = data.LicensePlate; // Map ID to LicensePlate
          });
          setMotorcycles(motorcycleMap);
        }
      );

      return () => unsubscribeMotorcycles();
    };

    fetchDriversAndCrashes();
  }, [gdtUID]);

  const filterByStatus = (record) => {
    const formattedStatus =
      record.Status.charAt(0).toUpperCase() +
      record.Status.slice(1).toLowerCase();

    if (selectedStatus === "Responsed") {
      return formattedStatus === "Emergency sos" && record.RespondedBy != null; // Responded
    } else if (selectedStatus === "Unresponsed") {
      return formattedStatus === "Emergency sos" && record.RespondedBy == null; // Unresponded
    }
    return true; // Show all if no filter is selected
  };

  const filteredCrashes = crashes
    .filter((crash) => {
      // Always filter by relevant statuses
      const isRelevantStatus =
        crash.Status === "Emergency SOS" || crash.Status === "Denied";
      if (!isRelevantStatus) return false;

      // If GDTID is passed, show only crashes responded by that GDT
      // if (GDTID) {
      //   if (!crash.RespondedBy) return false; // Exclude null/undefined
      //   if (crash.RespondedBy !== GDTID) return false;
      // }

      const crashDate = crash.time
        ? new Date(crash.time * 1000).toISOString().split("T")[0]
        : "";

      //const matchesSearchDate = searchDate ? crashDate === searchDate : true;
      const crashDateObj = crash.time ? new Date(crash.time * 1000) : null;
      const searchDateObj = searchDate ? new Date(searchDate) : null;
      
      const matchesSearchDate = !searchDateObj || (
        searchDateObj.getDate() === 1
          ? (crashDateObj?.getMonth() === searchDateObj.getMonth() &&
            crashDateObj?.getFullYear() === searchDateObj.getFullYear())
          : (crashDateObj?.toDateString() === searchDateObj.toDateString())
      );

      const driverId = crash.driverID;
      const licensePlate = motorcycles[crash.crashID] || " ";
      
      const matchesCompany =
      company && company !== "all"
        ? drivers[crash.driverID]?.companyName === company
        : true;   

      
    const matchesGDT = GDTID ? crash.RespondedBy === GDTID : true;

      const matchesSearchQuery =
        driverId.includes(searchQuery) ||
        licensePlate.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearchQuery && matchesSearchDate && matchesCompany && matchesGDT;
    })
    .filter(filterByStatus)
    .sort((a, b) => (b.time || 0) - (a.time || 0));

  const formatDate = (time) => {
    const date = new Date(time * 1000);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    const day = date.getDate().toString().padStart(2, "0"); // Days are 1-based
    return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
  };

  const GDTResponse = async (respondedBy) => {
    if (respondedByNames[respondedBy]) {
      return respondedByNames[respondedBy];
    }
  
    try {
      const gdtQuery = query(collection(db, "GDT"), where("ID", "==", respondedBy));
      const snapshot = await getDocs(gdtQuery);
      if (!snapshot.empty) {
        const gdtData = snapshot.docs[0].data();
        const name = `${gdtData.Fname} ${gdtData.Lname}`;
        setRespondedByNames((prev) => ({ ...prev, [respondedBy]: name }));
        return name;
      } else {
        setRespondedByNames((prev) => ({ ...prev, [respondedBy]: "Unknown" }));
        return "Unknown";
      }
    } catch (error) {
      console.error("Error fetching GDT details:", error);
      return "Error";
    }
  };
  

  const ResponseBy = ({ respondedBy }) => {
    const [responseByName, setResponseByName] = useState("");
  
    useEffect(() => {
      if (!respondedBy) return;
  
      // Check if already cached
      if (respondedByNames[respondedBy]) {
        setResponseByName(respondedByNames[respondedBy]);
      } else {
        GDTResponse(respondedBy).then(setResponseByName);
      }
    }, [respondedBy]);
  
    return <span>{responseByName}</span>;
  }; 

  const handleViewDetails = (record) => {
    setModalVisible(false);
    const updatedViewedCrashes = { ...viewedCrashes, [record.id]: true };
    setViewedCrashes(updatedViewedCrashes);
    sessionStorage.setItem(
      "viewedCrashes",
      JSON.stringify(updatedViewedCrashes)
    );

    navigate(`/gdtcrash/general/${record.id}`);
  };

  useEffect(() => {
    if (!GDTID) return;
  
    const gdtQuery = query(collection(db, "GDT"), where("ID", "==", GDTID));
    const unsubscribe = onSnapshot(gdtQuery, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setGdtInfo(data);
      } else {
        console.error("No GDT found with ID:", GDTID);
        setGdtInfo(null);
      }
    });
  
    return () => unsubscribe();
  }, [GDTID]);

  useEffect(() => {
    const companyName = async () => {
      if (company) {
        const info = await fetchCompany(company);
        setCompanyInfo(info);
      }
    };
    companyName();
  }, [company]);

  useEffect(() => {
    if (date) {
      setSearchDate(date);
    }
  }, [date]);
  

  const handleConfirmResponse = (record) => {
    setCurrentCrash(record);
    setModalVisible(true); // Show the confirmation modal
  };

  const handleResponse = async () => {
    setModalVisible(false); // Close the modal

    try {
      // Ensure the GDT data is valid
      if (!GDT.Fname || !GDT.Lname) {
        console.error("Responder details are incomplete");
        return;
      }

      const updatedCrash = {
        ...currentCrash,
        RespondedBy: `${GDT.Fname} ${GDT.Lname}`, // Combine first and last name
      };

      const crashDocRef = doc(db, "Crash", currentCrash.id);

      // Update Firestore with the new RespondedBy field
      await updateDoc(crashDocRef, { RespondedBy: updatedCrash.RespondedBy });

      // Update the local state with the new crash details
      setCurrentCrash(updatedCrash);

      console.log("Crash response updated successfully");
    } catch (error) {
      console.error("Error updating crash response:", error);
    }
  };

  const columns = [
    {
      title: "Crash ID",
      dataIndex: "crashID",
      key: "id",
      align: "center",
    },
    {
      title: "Driver Name",
      key: "driverName",
      align: "center",
      render: (text, record) => {
        const driverName = drivers[record.driverID]?.name || "   ";
        const capitalizeddriverName =
          driverName.charAt(0).toUpperCase() + driverName.slice(1);
        return capitalizeddriverName;
      },
    },
    {
      title: "Company Name",
      key: "CompanyName",
      align: "center",
      render: (text, record) => {
        const companyName = drivers[record.driverID]?.shortCompanyName || "   ";
        const capitalizedCompanyName =
          companyName.charAt(0).toUpperCase() + companyName.slice(1);
        return capitalizedCompanyName;
      },
    },
    {
      title: "Motorcycle License Plate",
      key: "motorcyclePlate",
      align: "center",
      render: (text, record) => motorcycles[record.crashID] || "   ", // Use crashID to fetch motorcycle
    },
    {
      title: "Status",
      key: "Status",
      align: "center",
      render: (text, record) => {
        const formattedStatus = record.Status;
        return (
          <span
            style={{
              color: formattedStatus === "Emergency SOS" ? "red" : "green",
            }}
          >
            {formattedStatus}
          </span>
        );
      },
    },
    {
      title: "Response By",
      key: "responseby",
      align: "center",
      render: (text, record) => {
        const formattedStatus =
          record.Status.charAt(0).toUpperCase() +
          record.Status.slice(1).toLowerCase();

        if (formattedStatus === "Denied") {
          return <span style={{ color: "grey" }}>No Response Needed</span>;
        } else if (formattedStatus === "Emergency sos" && record.RespondedBy) {
          // Render the RespondedBy value with an underline
          return <ResponseBy respondedBy={record.RespondedBy} />;
        } else if (formattedStatus === "Emergency sos" && !record.RespondedBy) {
          return (
            // i did not remove the function but only change button to p also remove on click
            <p
              style={{
                backgroundColor: "transparent",
                color: "red",
                border: "none",
                borderRadius: "4px",
                padding: "4px 8px",
                cursor: "default",
              }}
            >
              Need for Response
            </p>
          );
        } else {
          return null;
        }
      },
    },
    {
      title: "Date",
      key: "date",
      align: "center",
      render: (text, record) => formatDate(record.time),
    },
    {
      title: "Crash Details",
      key: "Details",
      align: "center",
      render: (text, record) => (
        <Link
          to={`/gdtcrash/general/${record.id}`}
          onClick={() => handleViewDetails(record)}
        >
           <FaEye
                               style={{ cursor: 'pointer', fontSize: '1.5em', color: '#059855' }} 
                             />
        </Link>
      ),
    },
  ];

  const handleShowPopupStaff = () => {
    setIsPopupVisibleStaff(true);
  };

  const handleClosePopupStaff = () => {
    setIsPopupVisibleStaff(false);
  };

  const handleShowPopupCompany = () => {
    setIsPopupVisibleCompany(true);
  };

  const handleClosePopupCompany = () => {
    setIsPopupVisibleCompany(false);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const paginatedCrashes = filteredCrashes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );  

  const paginatedData = filteredCrashes.slice((currentPage - 1) * 5, currentPage * 5);



  return (
    <>
      <Header active="gdtcrashes" />
      <div className="breadcrumb">
        {GDTID || company ? (
          <a onClick={() => navigate("/GDTDashBoard")}>Dashboard</a>
        ) : (
          <a onClick={() => navigate("/gdthome")}>Home</a>
        )}
        <span> / </span>
        <a onClick={() => navigate("/gdtcrashes")}>Crashes List</a>
      </div>
      <main>
        <div className={s.container}>
          <div className={s.searchHeader}>
            <div>
            <h2 className={s.title}> Crashes List
                {/* {company ? "Crash Reports" : "Crashes List"}{" "}
                {GDTID && (
                  <>
                    Responded by{" "}
                    <span
                      className={s.gdtName}
                      style={{ textDecoration: "underline", cursor: "pointer" }}
                      onClick={handleShowPopupStaff}
                    >
                      {gdtInfo.Fname} {gdtInfo.Lname}
                    </span>
                  </>
                )}
                {company && !GDTID && (
                  <>
                    from{" "}
                    <span
                      className={s.gdtName}
                      style={{ textDecoration: "underline", cursor: "pointer" }}
                      onClick={handleShowPopupCompany}
                    >
                      {companyInfo.ShortName}
                    </span>{" "}
                    Drivers
                  </>
                )} */}
              </h2>
            </div>
            <div className={s.searchRightGroup}>
              <div className={s.searchInputs}>
                <div className={s.searchContainer}>
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="#059855"
                      strokeLinecap="round"
                      strokeWidth="2"
                      d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                    />
                  </svg>

                  <input
                    type="text"
                    placeholder="Search by Driver ID or License Plate"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: "235px", height: "20px" }}
                  />
                </div>
              </div>
              {!GDTID && (
<div className={s.searchContainer}>
<div className={`${v.selectWrapper} ${s.dropdownContainer}`}>
  <FaFilter style={{ width: '26px' }} className={c.filterIcon} />
  <div style={{ position: 'relative', width: '280px' }}>
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'grey', // Grey color for placeholder
        pointerEvents: 'none', // Prevent clicking on the placeholder
        fontSize: '14px',
        zIndex: 1, // Ensure it appears above the select
        
      }}
    >
      {selectedStatus && selectedStatus !== "All" ? selectedStatus : 'Filter by Response'}
    </div>
    <select
      className={s.customSelect}
      onChange={event => {
        const value = event.target.value;
        setSelectedStatus(value === "All" ? "" : value); // Reset to empty string if "All" is selected
      }}
      defaultValue=""
      style={{
        width: "135%", // Adjust width to fit the container
        height: "40px", // Increased height for better spacing
        fontSize: "14px",
        color: 'transparent', // Hide the default text color
        appearance: 'none', // Remove default arrow
        background: 'transparent', // Set background to transparent
        border: 'none', // No border
        borderRadius: '4px', // Rounded corners
        paddingLeft: '10px', // Add space for placeholder
        paddingRight: '30px', // Space for the arrow
        paddingTop: '10px', // Padding to avoid overlap
        paddingBottom: '10px',
        zIndex: 1,
        outline: 'none',
        position: 'relative', // Add this if not already set
        left: '-40px', // Adjust this value to move left
      }}
    >
      <option value="" disabled hidden></option>
      <option value="All" style={{ color: 'black' }}>All</option>
      <option value="Responsed" style={{ color: 'black' }}>Responsed</option>
      <option value="Unresponsed" style={{ color: 'black' }}>Unresponsed</option>
    </select>
  </div>
</div>
                </div>
              )}
              {!date && (
              <div
                className={s.searchContainerdate}
                style={{ position: "relative" }}
              >
                <div>
                  {/* Conditional rendering for the green circle with tick */}
                  {searchDate && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-1px", // Adjust this value to position it vertically
                        right: "-1px", // Adjust this value to position it horizontally
                        width: "20px", // Size of the circle
                        height: "20px", // Size of the circle
                        borderRadius: "50%",
                        backgroundColor: "green",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "white",
                        fontSize: "14px",
                        zIndex: 1, // Ensure it appears in front
                      }}
                    >
                      ✓
                    </div>
                  )}

                  {/* Your SVG Icon */}
                  <svg
                    onClick={() =>
                      document.getElementById("date-input").focus()
                    }
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "1px",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      width: "40px", // Adjusted width
                      height: "40px", // Adjusted height
                    }}
                  >
                    <path
                      d="M18 2V4M6 2V4"
                      stroke="#059855"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M11.9955 13H12.0045M11.9955 17H12.0045M15.991 13H16M8 13H8.00897M8 17H8.00897"
                      stroke="#059855"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3.5 8H20.5"
                      stroke="#059855"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2.5 12.2432C2.5 7.88594 2.5 5.70728 3.75212 4.35364C5.00424 3 7.01949 3 11.05 3H12.95C16.9805 3 18.9958 3 20.2479 4.35364C21.5 5.70728 21.5 7.88594 21.5 12.2432V12.7568C21.5 17.1141 21.5 19.2927 20.2479 20.6464C18.9958 22 16.9805 22 12.95 22H11.05C7.01949 22 5.00424 22 3.75212 20.6464C2.5 19.2927 2.5 17.1141 2.5 12.7568V12.2432Z"
                      stroke="#059855"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 8H21"
                      stroke="#059855"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <input
                    id="date-input"
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    style={{
                      width: "100%",
                      height: "40px", // Adjusted height
                      fontSize: "16px",
                      paddingLeft: "40px", // Add padding to avoid overlap with the icon
                      backgroundColor: "transparent",
                      border: "0px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
              )}
            </div>
          </div>
            {GDTID && (
              <h3 className={s.subtitleDashboard}>
                <>
                Crashes Handled by{" "}
                  <span
                    className={s.gdtName}
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                    onClick={handleShowPopupStaff}
                  >
                    {gdtInfo.Fname} {gdtInfo.Lname}
                  </span>
                </>
              </h3>
            )}

          {company && !GDTID && company !== "all" && (
            <h3 className={s.subtitleDashboard}>
            <>
              Crash Reports from{" "}
              <span
                className={s.gdtName}
                style={{ textDecoration: "underline", cursor: "pointer" }}
                onClick={handleShowPopupCompany}
              >
                {companyInfo.ShortName}
              </span>{" "}
              Drivers
              {date && (
                <>
                  {" "}on <span style={{ fontWeight: "bold" }}>{date}</span>
                </>
              )}
            </>
          </h3>
          )}
                      
          {company == "all" && (
            <h3 className={s.subtitleDashboard}>
              <>
              Crash Reports{" "}
                {date && (
                  <>
                    {" "}on <span style={{ fontWeight: "bold" }}>{date}</span>
                  </>
                )}
              </>
            </h3>
          )}

          <Modal
            title="Confirm Response"
            visible={modalVisible}
            onCancel={() => setModalVisible(false)} // Close the modal when canceled
            closeIcon={<span className="custom-modal-close-icon">×</span>}
            centered
            footer={[
              <Button
                key="details"
                onClick={() => {
                  setModalVisible(false);
                  handleViewDetails(currentCrash); // Navigate to crash details when the button is clicked
                }}
              >
                {" "}
                {/* see crash details: handleViewDetails(record.id) */}
                Crash Details
              </Button>,
              <Button key="confirm" type="primary" onClick={handleResponse}>
                Confirm
              </Button>,
            ]}
          >
            <p>
              {GDT.Fname.charAt(0).toUpperCase() + GDT.Fname.slice(1)}{" "}
              {GDT.Lname.charAt(0).toUpperCase() + GDT.Lname.slice(1)}, by
              clicking on confirm button, you formally acknowledge your
              responsibility for overseeing the management of this crash.
              <br />
              <br />
              Additionally, you affirm your obligation to ensure that the driver
              involved has been contacted.
            </p>
          </Modal>

          {/*//////////////// POP-UP  ////////////////*/}
          <Modal
            visible={isPopupVisibleStaff}
            onCancel={handleClosePopupStaff}
            footer={null}
            width={700}
            closeIcon={<span className="custom-modal-close-icon">×</span>}
          >
            <main className={formstyle.GDTcontainer}>
              <div>
                <h4 className={formstyle.GDTLabel}>Staff Information</h4>

                <div id="Staff name">
                  <h3
                    style={{
                      color: "#059855",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      color="#059855"
                      fill="none"
                      width="35"
                      height="35"
                      style={{ marginBottom: "-5px", marginRight: "10px" }}
                    >
                      <path
                        d="M14 3.5H10C6.22876 3.5 4.34315 3.5 3.17157 4.67157C2 5.84315 2 7.72876 2 11.5V12.5C2 16.2712 2 18.1569 3.17157 19.3284C4.34315 20.5 6.22876 20.5 10 20.5H14C17.7712 20.5 19.6569 20.5 20.8284 19.3284C22 18.1569 22 16.2712 22 12.5V11.5C22 7.72876 22 5.84315 20.8284 4.67157C19.6569 3.5 17.7712 3.5 14 3.5Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M5 16C6.03569 13.4189 9.89616 13.2491 11 16"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                      />
                      <path
                        d="M9.75 9.75C9.75 10.7165 8.9665 11.5 8 11.5C7.0335 11.5 6.25 10.7165 6.25 9.75C6.25 8.7835 7.0335 8 8 8C8.9665 8 9.75 8.7835 9.75 9.75Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                      />
                      <path
                        d="M14 8.5H19M14 12H19M14 15.5H16.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    Staff ID (National Number)
                  </h3>
                  <p
                    style={{
                      fontSize: "18px",
                      marginLeft: "45px",
                      marginBottom: "20px",
                    }}
                  >
                    {gdtInfo.ID}
                  </p>

                  <h3
                    style={{
                      color: "#059855",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      color="#059855"
                      fill="none"
                      width="35"
                      height="35"
                      style={{ marginBottom: "-5px", marginRight: "10px" }}
                    >
                      <path
                        d="M14 3.5H10C6.22876 3.5 4.34315 3.5 3.17157 4.67157C2 5.84315 2 7.72876 2 11.5V12.5C2 16.2712 2 18.1569 3.17157 19.3284C4.34315 20.5 6.22876 20.5 10 20.5H14C17.7712 20.5 19.6569 20.5 20.8284 19.3284C22 18.1569 22 16.2712 22 12.5V11.5C22 7.72876 22 5.84315 20.8284 4.67157C19.6569 3.5 17.7712 3.5 14 3.5Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M5 16C6.03569 13.4189 9.89616 13.2491 11 16"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                      />
                      <path
                        d="M9.75 9.75C9.75 10.7165 8.9665 11.5 8 11.5C7.0335 11.5 6.25 10.7165 6.25 9.75C6.25 8.7835 7.0335 8 8 8C8.9665 8 9.75 8.7835 9.75 9.75Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                      />
                      <path
                        d="M14 8.5H19M14 12H19M14 15.5H16.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    Staff Name
                  </h3>
                  <p
                    style={{
                      fontSize: "18px",
                      marginLeft: "45px",
                      marginBottom: "20px",
                    }}
                  >
                    {gdtInfo.Fname} {gdtInfo.Lname}
                  </p>

                  <h3
                    style={{
                      color: "#059855",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="35"
                      height="35"
                      style={{ marginBottom: "-5px", marginRight: "10px" }}
                      color="#059855"
                      fill="none"
                    >
                      <path
                        d="M9.1585 5.71223L8.75584 4.80625C8.49256 4.21388 8.36092 3.91768 8.16405 3.69101C7.91732 3.40694 7.59571 3.19794 7.23592 3.08785C6.94883 3 6.6247 3 5.97645 3C5.02815 3 4.554 3 4.15597 3.18229C3.68711 3.39702 3.26368 3.86328 3.09497 4.3506C2.95175 4.76429 2.99278 5.18943 3.07482 6.0397C3.94815 15.0902 8.91006 20.0521 17.9605 20.9254C18.8108 21.0075 19.236 21.0485 19.6496 20.9053C20.137 20.7366 20.6032 20.3131 20.818 19.8443C21.0002 19.4462 21.0002 18.9721 21.0002 18.0238C21.0002 17.3755 21.0002 17.0514 20.9124 16.7643C20.8023 16.4045 20.5933 16.0829 20.3092 15.8362C20.0826 15.6393 19.7864 15.5077 19.194 15.2444L18.288 14.8417C17.6465 14.5566 17.3257 14.4141 16.9998 14.3831C16.6878 14.3534 16.3733 14.3972 16.0813 14.5109C15.7762 14.6297 15.5066 14.8544 14.9672 15.3038C14.4304 15.7512 14.162 15.9749 13.834 16.0947C13.5432 16.2009 13.1588 16.2403 12.8526 16.1951C12.5071 16.1442 12.2426 16.0029 11.7135 15.7201C10.0675 14.8405 9.15977 13.9328 8.28011 12.2867C7.99738 11.7577 7.85602 11.4931 7.80511 11.1477C7.75998 10.8414 7.79932 10.457 7.90554 10.1663C8.02536 9.83828 8.24905 9.56986 8.69643 9.033C9.14586 8.49368 9.37058 8.22402 9.48939 7.91891C9.60309 7.62694 9.64686 7.3124 9.61719 7.00048C9.58618 6.67452 9.44362 6.35376 9.1585 5.71223Z"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                      />
                    </svg>
                    Staff Phone Numbr
                  </h3>
                  <p
                    style={{
                      fontSize: "18px",
                      marginLeft: "45px",
                      marginBottom: "20px",
                    }}
                  >
                    {gdtInfo.PhoneNumber}
                  </p>

                  <h3
                    style={{
                      color: "#059855",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="35"
                      height="35"
                      style={{ marginBottom: "-5px", marginRight: "10px" }}
                      color="#059855"
                      fill="none"
                    >
                      <path
                        d="M2 5L8.91302 8.92462C11.4387 10.3585 12.5613 10.3585 15.087 8.92462L22 5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M10.5 19.5C10.0337 19.4939 9.56682 19.485 9.09883 19.4732C5.95033 19.3941 4.37608 19.3545 3.24496 18.2184C2.11383 17.0823 2.08114 15.5487 2.01577 12.4814C1.99475 11.4951 1.99474 10.5147 2.01576 9.52843C2.08114 6.46113 2.11382 4.92748 3.24495 3.79139C4.37608 2.6553 5.95033 2.61573 9.09882 2.53658C11.0393 2.4878 12.9607 2.48781 14.9012 2.53659C18.0497 2.61574 19.6239 2.65532 20.755 3.79141C21.8862 4.92749 21.9189 6.46114 21.9842 9.52844C21.9939 9.98251 21.9991 10.1965 21.9999 10.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M19 17C19 17.8284 18.3284 18.5 17.5 18.5C16.6716 18.5 16 17.8284 16 17C16 16.1716 16.6716 15.5 17.5 15.5C18.3284 15.5 19 16.1716 19 17ZM19 17V17.5C19 18.3284 19.6716 19 20.5 19C21.3284 19 22 18.3284 22 17.5V17C22 14.5147 19.9853 12.5 17.5 12.5C15.0147 12.5 13 14.5147 13 17C13 19.4853 15.0147 21.5 17.5 21.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    Staff Email
                  </h3>
                  <p style={{ fontSize: "18px", marginLeft: "45px" }}>
                    <a
                      href={`mailto:${gdtInfo?.GDTEmail}`}
                      style={{ color: "#444", textDecoration: "underline" }}
                    >
                      {gdtInfo.GDTEmail}
                    </a>
                  </p>
                </div>
              </div>
            </main>
          </Modal>
          {/*///////////////////////////////END POP-UP/////////////////////////////////////////// */}


          {/*//////////////// POP-UP  ////////////////*/}
          <Modal
            visible={isPopupVisibleCompany}
            onCancel={handleClosePopupCompany}
            footer={null}
            width={700}
            closeIcon={<span className="custom-modal-close-icon">×</span>}
          >
            <main className={formstyle.GDTcontainer}>
              <div>
                <h4 className={formstyle.GDTLabel}>Delivery Company Information</h4>

                <div id="Company name">
                  <h3
                    style={{
                      color: "#059855",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    color="#059855"
                    fill="none"
                    width="35"
                    height="35"
                    style={{ marginBottom: "-5px", marginRight: "10px" }}
                  >
                    <path
                      d="M16 10L18.1494 10.6448C19.5226 11.0568 20.2092 11.2628 20.6046 11.7942C21 12.3256 21 13.0425 21 14.4761V22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 9L11 9M8 13L11 13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 22V19C12 18.0572 12 17.5858 11.7071 17.2929C11.4142 17 10.9428 17 10 17H9C8.05719 17 7.58579 17 7.29289 17.2929C7 17.5858 7 18.0572 7 19V22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 22L22 22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M3 22V6.71724C3 4.20649 3 2.95111 3.79118 2.32824C4.58237 1.70537 5.74742 2.04355 8.07752 2.7199L13.0775 4.17122C14.4836 4.57937 15.1867 4.78344 15.5933 5.33965C16 5.89587 16 6.65344 16 8.16857V22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                    Company Full Name
                  </h3>
                  <p
                    style={{
                      fontSize: "18px",
                      marginLeft: "45px",
                      marginBottom: "20px",
                    }}
                  >
                    {companyInfo.Name}
                  </p>

                  <h3
                    style={{
                      color: "#059855",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    color="#059855"
                    fill="none"
                    width="35"
                    height="35"
                    style={{ marginBottom: "-5px", marginRight: "10px" }}
                  >
                    <path
                      d="M16 10L18.1494 10.6448C19.5226 11.0568 20.2092 11.2628 20.6046 11.7942C21 12.3256 21 13.0425 21 14.4761V22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 9L11 9M8 13L11 13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 22V19C12 18.0572 12 17.5858 11.7071 17.2929C11.4142 17 10.9428 17 10 17H9C8.05719 17 7.58579 17 7.29289 17.2929C7 17.5858 7 18.0572 7 19V22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 22L22 22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M3 22V6.71724C3 4.20649 3 2.95111 3.79118 2.32824C4.58237 1.70537 5.74742 2.04355 8.07752 2.7199L13.0775 4.17122C14.4836 4.57937 15.1867 4.78344 15.5933 5.33965C16 5.89587 16 6.65344 16 8.16857V22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                    Company Short Name
                  </h3>
                  <p
                    style={{
                      fontSize: "18px",
                      marginLeft: "45px",
                      marginBottom: "20px",
                    }}
                  >
                    {companyInfo.ShortName}
                  </p>

                  <h3
                    style={{
                      color: "#059855",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    color="#059855"
                    fill="none"
                    width="35"
                    height="35"
                    style={{ marginBottom: "-5px", marginRight: "10px" }}
                  >
                    <path
                      d="M16 10L18.1494 10.6448C19.5226 11.0568 20.2092 11.2628 20.6046 11.7942C21 12.3256 21 13.0425 21 14.4761V22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 9L11 9M8 13L11 13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 22V19C12 18.0572 12 17.5858 11.7071 17.2929C11.4142 17 10.9428 17 10 17H9C8.05719 17 7.58579 17 7.29289 17.2929C7 17.5858 7 18.0572 7 19V22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 22L22 22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M3 22V6.71724C3 4.20649 3 2.95111 3.79118 2.32824C4.58237 1.70537 5.74742 2.04355 8.07752 2.7199L13.0775 4.17122C14.4836 4.57937 15.1867 4.78344 15.5933 5.33965C16 5.89587 16 6.65344 16 8.16857V22"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                    Company Commercial Number
                  </h3>
                  <p
                    style={{
                      fontSize: "18px",
                      marginLeft: "45px",
                      marginBottom: "20px",
                    }}
                  >
                    {companyInfo.CommercialNum}
                  </p>

                  <h3
                    style={{
                      color: "#059855",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="35"
                      height="35"
                      style={{ marginBottom: "-5px", marginRight: "10px" }}
                      color="#059855"
                      fill="none"
                    >
                      <path
                        d="M2 5L8.91302 8.92462C11.4387 10.3585 12.5613 10.3585 15.087 8.92462L22 5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M10.5 19.5C10.0337 19.4939 9.56682 19.485 9.09883 19.4732C5.95033 19.3941 4.37608 19.3545 3.24496 18.2184C2.11383 17.0823 2.08114 15.5487 2.01577 12.4814C1.99475 11.4951 1.99474 10.5147 2.01576 9.52843C2.08114 6.46113 2.11382 4.92748 3.24495 3.79139C4.37608 2.6553 5.95033 2.61573 9.09882 2.53658C11.0393 2.4878 12.9607 2.48781 14.9012 2.53659C18.0497 2.61574 19.6239 2.65532 20.755 3.79141C21.8862 4.92749 21.9189 6.46114 21.9842 9.52844C21.9939 9.98251 21.9991 10.1965 21.9999 10.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M19 17C19 17.8284 18.3284 18.5 17.5 18.5C16.6716 18.5 16 17.8284 16 17C16 16.1716 16.6716 15.5 17.5 15.5C18.3284 15.5 19 16.1716 19 17ZM19 17V17.5C19 18.3284 19.6716 19 20.5 19C21.3284 19 22 18.3284 22 17.5V17C22 14.5147 19.9853 12.5 17.5 12.5C15.0147 12.5 13 14.5147 13 17C13 19.4853 15.0147 21.5 17.5 21.5"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    Company Email
                  </h3>
                  <p style={{ fontSize: "18px", marginLeft: "45px" }}>
                    <a
                      href={`mailto:${companyInfo?.CompamyEmail}`}
                      style={{ color: "#444", textDecoration: "underline" }}
                    >
                      {companyInfo.CompanyEmail}
                    </a>
                  </p>
                </div>
              </div>
            </main>
          </Modal>
          {/*///////////////////////////////END POP-UP--Company/////////////////////////////////////////// */}

          <Table
            columns={columns}
            dataSource={paginatedData}
            rowKey="id"
            // pagination={{ pageSize: 5 }}
            pagination={false}
            onRow={(record) => ({
              style: {
                backgroundColor:
                  !viewedCrashes[record.id] && !record.RespondedBy
                    ? "#d0e0d0"
                    : "transparent",
              },
            })}
          />
          <div
            style={{
              display: "flex",
              justifyContent: (company || GDTID)  ? 'space-between' : 'flex-end',
              alignItems: "center",
              marginTop: "16px",
            }}
          >
            {(GDTID || company) && (
              <Button
                onClick={goBack}
                style={{
                  width: "auto",
                  height: "60px",
                  fontSize: "15px",
                  color: "#059855",
                  borderColor: "#059855",
                  marginBottom: "20px"
                }}
              >
                <ArrowLeftOutlined style={{ marginRight: "8px" }} />
                Go Back
              </Button>
            )}
            <Pagination
            current={currentPage}
            pageSize={5}
            total={filteredCrashes.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            showLessItems
          />
          </div>
        </div>
      </main>
    </>
  );
};

export default CrashList;
