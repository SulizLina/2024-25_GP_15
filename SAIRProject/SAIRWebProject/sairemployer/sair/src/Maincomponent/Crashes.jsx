import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc, query, where } from 'firebase/firestore';
import EyeIcon from '../images/eye.png';
import { FaEye } from 'react-icons/fa';
import { Table,Pagination  } from 'antd';
import Header from './Header';
import s from "../css/CrashList.module.css"; // CSS module for CrashList
import '../css/CustomModal.css';

const CrashList = () => {
  const [motorcycles, setMotorcycles] = useState({});
  const [crashes, setCrashes] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [searchDriverID, setSearchDriverID] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(''); // Single search input
  const employerUID = sessionStorage.getItem('employerUID');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
 // State to track viewed crashes

 const [viewedCrashes, setViewedCrashes] = useState(() => {
  const storedViewedCrashes = localStorage.getItem('viewedCrashes');
  return storedViewedCrashes ? JSON.parse(storedViewedCrashes) : {};
});


  useEffect(() => {
    const fetchDriversAndCrashes = async () => {
      if (!employerUID) return;

  const employerDoc = await getDoc(doc(db, 'Employer', employerUID));
  if (!employerDoc.exists()) {
    console.error("No such employer!");
    return;
  }

  const companyName = employerDoc.data().CompanyName;
  if (!companyName) {
    console.error("No valid company name found.");
    return;
  }

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
  });

  return () => unsubscribeDrivers();
};

    const fetchCrashes = (driverIds) => {
      if (!driverIds || driverIds.length === 0) {
        console.error("Driver IDs are invalid.");
        return;
      }
    
      const crashCollection = query(
        collection(db, 'Crash'),
        where('driverID', 'in', driverIds)
      );
    
      const unsubscribeCrashes = onSnapshot(crashCollection, (snapshot) => {
        const crashList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
    
        console.log('Fetched Crashes:', crashList); // Debugging
    
        setCrashes(crashList);
        fetchMotorcycles(crashList);
      });
    
      return () => unsubscribeCrashes();
    };

    const fetchMotorcycles = (crashList) => {
      const crashIDs = crashList.map(crash => crash.crashID).filter(id => id); // Filter out undefined or null;
  
      if (!crashIDs || crashIDs.length === 0) {
        console.error("No valid Crash IDs found.");
        return;
      }
    
      const motorcycleCollection = query(
        collection(db, 'History'),
        where('ID', 'in', crashIDs) // Ensure this matches the ID field in History
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

    fetchDriversAndCrashes();
  }, [employerUID]);

  const filteredCrashes =  crashes.filter(crash => crash.Status === 'Emergency SOS'|| crash.Status === 'Denied') // Only include Rejected or Confirmed statuses
  .sort((a, b) => (b.time || 0) - (a.time || 0)) // Sort by time in descending order
  .filter((crash) => {
    const crashDate = crash.time ? new Date(crash.time * 1000).toISOString().split('T')[0] : '';
    const matchesSearchDate = searchDate ? crashDate === searchDate : true;

    const driverName = drivers[crash.driverID] || ' ';
      const licensePlate = motorcycles[crash.crashID] || ' '; // Use crashID to fetch motorcycle

      const matchesSearchQuery = 
        driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        licensePlate.toLowerCase().includes(searchQuery.toLowerCase());


      return matchesSearchQuery && matchesSearchDate;
    });

    const formatDate = (time) => {
      const date = new Date(time * 1000); // Assuming timestamp is in seconds
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
      const day = date.getDate().toString().padStart(2, '0'); // Days are 1-based
      return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
    };

    const handleViewDetails = (record) => {
      const updatedViewedCrashes = { ...viewedCrashes, [record.id]: true };
      setViewedCrashes(updatedViewedCrashes);
      localStorage.setItem('viewedCrashes', JSON.stringify(updatedViewedCrashes));
  
      navigate(`/crash/general/${record.id}`);
    };

  const columns = [
    {
      title: 'Crash ID',
      dataIndex: 'crashID',
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
      render: (text, record) => motorcycles[record.crashID] || '   ', // Use crashID to fetch motorcycle
    },
    {
      title: 'Status',
      key: 'Status',
      align: 'center',
      render: (text, record) => {
        const formattedStatus =
          record.Status
        return (
          <span
            style={{ color: formattedStatus === "Emergency SOS" ? "red" : "green" }}
          >
            {formattedStatus}
          </span>
        );
      },
    },
    {
      title: 'Date',
      key: 'date',
      align: 'center',
      render: (text, record) => formatDate(record.time),
    },
    {
      title: 'Crash Details',
      key: 'Details',
      align: 'center',
      render: (text, record) => (
        <Link to={`/crash/general/${record.id}`} onClick={() => handleViewDetails(record)}>
        <FaEye
          style={{ cursor: 'pointer', fontSize: '1.5em', color: '#059855' }} 
        />
      </Link>
      ),
    },
  ];

   // Paginate the filtered crashes
   const paginatedCrashes = filteredCrashes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
   
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
    return (
    <>
      <Header active="crashes" />
      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/crashes')}>Crashes List</a>
      </div>
      <main>
        <div className={s.container}>
          <div className={s.searchHeader}>
            <h2 className={s.title}>Crashes List</h2>
            <div className={s.searchInputs}>
              <div className={s.searchContainer}>
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="#059855" strokeLinecap="round" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by Driver Name or License Plate"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{  width: "250px", height:"20px"  }}
                />
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
s
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
            dataSource={paginatedCrashes} // Use paginated crashes
            rowKey="id"
            pagination={false} // Disable internal pagination
            onRow={(record) => ({
              style: {
                backgroundColor: !viewedCrashes[record.id] ? '#d0e0d0' : 'transparent',
              },
            })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredCrashes.length} // Set total items for pagination
              onChange={handlePageChange}
              showSizeChanger={false} // Hide the size changer if you don't want it
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default CrashList;