import React, { useEffect, useState } from 'react';
import { Link,useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Table } from 'antd';
import { db } from '../firebase';
import Header from './Header';
import s from "../css/VDriver.module.css";
import EyeIcon from '../images/eye.png';
import '../css/CustomModal.css';


const ViolationsTable = () => {
  const { driverId } = useParams(); // Get driverId from URL parameters
  const [violations, setViolations] = useState([]); // State for storing violations
  const [error, setError] = useState(null); // State for error messages
  const navigate = useNavigate(); // Hook to programmatically navigate

  useEffect(() => {
    const fetchViolations = () => {
      const violationsQuery = query(collection(db, 'Violation'), where('driverID', '==', driverId));

      const unsubscribe = onSnapshot(violationsQuery, (querySnapshot) => {
        const violationsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const sortedViolations = violationsList.sort((a, b) => {
          return (b.time || 0) - (a.time || 0);
                });

        setViolations(sortedViolations);
      }, (error) => {
        console.error('Error fetching violations:', error);
        setError('Failed to fetch violations.');
      });

      return () => unsubscribe();
    };

    fetchViolations();
  }, [driverId]);

  

  const columns = [
    {
      title: 'Violation ID',
      dataIndex: 'violationID',
      key: 'violationID',
      align: 'center',
    },
    {
      title: 'Street Speed',
      dataIndex: 'streetMaxSpeed',
      key: 'streetMaxSpeed',
      align: 'center',
    },
    {
      title: 'Motorcycle Speed',
      dataIndex: 'driverSpeed',
      key: 'driverSpeed',
      align: 'center',
    },
    {
      title: 'Violation Amount',
      dataIndex: 'price',
      key: 'price',
      align: 'center',
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      className:'svg',
      render: (_, record) => (
        <Link to={`/violation/detail/${record.id}`}
        state={{ from: 'driver' }}>
        <img style={{ cursor: 'pointer' }} src={EyeIcon} alt="Details" />
      </Link>
      ),
    },
  ];

  if (error) {
    return <div>{error}</div>; // Display error message if there's an error
  }

  return (
    <><Header active={"driverslist"} />

<div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/driverslist')}>Driver List</a>
        <span> / </span>
        <a onClick={() => navigate(`/driver-details/${driverId}`)}>Drivers Details</a>
        <span> / </span>
        <a onClick={() => navigate(`/drivers/:driverId/violations`)}>Violations List</a>
      </div>

    <div className={s.container}>
      <h2 className={s.title} >Violations for Driver ID: {driverId}</h2>
      <Table dataSource={violations} columns={columns} rowKey="id" />
    </div></>
  );
};

export default ViolationsTable;