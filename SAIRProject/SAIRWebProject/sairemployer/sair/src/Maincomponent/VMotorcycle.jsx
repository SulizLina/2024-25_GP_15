import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Table } from 'antd';
import { db } from '../firebase';
import Header from './Header';
import s from "../css/VDriver.module.css";
import EyeIcon from '../images/eye.png';
import '../css/CustomModal.css';

const VMotorcycle  = () => {
  const { motorcycleId } = useParams(); // Get motorcycleId from URL parameters
  const [violations, setViolations] = useState([]); // State for storing violations
  const [error, setError] = useState(null); // State for error messages
  const navigate = useNavigate(); // Hook to programmatically navigate

  useEffect(() => {
    const fetchViolations = () => {
      const violationsQuery = query(collection(db, 'Violation'), where('GPSnumber', '==', motorcycleId));

      const unsubscribe = onSnapshot(violationsQuery, (querySnapshot) => {
        const violationsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
             // Sort violations from newest to oldest based on timestamp
             const sortedViolations = violationsList.sort((a, b) => {
              return (b.time || 0) - (a.time || 0); // Adjust 'time' to your actual field name
            });
        setViolations(sortedViolations);
      }, (error) => {
        console.error('Error fetching violations:', error);
        setError('Failed to fetch violations.');
      });

      return () => unsubscribe();
    };

    fetchViolations();
  }, [motorcycleId]);

  const columns = [
    {
      title: 'Violation ID',
      dataIndex: 'violationID',
      key: 'violationID',
      align: 'center',
    },
    {
      title: 'Driver ID',
      dataIndex: 'driverID',
      key: 'driverID',
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
      render: (_, record) => (
        <Link to={`/violation/detail/${record.id}`}
        state={{ from: 'motorcycle' }}>
          <img style={{ cursor: 'pointer' }} src={EyeIcon} alt="Details" />
        </Link>
      ),
    },
  ];

  if (error) {
    return <div>{error}</div>; // Display error message if there's an error
  }

  return (
    <>
      <Header active={"motorcycleslist"} />

      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/motorcycleslist')}>Motorcycles List</a>
        <span> / </span>
        <a onClick={() => navigate(`/motorcycle-details/${motorcycleId}`)}>Motorcycle Details</a>
        <span> / </span>
        <a>Violations List</a>
      </div>

      <div className={s.container}>
        <h2 className={s.title}>Violations for Motorcycle ID: {motorcycleId}</h2>
        <Table dataSource={violations} columns={columns} rowKey="id" />
      </div>
    </>
  );
};

export default VMotorcycle;