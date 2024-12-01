import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc, query, where } from 'firebase/firestore';
import EyeIcon from '../images/eye.png';
import { Table } from 'antd';
import Header from './Header';
import s from "../css/Violations.module.css";
import '../css/CustomModal.css';

const ViolationList = () => {
  const [motorcycles, setMotorcycles] = useState({});
  const [violations, setViolations] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const navigate = useNavigate();
  const employerUID = sessionStorage.getItem('employerUID');

  useEffect(() => {
    const fetchEmployerDrivers = async () => {
      if (employerUID) {
        const employerDoc = await getDoc(doc(db, 'Employer', employerUID));
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

  const fetchDrivers = (companyName) => {
    const driverCollection = query(
      collection(db, 'Driver'),
      where('CompanyName', '==', companyName)
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

  const fetchMotorcycles = (violationIDs) => {
    const motorcycleCollection = query(
      collection(db, 'History'),
      where('ID', 'in', violationIDs) // Matching by violationID
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
      collection(db, 'Violation'),
      where('driverID', 'in', driverIDs)
    );

    const unsubscribe = onSnapshot(violationCollection, (snapshot) => {
      const violationList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setViolations(violationList);
      if (violationList.length > 0) {
        const violationIDs = violationList.map(v => v.violationID); // Collecting violation IDs
        fetchMotorcycles(violationIDs); // Fetch motorcycles using violation IDs
      } else {
        setMotorcycles({});
      }
    });

    return () => unsubscribe();
  };

  // Filtering violations
  const filteredViolations = violations.filter((violation) => {
    const driverName = drivers[violation.driverID] || '  ';
    const licensePlate = motorcycles[violation.violationID] || '  '; // Match with violationID

    console.log("Checking Violation:", violation);
    console.log("License Plate Found for Violation ID:", violation.violationID, "->", licensePlate);

    let violationDate = '';
    if (violation.time) {
      violationDate = new Date(violation.time * 1000).toISOString().split('T')[0];
    }

    const matchesSearchQuery = driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      licensePlate.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSearchDate = searchDate ? violationDate === searchDate : true;

    return matchesSearchQuery && matchesSearchDate;
  }).sort((a, b) => {
    // Sort by time in descending order (newest first)
    return (b.time || 0) - (a.time || 0);
  });

  const columns = [
    {
      title: 'Violation ID',
      dataIndex: 'violationID',
      key: 'violationID',
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
      render: (text, record) => motorcycles[record.violationID] || '   ', // Use violationID for lookup
    },
    {
      title: 'Speed',
      dataIndex: 'driverSpeed',
      key: 'driverSpeed',
      align: 'center',
    },
    {
      title: 'Details',
      key: 'Details',
      align: 'center',
      render: (text, record) => (
        <Link to={`/violation/general/${record.id}`}>
          <img style={{ cursor: 'pointer' }} src={EyeIcon} alt="Details" />
        </Link>
      ),
    },
  ];

  return (
    <>
      <Header active="violations" />
      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/violations')}>Violations List</a>
      </div>
      <main>
        <div className={s.container}>
          <div className={s.searchHeader}>
            <h2 className={s.title}>Violations List</h2>
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
                  style={{ width: '280px' }}
                />
              </div>
              <div className={s.searchContainer}>
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  style={{ width: '120px', backgroundColor: 'transparent' }} />
              </div>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={filteredViolations}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </div>
      </main>
    </>
  );
};

export default ViolationList;