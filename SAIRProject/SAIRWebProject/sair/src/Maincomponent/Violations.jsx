import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc, query, where } from 'firebase/firestore';
import EyeIcon from '../images/eye.png';
import { Table } from 'antd';
import Header from './Header';
import s from "../css/Violations.module.css";
// import '@fortawesome/fontawesome-free/css/all.min.css';

const ViolationList = () => {
  const [motorcycles, setMotorcycles] = useState([]);
  const [violations, setViolations] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const navigate = useNavigate();
  const employerUID = sessionStorage.getItem('employerUID');



  // Fetch Employer Company Name and Motorcycles
  useEffect(() => {
    // Fetch Violations Data
    const fetchViolations = (gpsNumbers) => {
      if (gpsNumbers.length === 0) return;

      const violationCollection = query(
        collection(db, 'Violation'),
        where('GPSnumber', 'in', gpsNumbers)
      );

      const unsubscribe = onSnapshot(violationCollection, (snapshot) => {
        const violationList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setViolations(violationList);
        fetchDrivers(violationList);
      });

      return () => unsubscribe();
    };

    const fetchEmployerCompanyName = async () => {
      if (employerUID) {
        const employerDoc = await getDoc(doc(db, 'Employer', employerUID));
        if (employerDoc.exists()) {
          fetchMotorcycles(employerDoc.data().CompanyName); // Pass company name directly
        } else {
          console.error("No such employer!");
        }
      }
    };

    const fetchMotorcycles = (companyName) => {
      const motorcycleCollection = query(
        collection(db, 'Motorcycle'),
        where('CompanyName', '==', companyName)
      );

      const unsubscribe = onSnapshot(motorcycleCollection, (snapshot) => {
        const motorcycleMap = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          motorcycleMap[data.GPSnumber] = data.LicensePlate;
        });
        setMotorcycles(motorcycleMap);
        const gpsNumbers = Object.keys(motorcycleMap);
        if (gpsNumbers.length > 0) {
          fetchViolations(gpsNumbers);
        } else {
          setViolations([]);
        }
      });

      return () => unsubscribe();
    };

    fetchEmployerCompanyName();
  }, [employerUID]);


  // Fetch Drivers Data
  const fetchDrivers = (violationList) => {
    const driverIDs = violationList.map(v => v.driverID);
    const driverCollection = collection(db, 'Driver');

    const unsubscribe = onSnapshot(driverCollection, (snapshot) => {
      const driverMap = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (driverIDs.includes(data.DriverID)) {
          driverMap[data.DriverID] = `${data.Fname} ${data.Lname}`;
        }
      });
      setDrivers(driverMap);
    });

    return () => unsubscribe();
  };

  // Filtering logic based on searchQuery and searchDate
  const filteredViolations = violations.filter((violation) => {
    const driverName = drivers[violation.driverID] || 'Unknown Driver';
    const licensePlate = motorcycles[violation.GPSnumber] || 'Unknown Plate';

    let violationDate = '';
    if (violation.time) {
      violationDate = new Date(violation.time * 1000).toISOString().split('T')[0];
    }
    const matchesSearchQuery = driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      licensePlate.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSearchDate = searchDate ? violationDate === searchDate : true;

    return matchesSearchQuery && matchesSearchDate;
  });

  const columns = [
    {
      title: 'Violation ID',
      dataIndex: 'violationID',
      key: 'id',
      align: 'center',
    },
    {
      title: 'Driver Name',
      key: 'driverName',
      align: 'center',
      render: (text, record) => drivers[record.driverID] || 'Unknown Driver',
    },
    {
      title: 'Motorcycle Licence Plate Number',
      key: 'motorcyclePlate',
      align: 'center',
      render: (text, record) => motorcycles[record.GPSnumber] || 'Unknown Plate',
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
          <div className={s.searchHeader}  >
            <h2 className={s.title}  >
              Violations List
            </h2>
            <div className={s.searchInputs}>
              <div className={s.searchContainer}>
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="#059855" strokeLinecap="round" strokeWidth="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by Driver Name or Plate Number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '280px' }}
                />
              </div>
              <div className={s.searchContainer} >
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