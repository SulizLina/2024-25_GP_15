import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc, query, where } from 'firebase/firestore';
import EyeIcon from '../images/eye.png';
import { Table, Select } from 'antd';
import Header from './Header';
import { FaFilter } from 'react-icons/fa';
import s from "../css/ComplaintList.module.css"; // CSS module for ComplaintList
import '../css/CustomModal.css';

const ComplaintList = () => {
  const [motorcycles, setMotorcycles] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [selectedStatus, setSelectedStatus] = useState(''); // State for selected status
  const navigate = useNavigate();
  const [searchDate, setSearchDate] = useState('');

  const employerUID = sessionStorage.getItem('employerUID');

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

    return matchesStatus && matchesDate;
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
      title: 'Details',
      key: 'Details',
      align: 'center',
      render: (text, record) => (
        <Link to={`/complaint/general/${record.id}`}>
          <img style={{ cursor: 'pointer' }} src={EyeIcon} alt="Details" />
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
  <div className={s.selectWrapper}>
    <FaFilter className={s.filterIcon} />
    <select
  className={s.customSelect}
  onChange={event => setSelectedStatus(event.target.value)}
  defaultValue=""
>
  <option value="" disabled>
    Filter by Status
  </option>
  <option value="">All</option>
  <option value="Pending">Pending</option>
  <option value="Accepted">Accepted</option>
  <option value="Rejected">Rejected</option>
</select>
  </div>
</div>
              <div className={s.searchContainer}>
                <input
                  type="date"
                  value={searchDate}
                  className={s.dateInput}
                  onChange={(e) => setSearchDate(e.target.value)}
                  style={{ width: '120px', backgroundColor: 'transparent' }}
                />
              </div>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={filteredComplaints}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </div>
      </main>
    </>
  );
};

export default ComplaintList;