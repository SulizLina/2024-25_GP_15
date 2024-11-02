import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SAIRLogo from '../images/SAIRlogo.png';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Dropdown, Menu } from 'antd';
import { UserOutlined, DownOutlined } from '@ant-design/icons';
import Header from './Header';

const ComplaintList = () => {
  const navigate = useNavigate();
  const [currentEmployerCompanyName, setCurrentEmployerCompanyName] = useState('');

  useEffect(() => {
    const fetchCompanyName = async () => {
      const employerUID = sessionStorage.getItem('employerUID');
      if (employerUID) {
        try {
          const userDocRef = doc(db, 'Employer', employerUID);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const employerData = docSnap.data();
            setCurrentEmployerCompanyName(employerData.CompanyName);
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error('Error fetching employer data:', error);
        }
      }
    };
    fetchCompanyName();
  }, []);

  const handleLogout = () => {
    auth.signOut()
      .then(() => navigate('/'))
      .catch((error) => console.error('Error LOGGING out:', error));
  };

  const menu = (
    <Menu style={{ fontSize: '15px' }}>
      <Menu.Item key="profile" onClick={() => navigate('/employee-profile')}>
        Profile
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout} style={{ color: 'red' }}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <div  >


      <Header active="complaints" />

      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/complaints')}>Complaints List</a>
      </div>

      <h1 style={{ color: 'gray', padding: '100px', textAlign: 'center', margin: 0 }}>
        This is a Complaints List page. It will be done at sprint 2
      </h1>
    </div>
  );
};

export default ComplaintList;