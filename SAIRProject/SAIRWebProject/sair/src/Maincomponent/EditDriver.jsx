import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, query, collection, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Form, Input, Button, notification, Card, Row, Col, Select, Menu, Dropdown } from 'antd';

import successImage from '../images/Sucess.png';
import errorImage from '../images/Error.png';
import SAIRLogo from '../images/SAIRlogo.png';
import logoutIcon from '../images/logout.png';
import { UserOutlined, DownOutlined } from '@ant-design/icons';
import Header from './Header';

const EditDriver = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [driverData, setDriverData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableMotorcycles, setAvailableMotorcycles] = useState([]);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [originalDriverID, setOriginalDriverID] = useState('');
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState('');
  const timerRef = useRef(null); // Ref to store the timer ID
  const [companyName, setCompanyName] = useState('');
  const [phoneValidationMessage, setPhoneValidationMessage] = useState('');

  const employerUID = sessionStorage.getItem('employerUID');
  // Fetch the driver's data based on driverId
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const driverDocRef = doc(db, 'Driver', driverId);
        const driverDoc = await getDoc(driverDocRef);
        if (driverDoc.exists()) {
          const driverData = driverDoc.data();

          const companyName = await fetchCompanyName(employerUID);

          setDriverData({
            ...driverData,
            CompanyName: companyName // Include CompanyName
          });

          setOriginalDriverID(driverData.DriverID); // Store original Driver ID
          setOriginalPhoneNumber(driverData.PhoneNumber.slice(4)); // Store original Phone Number (without +966)

          // Fetch available motorcycles after driver data is set
          fetchAvailableMotorcycles(companyName);
        } else {
          notification.error({ message: 'Driver not found' });
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
        notification.error({ message: 'Error fetching driver data.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverData();
  }, [driverId]);

  // Function to fetch company name based on employerUID
  const fetchCompanyName = async (employerUID) => {
    try {
      const companyDocRef = doc(db, 'Employer', employerUID);
      const companyDoc = await getDoc(companyDocRef);
      if (companyDoc.exists()) {
        const data = companyDoc.data();
        return data.CompanyName; // Return the CompanyName field
      } else {
        console.error('No such document!');
        return '';
      }
    } catch (error) {
      console.error('Error fetching company name:', error);
      return '';
    }
  };

  // Fetch available motorcycles based on company name
  const fetchAvailableMotorcycles = async (companyName) => {
    try {
      const motorcycleQuery = query(
        collection(db, 'Motorcycle'),
        where('CompanyName', '==', companyName),
        where('available', '==', true)
      );

      onSnapshot(motorcycleQuery, (snapshot) => {
        const bikes = snapshot.docs.map((doc) => ({
          id: doc.id,
          GPSnumber: doc.data().GPSnumber,
        }));
        setAvailableMotorcycles(bikes);
      });
    } catch (error) {
      console.error('Error fetching motorcycles:', error);
    }
  };

  // Show notification function
  const showNotification = (message, success) => {
    setNotificationMessage(message);
    setIsSuccess(success);
    setIsNotificationVisible(true);
    setTimeout(() => {
      setIsNotificationVisible(false);
    }, 2000); // Hide after 5 seconds
  };

  // Handle driver update
  const handleUpdateDriver = async (values) => {
    try {
      // Check if the new DriverID exists
      if (values.DriverID !== originalDriverID) {
        const driverIdExists = await checkIfDriverIdExists(values.DriverID);
        if (driverIdExists) {
          showNotification('Driver ID already exists.', false);
          return;
        }

        // Update associated violations if DriverID has changed
        await updateViolations(originalDriverID, values.DriverID);
      }

      // New phone number with prefix
      const newPhoneNumber = `+966${values.PhoneNumber}`;

      // Only check for duplication if the phone number has changed
      if (newPhoneNumber !== originalPhoneNumber) {
        const phoneNumberExists = await checkIfPhoneNumberExists(values.PhoneNumber);
        if (phoneNumberExists) {
          showNotification('Phone number already exists.', false);
          return;
        }
      }

      const driverDocRef = doc(db, 'Driver', driverId);
      const updatedData = {
        ...driverData,
        ...values,
        CompanyName: driverData.CompanyName,
        available: values.GPSnumber === null, // Set available based on GPS selection
        PhoneNumber: values.PhoneNumber.startsWith('+966') ? values.PhoneNumber : `+966${values.PhoneNumber}`,
        GPSnumber: values.GPSnumber // Set GPSnumber to null if "None" is selected
      };

      // Update the driver document
      await setDoc(driverDocRef, updatedData);

      // Update the motorcycle
      if (!values.GPSnumber) {
        // If a motorcycle is selected
        const motorcycleQuery = query(
          collection(db, 'Motorcycle'),
          where('GPSnumber', '==', values.GPSnumber)
        );
        const querySnapshot = await getDocs(motorcycleQuery);

        if (!querySnapshot.empty) {
          const motorcycleDocRef = querySnapshot.docs[0].ref; // Get the document reference
          // Update the DriverID and available fields in the motorcycle document
          await setDoc(motorcycleDocRef, {
            DriverID: values.DriverID,
            available: false // Set motorcycle's available field to false
          }, { merge: true });
        } else {
          console.error(`No motorcycle found with GPS number: ${values.GPSnumber}`);
        }
      } else {
        // If "None" is selected, update the corresponding motorcycle to set DriverID to null and available to true
        if (driverData.GPSnumber) { // Check if there was a previous GPS number
          const motorcycleQuery = query(
            collection(db, 'Motorcycle'),
            where('GPSnumber', '==', driverData.GPSnumber)
          );
          const querySnapshot = await getDocs(motorcycleQuery);

          if (!querySnapshot.empty) {
            const motorcycleDocRef = querySnapshot.docs[0].ref; // Get the document reference
            // Update the DriverID and available fields in the motorcycle document
            await setDoc(motorcycleDocRef, {
              DriverID: null, // Set DriverID to null
              available: true // Set motorcycle's available field to true
            }, { merge: true });
          } else {
            console.error(`No motorcycle found with GPS number: ${driverData.GPSnumber}`);
          }
        }
      }

      // Show success notification
      showNotification("Driver updated successfully!", true);
      // Redirect to Driver List after 2 seconds
      if (timerRef.current) clearTimeout(timerRef.current); // Clear any existing timer
      timerRef.current = setTimeout(() => {
        navigate('/driverslist');
      }, 2000); // 2 seconds

    } catch (error) {
      console.error('Error updating driver:', error);
      showNotification(`Error updating driver: ${error.message}`, false);
    }
  };

  // Function to update violations when DriverID changes
  const updateViolations = async (oldDriverID, newDriverID) => {
    const violationCollection = collection(db, 'Violation');
    const violationQuery = query(violationCollection, where('driverID', '==', oldDriverID));

    const querySnapshot = await getDocs(violationQuery);
    const updatePromises = querySnapshot.docs.map(doc => {
      const violationRef = doc.ref;
      return setDoc(violationRef, { driverID: newDriverID }, { merge: true });
    });

    await Promise.all(updatePromises);
    console.log(`Updated driverID from ${oldDriverID} to ${newDriverID} in violations.`);
  };

  // Function to check if DriverID exists
  const checkIfDriverIdExists = async (driverId) => {
    const driverQuery = query(
      collection(db, 'Driver'),
      where('DriverID', '==', driverId)
    );
    const querySnapshot = await getDocs(driverQuery);
    return !querySnapshot.empty; // Returns true if exists
  };

  // Function to check if PhoneNumber exists
  const checkIfPhoneNumberExists = async (phoneNumber) => {
    const phoneQuery = query(
      collection(db, 'Driver'),
      where('PhoneNumber', '==', `+966${phoneNumber}`)
    );
    const querySnapshot = await getDocs(phoneQuery);
    return !querySnapshot.empty; // Returns true if exists
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/'); // Redirect to login page
    }).catch((error) => {
      console.error('Error LOGGING out:', error);
    });
  };

  // Effect to fetch company name on component mount
  useEffect(() => {
    const getCompanyName = async () => {
      const name = await fetchCompanyName(employerUID);
      setCompanyName(name); // Store the fetched name in state
    };
    getCompanyName();
  }, [employerUID]);


  const menu = (
    <Menu style={{ fontSize: '15px' }}>
      <Menu.Item key="profile" onClick={() => navigate('/employee-profile')}>
        Profile
      </Menu.Item>
      <Menu.Item key="logout" onClick={() => { auth.signOut(); navigate('/'); }} style={{ color: 'red' }}>
        Logout
      </Menu.Item>
    </Menu>
  );


  return (
    <div className="Header">
     
      <Header active="driverslist" />
      
      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/driverslist')}>Driver List</a>
        <span> / </span>
        <a onClick={() => navigate(`/edit-driver/${driverId}`)}>Edit Driver</a>
      </div>
      <div>
        <div className="driver-list-header-container">
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center' 
        }}>
          <Card style={{ width: '900px', height: 'auto' }}>
            <h2 className='title'>Edit Driver</h2>
            {isLoading ? (
              <p>   </p>
            ) : (
              <Form
                layout="vertical"
                onFinish={handleUpdateDriver}
                initialValues={driverData}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  marginBottom: '20px',
                  fontFamily: 'Open Sans',
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={
                        <span style={{
                          display: 'block',
                          marginBottom: '5px',
                          fontWeight: 'bold',
                          color: '#059855',
                          fontFamily: 'Open Sans',
                          fontSize: '16px'
                        }}>
                          First Name
                        </span>
                      }
                      name="Fname"
                      rules={[{ required: true, message: 'First name is required.' }]}
                    >
                      <Input style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #059855',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={
                        <span style={{
                          display: 'block',
                          marginBottom: '5px',
                          fontWeight: 'bold',
                          color: '#059855',
                          fontFamily: 'Open Sans',
                          fontSize: '16px'
                        }}>
                          Last Name
                        </span>
                      }
                      name="Lname"
                      rules={[{ required: true, message: 'Last name is required.' }]}
                    >
                      <Input style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #059855',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={
                        <span style={{
                          display: 'block',
                          marginBottom: '5px',
                          fontWeight: 'bold',
                          color: '#059855',
                          fontFamily: 'Open Sans',
                          fontSize: '16px'
                        }}>
                          Phone Number
                        </span>
                      }
                      name="PhoneNumber"
                      rules={[{ required: true, message: 'Phone Number is required.' },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve(); // Skip if not required
                          // Validate that the phone number starts with '5' and is 9 digits long
                          if (!/^5\d{8}$/.test(value)) {
                            return Promise.reject(new Error('Phone number must start with 5 and be 9 digits long.'));
                          }
                          return Promise.resolve();
                        }
                      }
                      ]} // Keep required rule
                    >
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#000',
                          fontSize: '14px',
                          padding: '8px',
                          fontFamily: 'Open Sans',
                          pointerEvents: 'none',
                          zIndex: 1
                        }}>
                          +966
                        </span>
                        <Input
                          maxLength={9}  // Only allow 9 digits (after +966)
                          style={{
                            width: '100%',
                            paddingLeft: '50px', // Leave space for +966
                            border: '1px solid #059855',
                            borderRadius: '8px',
                            fontSize: '14px',
                            transition: 'border-color 0.3s ease-in-out',
                            fontFamily: 'Open Sans',
                            height: '43px',
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#1c7a50'}
                          onBlur={(e) => e.target.style.borderColor = '#059855'}
                          defaultValue={driverData.PhoneNumber ? driverData.PhoneNumber.slice(4) : ''}
                        />
                      </div>
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      label={
                        <span style={{
                          display: 'block',
                          marginBottom: '5px',
                          fontWeight: 'bold',
                          color: '#059855',
                          fontFamily: 'Open Sans',
                          fontSize: '16px'
                        }}>
                          Email
                        </span>
                      }
                      name="Email"
                      rules={[{ required: true, message: 'Email is required.' }]}
                    >
                      <Input style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #059855',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }} disabled />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={
                        <span style={{
                          display: 'block',
                          marginBottom: '5px',
                          fontWeight: 'bold',
                          color: '#059855',
                          fontFamily: 'Open Sans',
                          fontSize: '16px'
                        }}>
                          Driver ID (National ID / Residency Number)
                        </span>
                      }
                      name="DriverID"
                      rules={[{ required: true, message: 'Driver ID is required.' }]}
                    >
                      <Input maxLength={10}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #059855',
                          borderRadius: '8px',
                          fontSize: '14px',
                        }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={
                        <span style={{
                          display: 'block',
                          marginBottom: '5px',
                          fontWeight: 'bold',
                          color: '#059855',
                          fontFamily: 'Open Sans',
                          fontSize: '16px'
                        }}>
                          GPS Number
                        </span>
                      }
                      name="GPSnumber"
                      rules={[{ required: true, message: 'GPS number is required or You can choose None.' }]}
                    >
                      <Select
                        placeholder="Select a motorcycle"
                        style={{
                          width: '100%',
                          height: '45px',
                          border: '0.5px solid #059855',
                          borderRadius: '8px',
                          fontSize: '14px',
                          transition: 'border-color',
                          fontFamily: 'Open Sans',
                        }}
                        dropdownStyle={{
                          boxShadow: 'none',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#1c7a50'} // Darker green on focus
                        onBlur={(e) => e.target.style.borderColor = '#059855'} // Revert border color
                      >
                        <Select.Option value={null}>None</Select.Option>
                        {availableMotorcycles.map((item) => (
                          <Select.Option key={item.id} value={item.GPSnumber}>
                            {item.GPSnumber}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button style={{ backgroundColor: "#059855" }} type="primary" htmlType="submit">
                    Update Driver
                  </Button>
                </Form.Item>
              </Form>
            )}
          </Card>
        </div>
        {isNotificationVisible && (
          <div className={`notification-popup ${isSuccess ? 'success' : 'error'}`}>
            <span className="close-popup-btn" onClick={() => setIsNotificationVisible(false)}>&times;</span>
            <img src={isSuccess ? successImage : errorImage} alt={isSuccess ? 'Success' : 'Error'} />
            <p>{notificationMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditDriver;