import React, { useEffect, useState } from 'react';
import { collection, addDoc, where, query, doc, getDoc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Ensure auth is imported
import { Form, Input, Button, Card, Row, Col, Select, Menu, Dropdown } from 'antd';
import { useNavigate } from 'react-router-dom';
import successImage from '../images/Sucess.png';
import errorImage from '../images/Error.png';
import SAIRLogo from '../images/SAIRlogo.png';
import logoutIcon from '../images/logout.png';
import { UserOutlined, DownOutlined } from '@ant-design/icons';
import Header from './Header';

const AddMotorcycle = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [Employer, setEmployer] = useState({ CompanyName: '' });
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  useEffect(() => {
    const employerUID = sessionStorage.getItem('employerUID');
    const fetchEmployer = async () => {
      const docRef = doc(db, 'Employer', employerUID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEmployer(data);
      }
    };
    fetchEmployer();
  }, []);

  const checkGPSExists = async (gpsNumber) => {
    const employerUID = sessionStorage.getItem('employerUID');

    // Fetch employer's company name
    const employerDocRef = doc(db, 'Employer', employerUID);
    const employerDocSnap = await getDoc(employerDocRef);

    if (!employerDocSnap.exists()) {
      return false; // If no employer found, return false
    }

    const { CompanyName } = employerDocSnap.data();

    // Check if the GPS number exists for the same company
    const q = query(
      collection(db, 'Motorcycle'),
      where('GPSnumber', '==', gpsNumber),
      where('CompanyName', '==', CompanyName) // Ensure it's for the same company
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // Returns true if GPS number exists for this company
  };

  const generateMotorcycleID = async (gpsNumber) => {
    let uniqueID = '';
    let isUnique = false;

    while (!isUnique) {
      const randomDigits = Math.floor(100 + Math.random() * 900).toString(); // Generates a random number between 100 and 999
      uniqueID = `${gpsNumber}${randomDigits}`; // Concatenates the GPS number with the random digits

      const q = query(collection(db, 'Motorcycle'), where('MotorcycleID', '==', uniqueID));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        isUnique = true; // If no existing IDs match, this ID is unique
      }
    }

    return uniqueID; // Returns the unique ID
  };

  const checkLicensePlateExists = async (licensePlate) => {
    const q = query(
      collection(db, 'Motorcycle'),
      where('LicensePlate', '==', licensePlate)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // Returns true if the license plate exists
  };

  const handleAddMotorcycle = async (values) => {
    try {
      // Check if the GPS number already exists for this company
      const gpsExists = await checkGPSExists(values.GPSnumber);
      if (gpsExists) {
        setIsSuccess(false);
        setNotificationMessage('The GPS Number you entered already exists.');
        setIsNotificationVisible(true);
        return; // Prevent further execution if GPS number exists
      }
      // Check if the license plate already exists
      const licensePlateExists = await checkLicensePlateExists(values.LicensePlate);
      if (licensePlateExists) {
        setIsSuccess(false);
        setNotificationMessage('The License Plate already exists.');
        setIsNotificationVisible(true);
        return; // Prevent further execution if license plate exists
      }

      // Proceed to generate unique Motorcycle ID
      const driverID = values.DriverID === "None" ? null : values.DriverID;
      const motorcycleID = await generateMotorcycleID(values.GPSnumber); // Generate unique ID
      const available = driverID === null;

      const motorcycleData = {
        ...values,
        MotorcycleID: motorcycleID,
        DriverID: driverID,
        CompanyName: Employer.CompanyName,
        available: available,
      };

      // Add the motorcycle to the Motorcycle collection
      await addDoc(collection(db, 'Motorcycle'), motorcycleData);

      // If a driver was selected, update their availability and GPSnumber
      if (driverID) {
        const q = query(
          collection(db, 'Driver'),
          where('DriverID', '==', driverID)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const driverDocRef = querySnapshot.docs[0].ref; // Get the document reference
          // Update the driver's document
          await updateDoc(driverDocRef, {
            available: false, // Set driver's available field to false
            GPSnumber: values.GPSnumber // Update GPSnumber with the motorcycle's GPS number
          });
        }
      }

      setIsSuccess(true);
      setNotificationMessage('Motorcycle added successfully.');
      setIsNotificationVisible(true);

      // Redirect to motorcycle list after 10 seconds
      setTimeout(() => {
        navigate('/motorcycleslist');
      }, 10000); // 10000 milliseconds = 10 seconds

    } catch (error) {
      console.error('Error adding motorcycle:', error);
      setIsSuccess(false);
      setNotificationMessage('Error adding motorcycle. Please try again.');
    } finally {
      setIsNotificationVisible(true);
    }
  };

  useEffect(() => {
    const fetchAvailableDrivers = async () => {
      const employerUID = sessionStorage.getItem('employerUID');
      const employerDocRef = doc(db, 'Employer', employerUID);
      const docSnap = await getDoc(employerDocRef);

      if (docSnap.exists()) {
        const { CompanyName } = docSnap.data();
        const dq = query(collection(db, 'Driver'), where('CompanyName', '==', CompanyName), where('available', '==', true));

        const unsubscribe = onSnapshot(dq, (drivers) => {
          const driverOptions = drivers.docs.map((doc) => {
            const driverData = doc.data();
            return { value: driverData.DriverID, label: driverData.DriverID };
          });
          setAvailableDrivers(driverOptions);
        });

        return () => unsubscribe();
      }
    };

    fetchAvailableDrivers();
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/'); // Redirect to login page
    }).catch((error) => {
      console.error('Error LOGGING out:', error);
    });
  };

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
    <div  >

      <Header active="motorcycleslist" />

      <div className="breadcrumb">
        <a onClick={() => navigate('/employer-home')}>Home</a>
        <span> / </span>
        <a onClick={() => navigate('/motorcycleslist')}>Motorcycle List</a>
        <span> / </span>
        <a onClick={() => navigate('/add-motorcycle')}>Add Motorcycle</a>
      </div>
      <div> 
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',   
        }}>

          <Card style={{ width: '900px', height: '450px' }}>
            <h2 className='title'>Add Motorcycle</h2>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAddMotorcycle}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px', // Space between form items
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
                        fontSize: '16px',
                      }}>
                        GPS Number
                      </span>
                    }
                    name="GPSnumber"
                    rules={[{ required: true, message: 'Please enter GPS Number field.' }]}
                  >
                    <Input
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #059855', // Green border
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'border-color 0.3s ease-in-out',
                        fontFamily: 'Open Sans',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1c7a50'} // Darker green on focus
                      onBlur={(e) => e.target.style.borderColor = '#059855'} // Revert border color
                    />
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
                        fontSize: '16px',
                      }}>
                        Motorcycle Model
                      </span>
                    }
                    name="Model"
                    rules={[{ required: true, message: 'Please enter Motorcycle Model field.' }]}
                  >
                    <Input
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #059855', // Green border
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'border-color 0.3s ease-in-out',
                        fontFamily: 'Open Sans',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1c7a50'} // Darker green on focus
                      onBlur={(e) => e.target.style.borderColor = '#059855'} // Revert border color
                    />
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
                        fontSize: '16px',
                      }}>
                        Motorcycle Type
                      </span>
                    }
                    name="Type"
                    rules={[{ required: true, message: 'Please enter Motorcycle Type field.' }]}
                  >
                    <Input
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #059855', // Green border
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'border-color 0.3s ease-in-out',
                        fontFamily: 'Open Sans',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1c7a50'} // Darker green on focus
                      onBlur={(e) => e.target.style.borderColor = '#059855'} // Revert border color
                    />
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
                        fontSize: '16px',
                      }}>
                        Motorcycle Brand
                      </span>
                    }
                    name="Brand"
                    rules={[{ required: true, message: 'Please enter Motorcycle Brand field.' }]}
                  >
                    <Input
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #059855', // Green border
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'border-color 0.3s ease-in-out',
                        fontFamily: 'Open Sans',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1c7a50'} // Darker green on focus
                      onBlur={(e) => e.target.style.borderColor = '#059855'} // Revert border color
                    />
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
                        fontSize: '16px',
                      }}>
                        License Plate
                      </span>
                    }
                    name="LicensePlate"
                    rules={[{ required: true, message: 'Please enter License Plate field.' }]}
                  >
                    <Input
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #059855', // Green border
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'border-color 0.3s ease-in-out',
                        fontFamily: 'Open Sans',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1c7a50'} // Darker green on focus
                      onBlur={(e) => e.target.style.borderColor = '#059855'} // Revert border color
                    />
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
                        fontSize: '16px',
                      }}>
                        Driver ID (National ID / Residency Number)
                      </span>
                    }
                    name="DriverID"
                    rules={[{ required: true, message: 'Please enter Driver ID field or choose None.' }]}
                  >
                    <Select
                      placeholder="Select a Driver ID"
                      style={{
                        width: '100%',
                        height: '45px',
                        border: '1px solid #059855', // Green border
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'border-color 0.3s ease-in-out',
                        fontFamily: 'Open Sans',
                      }}
                      dropdownStyle={{
                        boxShadow: 'none',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1c7a50'} // Darker green on focus
                      onBlur={(e) => e.target.style.borderColor = '#059855'} // Revert border color
                    >
                      <Select.Option value="None">None</Select.Option>
                      {availableDrivers.map((item) => (
                        <Select.Option key={item.value} value={item.value}>
                          {item.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{
                    backgroundColor: "#059855",
                  }}
                >
                  Add Motorcycle
                </Button>
              </Form.Item>
            </Form>
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

export default AddMotorcycle;