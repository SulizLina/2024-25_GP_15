import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa"; 
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";
import EyeIcon from "../images/eye.png";
import f from "../css/ComplaintList.module.css"; // CSS module for ComplaintList
import { Table, Tooltip  } from "antd";
import Header from "./Header";
import { Button, Modal, Select,} from "antd";
import { Pagination } from "antd";
import s from "../css/Violations.module.css";
import "../css/CustomModal.css";
import X from "../images/redx.webp";
import { FaFilter } from "react-icons/fa";

const ViolationList = () => {
  const [motorcycles, setMotorcycles] = useState({});
  const [violations, setViolations] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const navigate = useNavigate();
  const { Option } = Select; // Destructure Option from Select
  const [showDropdown, setShowDropdown] = useState(false);
  const [filters, setFilters] = useState({
    type: [],
    status: [],
  });
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedValues, setSelectedValues] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
  const employerUID = sessionStorage.getItem("employerUID");
    const options = [
      { value: "Reckless Violations", label: "Reckless Violations" },
      { value: "Regular Violations", label: "Regular Violations" },
      { value: "Active", label: "Active" },
      { value: "Revoked", label: "Revoked" },
    ];
    const [viewedViolations, setViewedViolations] = useState(() => {
      const storedViewedViolations = localStorage.getItem("viewedViolations");
      return storedViewedViolations ? JSON.parse(storedViewedViolations) : {};
  });

  const [violationTypeFilter, setViolationTypeFilter] = useState("");
  const [complaints, setComplaints] = useState({});
  useEffect(() => {
    const fetchEmployerDrivers = async () => {
      if (employerUID) {
        const employerDoc = await getDoc(doc(db, "Employer", employerUID));
        if (employerDoc.exists()) {
          const companyName = employerDoc.data().CompanyName;
          fetchDrivers(companyName);
        } else {
          console.error("No such employer!");
        }
      }
    };

    fetchEmployerDrivers();
  }, [employerUID]);
  const handleViewViolations = () => {
    if (violations.length > 0) {
      navigate(`/ricklessdrives`); // Navigate to the first violation
    } else {
      setIsPopupVisible(true); // Show popup if no violation exist
    }
  };
  const fetchDrivers = (companyName) => {
    const driverCollection = query(
      collection(db, "Driver"),
      where("CompanyName", "==", companyName)
    );

    const unsubscribe = onSnapshot(driverCollection, (snapshot) => {
      const driverMap = {};
      const driverIDs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        driverMap[data.DriverID] = `${data.Fname} ${data.Lname}`;
        driverIDs.push(data.DriverID);
      });
      setDrivers(driverMap);
      if (driverIDs.length > 0) {
        fetchViolations(driverIDs);
      } else {
        setViolations([]);
      }
    });

    return () => unsubscribe();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const fetchMotorcycles = (violationIDs) => {
    const motorcycleCollection = query(
      collection(db, "History"),
      where("ID", "in", violationIDs) // Matching by violationID
    );

    const unsubscribe = onSnapshot(motorcycleCollection, (snapshot) => {
      const motorcycleMap = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Fetched Motorcycle Data:", data); // Log fetched motorcycle data
        motorcycleMap[data.ID] = data.LicensePlate; // Map ID to License Plate
      });
      console.log("Motorcycle Map:", motorcycleMap); // Log the entire motorcycle map
      setMotorcycles(motorcycleMap);
    });

    return () => unsubscribe();
  };

  
  const fetchViolations = (driverIDs) => {
    const violationCollection = query(
      collection(db, "Violation"),
      where("driverID", "in", driverIDs)
    );
  
    const unsubscribe = onSnapshot(violationCollection, async (snapshot) => {
      const violationList = snapshot.docs.map((doc) => {
        const data = doc.data();
        const isReckless = data.count30 > 0 || data.count50 > 0;
        return {
          id: doc.id, // Document ID
          violationID: data.violationID, // Store the ViolationID for later use
          ...data,
          isReckless,
        };
      });
  
      setViolations(violationList);
  
      if (violationList.length > 0) {
        const violationIDs = violationList.map((v) => v.violationID); // Use ViolationID for complaints
        fetchMotorcycles(violationIDs);
        const complaintsData = await fetchComplaints(violationIDs);
        setComplaints(complaintsData); // Set complaints state
      } else {
        setMotorcycles({});
      }
    });
  
    return () => unsubscribe();
  };

  // Function to format the date
  const formatDate = (time) => {
    const date = new Date(time * 1000); // Assuming timestamp is in seconds
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    const day = date.getDate().toString().padStart(2, "0"); // Days are 1-based
    return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
  };
  // Filtering violations
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleSelect = (value) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];

    setSelectedValues(newSelection);
    const newType = newSelection.filter(val => val === "Reckless Violations" || val === "Regular Violations");
    const newStatus = newSelection.filter(val => val === "Active" || val === "Revoked");
    setFilters({ type: newType, status: newStatus });
  };

  const filteredViolations = violations
  .filter((violation) => {
    const driverName = drivers[violation.driverID] || "";
    const licensePlate = motorcycles[violation.violationID] || ' ';
    
    // Format the violation date using formatDate
    const violationDate = violation.time ? formatDate(violation.time) : "";

    // Format searchDate to MM/DD/YYYY
    const formattedSearchDate = searchDate ? formatDate(new Date(searchDate).getTime() / 1000) : "";

    // Check if searchQuery matches driverName, licensePlate, violationID, or driverID
    const matchesSearchQuery = driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               violation.violationID.toString().includes(searchQuery.toLowerCase()) || // Check violation ID
                               violation.driverID.toString().includes(searchQuery.toLowerCase()); // Check driver ID

    const matchesSearchDate = formattedSearchDate ? violationDate === formattedSearchDate : true;

    const matchesTypeFilter = filters.type.length === 0 ||
      (filters.type.includes("Reckless Violations") && violation.isReckless) ||
      (filters.type.includes("Regular Violations") && !violation.isReckless);

    const matchesStatusFilter = filters.status.length === 0 ||
      filters.status.includes(violation.Status);

    console.log(`Checking violation: ${violation.id} - Status: ${violation.Status}, 
                 Matches Status Filter: ${matchesStatusFilter}, 
                 Matches Search Query: ${matchesSearchQuery}, 
                 Matches Search Date: ${matchesSearchDate}, 
                 Violation Date: ${violationDate}, 
                 Search Date: ${formattedSearchDate}`);

    return matchesSearchQuery && matchesSearchDate && matchesTypeFilter && matchesStatusFilter;
  })
  .sort((a, b) => (b.time || 0) - (a.time || 0));



  const handleViewDetails = (record) => {
    const updatedViewedViolations = { ...viewedViolations, [record.id]: true };
    setViewedViolations(updatedViewedViolations);
    localStorage.setItem("viewedViolations", JSON.stringify(updatedViewedViolations));
};

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const fetchComplaints = async (violationIDs) => {
    const complaintCollection = query(
      collection(db, "Complaint"),
      where("ViolationID", "in", violationIDs) // Use ViolationID to fetch complaints
    );
  
    const complaintSnapshot = await getDocs(complaintCollection);
    const complaintMap = {};
  
    complaintSnapshot.forEach((doc) => {
      const data = doc.data();
      complaintMap[data.ViolationID] = {
        ...data,
        id: doc.id, // Store the document ID
      }; 
    });
  
    return complaintMap; // Return the complaint map
  };

  const columns = [
    {
      title: "Violation ID",
      dataIndex: "violationID",
      key: "violationID",
      align: "center",
    },
    {
      title: "Driver Name",
      key: "driverName",
      align: "center",
      width: 145,
      render: (text, record) => {
        const driverName = drivers[record.driverID] || "";
        return capitalizeFirstLetter(driverName);
      },
    },
    {
      title: "Motorcycle License Plate",
      key: "motorcyclePlate",
      align: "center",
      width: 199,
      render: (text, record) => motorcycles[record.violationID] || "   ", // Use violationID for lookup
    },
    {
      title: "Speed",
      dataIndex: "driverSpeed",
      key: "driverSpeed",
      align: "center",
    },
    {
      title: "Type",
      dataIndex: "violationType",
      key: "violationType",
      align: "center",
      width: 150,
      render: (text, record) =>
        record.isReckless ? "Reckless Violation" : "Regular Violation",
    },
    {
      title: "Status",
      dataIndex: "Status",
      key: "Status",
      align: "center",
      render: (text, record) => (
        <span style={{ color: record.Status === "Active" ? 'green' : 'red' }}>
          {record.Status}
        </span>
      ),    
    },
    {
      title: "Date",
      key: "date",
      align: "center",
      render: (text, record) => formatDate(record.time),
    },
       {
        title: "Violation Details",
        key: "Details",
        align: "center",
        render: (text, record) => (
            <Link to={`/violation/general/${record.id}`} onClick={() => handleViewDetails(record)}>
                <FaEye
                    style={{
                        cursor: "pointer",
                        color: "#059855", // Set color to match your theme
                        fontSize: "24px", // Adjust size as needed
                    }}
                />
            </Link>
        ),
    },
    {
      title: "Complaint Details",
      key: "complaint",
      align: "center",
      render: (text, record) => {
        const complaint = complaints[record.violationID]; // Access complaint data by ViolationID
        
        return (
          <span>
            {complaint ? (
              <Link to={`/complaint/general/${complaint.id}`} state={{ from: "ViolationList", violationId: record.violationID }}>
                <FaEye
                  style={{
                    cursor: "pointer",
                    color: "#059855",
                    opacity: 1,
                  }}
                />
              </Link>
            ) : (
              <Tooltip
              title="No complaint for this violation"
              overlayInnerStyle={{ backgroundColor: 'rgba(5, 152, 85, 0.7)', color: 'white' }}  >
                <FaEye
                  style={{
                    cursor: "not-allowed",
                    color: "grey",
                    opacity: 0.5,
                  }}
                />
              </Tooltip>
            )}
          </span>
        );
      },
    }
];

  

  return (
    <>
      <Header active="violations" />
      <div className="breadcrumb">
        <a onClick={() => navigate("/employer-home")}>Home</a>
        <span> / </span>
        <a onClick={() => navigate("/violations")}>Violations List</a>
      </div>
      <main>
        <div className={s.container}>
          <div className={s.searchHeader}>
            <h2 className={s.title}>Violations List</h2>
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
                  placeholder="Search by Violation ID, Driver Name or License Plate"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "322px" }}
                />
              </div>
               <div className={s.searchContainer} >
                 <div className={`${s.selectWrapper} ${s.dropdownContainer}`} style={{  width: '300px' }}>
                   <FaFilter className={s.filterIcon} />
                   <div style={{ position: 'relative', width: '510px'}}>
                     <div
                       onClick={toggleDropdown}
                       style={{
                         padding: '8px',
                         backgroundColor: 'transparent', // Make background transparent
                         cursor: 'pointer',
                         borderRadius: '4px',
                         transition: 'border 0.3s',
                         color: 'grey', // Set text color to grey
                         lineHeight: '1.0', 
                         fontSize:'14px',
                       }}
                     >
                     {selectedValues.length > 0 ? selectedValues.join(', ') : 'Filter violations'}
                     
 
                     </div>
                     {dropdownOpen && (
                 <div
                   style={{
                     position: 'absolute',
                     background: 'white',
                     border: '1px solid #ccc',
                     borderRadius: '4px',
                     zIndex: 1000,
                     width: '350px', // Set a wider width for the dropdown
                     left: '-40px', // Adjust this value to move the dropdown left
               
                   }}
                 >
                   <div style={{ padding: '10px', fontWeight: 'bold' }}>Type</div>
                   {options.filter(option => option.value === "Reckless Violations" || option.value === "Regular Violations").map((option) => (
                     <div key={option.value} style={{ padding: '10px', cursor: 'pointer' }}>
                       <label style={{ display: 'flex', alignItems: 'center' }}>
                         <input
                           type="checkbox"
                           checked={selectedValues.includes(option.value)}
                           onChange={() => handleSelect(option.value)}
                           style={{ marginRight: '10px' }} // Space between checkbox and text
                         />
                         {option.label}
                       </label>
                     </div>
                   ))}
                   <div style={{ padding: '10px', fontWeight: 'bold' }}>Status</div>
                   {options.filter(option => option.value === "Active" || option.value === "Revoked").map((option) => (
                     <div key={option.value} style={{ padding: '10px', cursor: 'pointer' }}>
                       <label style={{ display: 'flex', alignItems: 'center' }}>
                         <input
                           type="checkbox"
                           checked={selectedValues.includes(option.value)}
                           onChange={() => handleSelect(option.value)}
                           style={{ marginRight: '10px' }} // Space between checkbox and text
                         />
                         {option.label}
                       </label>
                     </div>
                   ))}
                   {/* Reset Button */}
                   <div style={{ padding: '10px', textAlign: 'center' }}>
                     <button
                       onClick={() => {
                         setSelectedValues([]); // Reset selected values
                         setFilters({ type: [], status: [] }); // Reset filters
                         toggleDropdown(); // Optionally close the dropdown
                       }}
                       style={{
                         backgroundColor: 'transparent',
                         color: 'blue',
                         border: 'none',
                         borderRadius: '4px',
                         padding: '8px 0', // Adjust padding for better appearance
                         cursor: 'pointer',
                         width: '100%', 
                         textAlign:'left',
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
               <div
  className={s.searchContainerdate}
  style={{ position: "relative" }}
>
  <div>
    {/* Conditional rendering for the green circle with tick */}
    {searchDate && (
      <div style={{
        position: "absolute",
        top: "-1px",  // Adjust to position it higher
        right: "-1px",  // Adjust to position it to the right
        width: "16px",  // Smaller size for better fit
        height: "16px", // Smaller size for better fit
        borderRadius: "50%",
        backgroundColor: "#059855",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontSize: "12px", // Slightly smaller font size
        zIndex: 1, // Ensure it appears in front

      }}>
        ✓ 
      </div>
    )}

    <svg
      onClick={() => document.getElementById("date-input").focus()}
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
                          </div>
                        </div>

                        <Table
    columns={columns}
    dataSource={filteredViolations.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
    rowKey="id"
    pagination={false}
    onRow={(record) => ({
        style: {
            backgroundColor: viewedViolations[record.id] ? 'transparent' : '#d0e0d0',
        },
    })}
/>
        

          {/* Flex container for button and pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
            }}
          >
            <Button
              onClick={handleViewViolations}
              style={{
                width: "auto",
                height: "60px",
                fontSize: "15px",
                color: "#059855",
                borderColor: "#059855",
              }}
            >
              <i className="fas fa-eye" style={{ marginRight: "8px" }}></i>
              View Reckless Drivers
            </Button>

          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredViolations.length}
            onChange={handlePageChange}
            style={{ marginTop: "16px", textAlign: "right" }} // Align pagination to the right
          />
          </div>

          {/* Popup for no violations */}
          <Modal
            title={null}
            visible={isPopupVisible}
            onCancel={() => setIsPopupVisible(false)}
            footer={
              <p style={{ textAlign: "center" }}>
                There are no drivers with reckless violations.
              </p>
            }
            style={{ top: "38%" }}
            className="custom-modal"
            closeIcon={<span className="custom-modal-close-icon">×</span>}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <img
                src={X}
                alt="No Reckless Drivers"
                style={{ width: "20%", marginBottom: "16px" }}
              />
            </div>
          </Modal>
        </div>
      </main>
    </>
  );
};

export default ViolationList;
