import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc, query, where } from 'firebase/firestore';
import EyeIcon from '../images/eye.png';
import { FaEye } from 'react-icons/fa';
import { Table, Select } from 'antd';
import Header from './Header';
import { FaFilter } from 'react-icons/fa';
import s from "../css/ComplaintList.module.css"; 
import '../css/CustomModal.css';
import c from "../css/CrashList.module.css";


const ComplaintList = () => {
  const [motorcycles, setMotorcycles] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [selectedStatus, setSelectedStatus] = useState(''); // State for selected status
  const navigate = useNavigate();
  const [searchDate, setSearchDate] = useState('');
  const [searchQuery, setSearchQuery] = useState("");

  const employerUID = sessionStorage.getItem('employerUID');

    // State to track viewed complaints
    const [viewedComplaints, setViewedComplaints] = useState(() => {
      const storedViewedComplaints = localStorage.getItem('viewedComplaints');
      return storedViewedComplaints ? JSON.parse(storedViewedComplaints) : {};
    });

  useEffect(() => {
    const fetchDriversAndComplaints = async () => {
      if (!employerUID) return;

      const employerDoc = await getDoc(doc(db, 'Employer', employerUID));
      if (!employerDoc.exists()) {
        console.error("No such employer!");
        return;
      }

      const companyName = employerDoc.data().CompanyName;

      // Fetch drivers for the company
      const driverCollection = query(
        collection(db, 'Driver'),
        where('CompanyName', '==', companyName)
      );

      const unsubscribeDrivers = onSnapshot(driverCollection, (snapshot) => {
        const driverIds = [];
        const driverMap = {};
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          driverIds.push(data.DriverID);
          driverMap[data.DriverID] = `${data.Fname} ${data.Lname}`; // Store driver names
        });
        
        setDrivers(driverMap); // Update state with driver names
        fetchComplaints(driverIds);
      });

      return () => unsubscribeDrivers();
    };

    const fetchComplaints = (driverIds) => {
      if (driverIds.length === 0) return;

      const complaintCollection = query(
        collection(db, 'Complaint'),
        where('driverID', 'in', driverIds)
      );

      const unsubscribeComplaints = onSnapshot(complaintCollection, (snapshot) => {
        const complaintList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setComplaints(complaintList);
        fetchMotorcycles(complaintList);
      });

      return () => unsubscribeComplaints();
    };

    const fetchMotorcycles = (complaintList) => {
      const violationIDs = complaintList.map(complaint => complaint.ViolationID); // Use ViolationID for fetching
      if (violationIDs.length === 0) return;

      const motorcycleCollection = query(
        collection(db, 'History'),
        where('ID', 'in', violationIDs) // Match ID from History with ViolationID
      );

      const unsubscribeMotorcycles = onSnapshot(motorcycleCollection, (snapshot) => {
        const motorcycleMap = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          motorcycleMap[data.ID] = data.LicensePlate; // Map ID to LicensePlate
        });
        setMotorcycles(motorcycleMap);
      });

      return () => unsubscribeMotorcycles();
    };

    fetchDriversAndComplaints();
  }, [employerUID]);

  const filteredComplaints = complaints
  .sort((a, b) => (b.DateTime?.seconds || 0) - (a.DateTime?.seconds || 0)) // Sort by DateTime in descending order
  .filter((complaint) => {
    const complaintDate = complaint.DateTime ? new Date(complaint.DateTime.seconds * 1000).toISOString().split('T')[0] : '';

    const matchesStatus = selectedStatus ? complaint.Status === selectedStatus : true;
    const matchesDate = searchDate ? complaintDate === searchDate : true;

    
    const driverId = complaint.driverID;
    const licensePlate = motorcycles[complaint.ViolationID] || " ";

    const matchesSearchQuery =
      driverId.includes(searchQuery) ||
      licensePlate.toLowerCase().includes(searchQuery.toLowerCase());


    return matchesStatus && matchesDate && matchesSearchQuery;
  });


  const columns = [
    {
      title: 'Complaint ID',
      dataIndex: 'ComplaintID',
      key: 'id',
      align: 'center',
    },
    {
      title: 'Driver Name',
      key: 'driverName',
      align: 'center',
      render: (text, record) => drivers[record.driverID] || '   ',
    },
    {
      title: 'Motorcycle License Plate',
      key: 'motorcyclePlate',
      align: 'center',
      render: (text, record) => motorcycles[record.ViolationID] || '   ',
    },
    {
      title: 'Status',
      key: 'Status',
      align: 'center',
      render: (text, record) => {
        const formattedStatus = record.Status.charAt(0).toUpperCase() + record.Status.slice(1).toLowerCase();
        const color = formattedStatus === 'Pending' ? 'orange' : (formattedStatus === 'Accepted' ? 'green' : 'red');
        return (
          <span style={{ color }}>
            {formattedStatus}
          </span>
        );
      },
    },
    {
      title: 'Date',
      key: 'date',
      align: 'center',
      render: (text, record) => 
        record.DateTime ? new Date(record.DateTime.seconds * 1000).toLocaleDateString() : '',
    },
    {
      title: 'Complaint Details',
      key: 'Details',
      align: 'center',
      render: (text, record) => (
        <Link to={`/complaint/general/${record.id}`}>
        <FaEye
          style={{ cursor: 'pointer', fontSize: '1.5em', color: '#059855' }} 
        />
                </Link>
      ),
    },
  ];

  return (
    <>
      <Header active="complaints" />
      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/complaints')}>Complaints List</a>
      </div>
      <main>
        <div className={s.container}>
          <div className={s.searchHeader}>
            <h2 className={s.title}>Complaints List</h2>
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
              
  <div className={s.searchContainer}>
  <div className={s.selectWrapper}>
    <FaFilter style={{ width: '26px' }} className={s.filterIcon} />
    <div style={{ position: 'relative', width: '280px' }}>
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'grey', // Grey color for selected status and placeholder
          pointerEvents: 'none', // Prevent clicking on the placeholder
          fontSize: '14px',
          zIndex: 1, // Ensure it appears above the select

        }}
      >
        {selectedStatus && selectedStatus !== "All" ? selectedStatus : 'Filter by Status'}
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
          left:'-37px',
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
          boxSizing: 'border-box', // Ensure padding is included in total height
          zIndex: 1,
        }}
      >
        <option value="" disabled hidden></option>
        <option value="All" style={{ color: 'black' }}>All</option>
        <option value="Accepted" style={{ color: 'black' }}>Accepted</option>
        <option value="Pending" style={{ color: 'black' }}>Pending</option>
        <option value="Rejected" style={{ color: 'black' }}>Rejected</option>
      </select>
      <div className={s.customArrow} style={{ 
        position: 'absolute', 
        top: '50%', 
        right: '10px', 
        transform: 'translateY(-50%)',
        color: '#1c7a50', // Arrow color
        fontSize: '14px' // Adjust size if needed
      }}>
        ▼
      </div>
    </div>
  </div>
</div>
<div
  className={c.searchContainerdate}
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

    {/* Your SVG Icon */}
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
            dataSource={filteredComplaints}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            onRow={(record) => ({
              style: {
                backgroundColor: !viewedComplaints[record.id] ? '#d0e0d0' : 'transparent',
              },
              onClick: () => {
                const updatedViewedComplaints = { ...viewedComplaints, [record.id]: true };
                setViewedComplaints(updatedViewedComplaints);
                localStorage.setItem('viewedComplaints', JSON.stringify(updatedViewedComplaints));
              },
            })}
          />
        </div>
      </main>
    </>
  );
};

export default ComplaintList;