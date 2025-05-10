import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import {
  collection, doc, onSnapshot, deleteDoc, query, where, getDoc
} from 'firebase/firestore';
import TrashIcon from '../../images/Trash.png';
import PencilIcon from '../../images/pencil.png';
import EyeIcon from '../../images/eye.png';
import successImage from '../../images/Sucess.png';
import errorImage from '../../images/Error.png';
import { SearchOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { Button, Table, Modal } from 'antd';
import Header from './GDTHeader';
import '../../css/CustomModal.css';
import s from "../../css/DriverList.module.css";

const GDTStafflist = () => {
  const [staffData, setStaffData] = useState([]);
  const [staffToRemove, setStaffToRemove] = useState(null);
  const [isDeletePopupVisible, setIsDeletePopupVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(true);
  const [highlightedStaff, setHighlightedStaff] = useState([]);

  const navigate = useNavigate();

  const handleEditStaff = (staff) => {
    if (staff && staff.id) {
        navigate(`/gdteditstaff/${staff.id}`);
    } else {
        console.error("Staff ID is not available");
    }
};

  const columns = [
    {
      title: 'Staff ID',
      dataIndex: 'ID',
      key: 'ID',
      align: 'center',
    },
    {
      title: 'Name',
      dataIndex: 'Name',
      key: 'Name',
      align: 'center',
      render: (text, record) => `${record.Fname} ${record.Lname}`,
    },
    {
      title: 'Email',
      dataIndex: 'GDTEmail',
      key: 'GDTEmail',
      align: 'center',
      render: (email) => (
        <a href={`mailto:${email}`} style={{
          color: 'black', // Default color
          textDecoration: 'underline', // Underline the text
          transition: 'color 0.3s', // Smooth transition for color change
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'green')}
// Change color on hover
        onMouseLeave={(e) => (e.currentTarget.style.color = 'black')}
// Revert color on mouse leave
      >
          {email}
        </a>
      ),
    },
    {
      title: 'Phone Number',
      dataIndex: 'PhoneNumber',
      key: 'PhoneNumber',
      align: 'center',
    },
    {
      title: 'Actions',
      key: 'Actions',
      align: 'center',
      render: (text, record) => (
        <div>
          <img
            style={{ cursor: 'pointer', marginRight: 8 }}
            src={TrashIcon}
            alt="Delete"
            onClick={() => openDeleteConfirmation(record)}
          />
          <img
            style={{ cursor: 'pointer' }}
            src={PencilIcon}
            alt="Edit"
            onClick={() => handleEditStaff(record)}
          />
        </div>
      ),
    },
  ];

  const filteredData = staffData.filter(staff => {
    const fullName = `${staff.Fname} ${staff.Lname}`.toLowerCase();
    const staffID = String(staff.ID || '').toLowerCase(); // Convert to string and handle undefined or null
    const query = searchQuery.toLowerCase();

    // Check if staff matches the search query
    return staffID.includes(query) || fullName.includes(query);
});

  useEffect(() => {
    const fetchStaff = () => {
      const staffCollection = query(
        collection(db, 'GDT'),
        where('isAdmin', '==', false)
      );
      const unsubscribe = onSnapshot(staffCollection, (snapshot) => {
        const staffList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStaffData(staffList);
      });
      return () => unsubscribe();
    };

    fetchStaff();
}, []);


  const handleDeleteStaff = async (staffId) => {
    try {
      await deleteDoc(doc(db, 'GDT', staffId));
      setIsSuccess(true);
      setNotificationMessage('Staff deleted successfully!');
      setIsNotificationVisible(true);
      setTimeout(() => {
        navigate('/gdtstafflist');
      }, 2000);
    } catch (error) {
      console.error('Error deleting staff:', error);
      setIsSuccess(false);
      setNotificationMessage('Error deleting staff. Please try again.');
      setIsNotificationVisible(true);
    }
    setIsDeletePopupVisible(false);
  };

  const openDeleteConfirmation = (staff) => {
    setStaffToRemove(staff);
    setIsDeletePopupVisible(true);
  };

  const viewStaffDetails = (staffID) => {
    console.log('Navigating to details for staff ID:', staffID);
    navigate(`/staff-details/${staffID}`);
  };

  return (
    <div>
      <Header active="gdtstafflist" />

      <div className="breadcrumb" style={{ marginRight: '100px' }}>
        <a onClick={() => navigate('/gdthome')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/gdtstafflist')}>Staff List</a>
      </div>

      <main>
        <div className={s.container}>
          <h2 className={s.title}>Staff List</h2>

          <div className={s.searchInputs}>
            <div className={s.searchContainer}>
              <SearchOutlined style={{ color: '#059855' }} />
              <input
                type="text"
                placeholder="Search by Staff ID or Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "300px" }}
              />
            </div>
            <Button type="primary" className={s.addButton}
              onClick={() => navigate('/gdtaddstaff')}>
              <UsergroupAddOutlined />
              <span>Add Staff</span>
            </Button>
          </div>
        </div>

        <br />

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          style={{ width: '1200px', whiteSpace: 'nowrap', overflow:
'hidden', textOverflow: 'ellipsis', margin: '0 auto' }}
          onRow={(record) => ({
            style: {
              backgroundColor:
                sessionStorage.getItem(`staff_${record.id}`) ?
"#d0e0d0" : "transparent",
            },
          })}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          visible={isDeletePopupVisible}
          onCancel={() => setIsDeletePopupVisible(false)}
          title="Confirm Deletion"
          style={{ top: '38%' }}
          footer={[
            <Button key="no" onClick={() => setIsDeletePopupVisible(false)}>
              No
            </Button>,
            <Button key="yes" type="primary" danger onClick={() =>
handleDeleteStaff(staffToRemove.id)}>
              Yes
            </Button>,
          ]}
          className="custom-modal"
          closeIcon={
            <span className="custom-modal-close-icon">
              ×
            </span>
          }
        >
          <div>
            <p>Are you sure you want to delete {staffToRemove?.Fname}?</p>
          </div>
        </Modal>

        {/* Notification Modal */}
        <Modal
          visible={isNotificationVisible}
          onCancel={() => setIsNotificationVisible(false)}
          footer={<p style={{ textAlign: 'center' }}>{notificationMessage}</p>}
          style={{ top: '38%' }}
          className="custom-modal"
          closeIcon={
            <span className="custom-modal-close-icon">
              ×
            </span>
          }
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={isSuccess ? successImage : errorImage}
              alt={isSuccess ? 'Success' : 'Error'}
              style={{ width: '20%', marginBottom: '16px' }}
            />
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default GDTStafflist;