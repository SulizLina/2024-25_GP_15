import React, { useEffect, useState, useRef } from 'react';
import Header from './GDTHeader';
import d from '../../css/Dashboard.module.css';
import '../../css/CustomModal.css';
import { useNavigate, Link } from 'react-router-dom';
import StaffChart from './DashboardCharts/StaffChart';
import ViolationCrashGeoChart from './DashboardCharts/ViolationCrashGeoChart';
import NumberOfViolations from './DashboardCharts/NumberOfViolations';
import NumberofCrashes from './DashboardCharts/NumberofCrash';
import TotalDrivers from './DashboardCharts/TotalDrivers';
import RecklessViolation from './DashboardCharts/RecklessViolation';
import TotalViolation from './DashboardCharts/TotalViolation';
import TotalComplaints from './DashboardCharts/TotalComplaints';
import TotalCrash from './DashboardCharts/TotalCrashes';
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
const GDTDashBoard = () => {
  const navigate = useNavigate();
  const [violationFilterType, setViolationFilterType] = useState('All');
  const [complaintFilterType, setComplaintFilterType] = useState('All');
  const [isTypeOpen, setIsTypeOpen] = useState({
    violations: false,
    complaints: false,
  });
  const [companyOptions, setCompanyOptions] = useState(['All']);
  const [data, setData] = useState([]);
  const typeDropdownRef = useRef(null);
  const violationDropdownRef = useRef(null);
  const complaintDropdownRef = useRef(null);
  const [thisWeekViolations, setThisWeekViolations] = useState(0);
  const [lastWeekViolations, setLastWeekViolations] = useState(0);
  const [thisWeekComplaints, setThisWeekComplaints] = useState(0);
  const [lastWeekViolationsComplaints, setLastWeekComplaints] = useState(0);
  const [percentageChange, setPercentageChange] = useState(null);
  const [percentageChangeCrash, setPercentageChangeCrash] = useState(null);
  const [percentageChangeComplaints, setPercentageChangeComplaints] =
    useState(null);
  const [lastCrashTime, setLastCrashTime] = useState(null);
  const [responseBy, setResponseBy] = useState(null);
  const [filterByDate, setFilterByDate] = useState('week');
  const [filterByDateCrash, setFilterByDateCrash] = useState('week');
  const [lastCrash, setLastCrash] = useState(null);
  useEffect(() => {
    fetchData();
  }, []);

  const handleDateFilterChange = (event) => {
    const filterByDate = event.target.value; // Get the selected value (Week or Month)
    setFilterByDate(filterByDate); // Update your filter state
  };

  const handleDateFilterChangeCarsh = (event) => {
    const filterByDateCrash = event.target.value;
    setFilterByDateCrash(filterByDateCrash); // Update your filter state
  };
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const GDTResponse = (RespondedBy, setResponseByName) => {
    try {
      const gdtQuery = query(
        collection(db, 'GDT'),
        where('ID', '==', RespondedBy)
      );

      const unsubscribe = onSnapshot(gdtQuery, (snapshot) => {
        if (!snapshot.empty) {
          const gdtData = snapshot.docs[0].data();
          setResponseByName(`${gdtData.Fname} ${gdtData.Lname}`);
        } else {
          console.error('No GDT document found with ID:', RespondedBy);
          setResponseByName('Unknown');
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching GDT details:', error);
      setResponseByName('Error');
    }
  };
  const ResponseBy = ({ respondedBy }) => {
    const [responseByName, setResponseByName] = useState('');

    useEffect(() => {
      console.log('RespondedBy ID:', respondedBy);

      if (respondedBy) {
        const unsubscribe = GDTResponse(respondedBy, setResponseByName);
      } else {
        setResponseByName('Unknown'); // Reset if no ID
      }
    }, [respondedBy]);

    return <span>{responseByName}</span>; // Show loading while fetching
  };
  const toggleTypeDropdown = (type) => {
    setIsTypeOpen((prev) => ({
      ...prev,
      [type]: !prev[type],
      ...(type === 'violations'
        ? { complaints: false }
        : { violations: false }),
    }));
  };

  // Separate handlers for each filter
  const handleViolationOptionClick = (option) => {
    setViolationFilterType(option);
    setIsTypeOpen({ violations: false, complaints: false });
  };

  const handleComplaintOptionClick = (option) => {
    setComplaintFilterType(option);
    setIsTypeOpen({ violations: false, complaints: false });
  };

  const fetchData = async () => {
    try {
      const violationSnapshot = await getDocs(collection(db, 'Violation'));
      const driverIDs = new Set();

      violationSnapshot.forEach((doc) => {
        const { driverID } = doc.data();
        if (driverID) driverIDs.add(driverID);
      });

      if (driverIDs.size === 0) {
        setData([]);
        return;
      }

      const driverIDList = [...driverIDs];
      const driverMap = new Map();

      for (let i = 0; i < driverIDList.length; i += 10) {
        const batch = driverIDList.slice(i, i + 10);
        const q = query(
          collection(db, 'Driver'),
          where('DriverID', 'in', batch)
        );
        const driverSnapshot = await getDocs(q);

        driverSnapshot.forEach((doc) => {
          const { DriverID, CompanyName } = doc.data();
          if (DriverID && CompanyName) {
            driverMap.set(DriverID, CompanyName);
          }
        });
      }

      const employerSnapshot = await getDocs(collection(db, 'Employer'));
      const employerMap = new Map();

      employerSnapshot.forEach((doc) => {
        const { CompanyName, ShortCompanyName } = doc.data();
        if (CompanyName && ShortCompanyName) {
          employerMap.set(CompanyName, ShortCompanyName);
        }
      });

      const companyMap = new Map();
      violationSnapshot.forEach((doc) => {
        const { driverID } = doc.data();
        const companyName = driverMap.get(driverID);
        const shortName = employerMap.get(companyName) || companyName;
        if (shortName) {
          companyMap.set(shortName, (companyMap.get(shortName) || 0) + 1);
        }
      });

      const shortCompanyNames = Array.from(employerMap.values()).sort();
      setCompanyOptions(['All', ...shortCompanyNames]);

      const chartData = Array.from(companyMap, ([shortCompanyName, value]) => ({
        name: shortCompanyName,
        value,
      }));

      setData(chartData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  // Function to calculate the last Sunday date
  const getLastSundayDateTime = () => {
    const today = new Date();
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - today.getDay()); // Sets to the last Sunday
    lastSunday.setHours(0, 0, 0, 0); // Reset time to the start of the day
    return lastSunday.toLocaleString('en-US', {
      weekday: 'long', // Full name of the day
      year: 'numeric',
      month: 'long', // Full name of the month
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true, // 12-hour format
    });
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        violationDropdownRef.current &&
        !violationDropdownRef.current.contains(event.target) &&
        complaintDropdownRef.current &&
        !complaintDropdownRef.current.contains(event.target)
      ) {
        setIsTypeOpen({ violations: false, complaints: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchViolationData();
    fetchCrashData();
    fetchComplaintsData();
  }, []);

  //To calculate the precentage
  const fetchViolationData = async () => {
    try {
      const today = new Date();

      // Start of this week (Sunday at 00:00:00)
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);

      // Start of last week (Previous Sunday at 00:00:00)
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);

      // End of last week (Saturday at 23:59:59)
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setSeconds(-1); // Makes it Saturday 23:59:59

      // Convert JavaScript Date to Unix timestamp (in seconds)
      const thisWeekStartUnix = Math.floor(thisWeekStart.getTime() / 1000);
      const lastWeekStartUnix = Math.floor(lastWeekStart.getTime() / 1000);
      const lastWeekEndUnix = Math.floor(lastWeekEnd.getTime() / 1000);

      // Queries for this week's and last week's violations
      const thisWeekQuery = query(
        collection(db, 'Violation'),
        where('time', '>=', thisWeekStartUnix) // Use 'time' field
      );

      const lastWeekQuery = query(
        collection(db, 'Violation'),
        where('time', '>=', lastWeekStartUnix), // Use 'time' field
        where('time', '<=', lastWeekEndUnix)
      );

      const thisWeekSnapshot = await getDocs(thisWeekQuery);
      const lastWeekSnapshot = await getDocs(lastWeekQuery);

      const thisWeekCount = thisWeekSnapshot.size;
      const lastWeekCount = lastWeekSnapshot.size;

      setThisWeekViolations(thisWeekCount);
      setLastWeekViolations(lastWeekCount);

      // Calculate percentage change
      if (lastWeekCount > 0) {
        const change = ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100;
        setPercentageChange(change.toFixed(2));
      } else {
        setPercentageChange(thisWeekCount > 0 ? 100 : 0);
      }
    } catch (error) {
      console.error('Error fetching violation data:', error);
    }
  };
  //To calculate the precentage
  const fetchComplaintsData = async () => {
    try {
      const today = new Date();

      // Start of this week (Sunday at 00:00:00)
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);

      // Start of last week (Previous Sunday at 00:00:00)
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);

      // End of last week (Saturday at 23:59:59)
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setSeconds(-1); // Makes it Saturday 23:59:59

      // Convert JavaScript Date to Unix timestamp (in seconds)
      const thisWeekStartUnix = Math.floor(thisWeekStart.getTime() / 1000);
      const lastWeekStartUnix = Math.floor(lastWeekStart.getTime() / 1000);
      const lastWeekEndUnix = Math.floor(lastWeekEnd.getTime() / 1000);

      // Queries for this week's and last week's violations
      const thisWeekQuery = query(
        collection(db, 'Complaint'),
        where('time', '>=', thisWeekStartUnix) // Use 'time' field
      );

      const lastWeekQuery = query(
        collection(db, 'Complaint'),
        where('time', '>=', lastWeekStartUnix), // Use 'time' field
        where('time', '<=', lastWeekEndUnix)
      );

      const thisWeekSnapshot = await getDocs(thisWeekQuery);
      const lastWeekSnapshot = await getDocs(lastWeekQuery);

      const thisWeekCount = thisWeekSnapshot.size;
      const lastWeekCount = lastWeekSnapshot.size;

      setThisWeekComplaints(thisWeekCount);
      setLastWeekComplaints(lastWeekCount);

      // Calculate percentage change
      if (lastWeekCount > 0) {
        const change = ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100;
        setPercentageChangeComplaints(change.toFixed(2));
      } else {
        setPercentageChangeComplaints(thisWeekCount > 0 ? 100 : 0);
      }
    } catch (error) {
      console.error('Error fetching violation data:', error);
    }
  };
  //To calculate the percentage
  const fetchCrashData = async () => {
    try {
      const today = new Date();

      // Start of this week (Sunday at 00:00:00)
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);

      // Start of last week (Previous Sunday at 00:00:00)
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);

      // End of last week (Saturday at 23:59:59)
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setSeconds(-1); // Makes it Saturday 23:59:59

      // Convert JavaScript Date to Unix timestamp (in seconds)
      const thisWeekStartUnix = Math.floor(thisWeekStart.getTime() / 1000);
      const lastWeekStartUnix = Math.floor(lastWeekStart.getTime() / 1000);
      const lastWeekEndUnix = Math.floor(lastWeekEnd.getTime() / 1000);

      // Queries for this week's and last week's violations
      const thisWeekQuery = query(
        collection(db, 'Crash'),
        where('time', '>=', thisWeekStartUnix) // Use 'time' field
      );

      const lastWeekQuery = query(
        collection(db, 'Crash'),
        where('time', '>=', lastWeekStartUnix), // Use 'time' field
        where('time', '<=', lastWeekEndUnix)
      );

      const thisWeekSnapshot = await getDocs(thisWeekQuery);
      const lastWeekSnapshot = await getDocs(lastWeekQuery);

      const thisWeekCount = thisWeekSnapshot.size;
      const lastWeekCount = lastWeekSnapshot.size;

      setThisWeekViolations(thisWeekCount);
      setLastWeekViolations(lastWeekCount);

      // Calculate percentage change
      if (lastWeekCount > 0) {
        const change = ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100;
        setPercentageChangeCrash(change.toFixed(2));
      } else {
        setPercentageChangeCrash(thisWeekCount > 0 ? 100 : 0);
      }
    } catch (error) {
      console.error('Error fetching Crash data:', error);
    }
  };
  useEffect(() => {
    const crashQuery = query(
      collection(db, 'Crash'),
      orderBy('time', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      crashQuery,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();

          setLastCrash({
            id: doc.id,
            Status: data.Status,
          });

          setLastCrashTime(new Date(data.time * 1000).toLocaleString());
          setResponseBy(data.RespondedBy); // set responder ID
        } else {
          console.log('No crashes detected.');
        }
      },
      (error) => {
        console.error('Error with onSnapshot:', error);
      }
    );

    // Clean up the real-time listener
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <Header active='GDTDashBoard' />
      <div className='breadcrumb'>
        <a onClick={() => navigate('/gdthome')} style={{ cursor: 'pointer' }}>
          Home
        </a>
        <span> / </span>
        <a
          onClick={() => navigate('/GDTDashBoard')}
          style={{ cursor: 'pointer' }}
        >
          Dashboard
        </a>{' '}
      </div>

      <main class='Dashboard' style={{ padding: '20px', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              flex: 1,
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            <div style={{ fontWeight: 'bold', paddingTop: '15px' }}>
              Started Streaming at: {getLastSundayDateTime()}
            </div>
          </div>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              flex: 1,
              textAlign: 'left',
              fontWeight: 'bold',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '15px',
                paddingTop: '15px',
              }}
            >
              <span>
                Last Crash Detected:{' '}
                <strong>{lastCrashTime || 'No data available'}</strong>
              </span>
              <span style={{ color: responseBy ? 'black' : 'red' }}>
                {lastCrash?.Status === 'Emergency SOS' && responseBy ? (
                  <>
                    Response By:{' '}
                    <strong>
                      <ResponseBy respondedBy={responseBy} />
                    </strong>
                  </>
                ) : lastCrash?.Status === 'Emergency SOS' && !responseBy ? (
                  <>
                    <Link
                      to={`/gdtcrash/general/${lastCrash?.id}`}
                      style={{ color: 'red', textDecoration: 'underline' }}
                    >
                      Needs Response
                    </Link>
                  </>
                ) : lastCrash?.Status === 'Denied' && !responseBy ? (
                  <Link
                    to={`/gdtcrash/general/${lastCrash?.id}`}
                    style={{ color: 'grey', textDecoration: 'underline' }}
                  >
                    No Response Needed
                  </Link>
                ) : (
                  'null'
                )}
              </span>
            </div>
          </div>
        </div>
        <div
          style={{
            backgroundColor: '#05b06d',
            color: '#ffffff',
            padding: '20px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            flex: 1,
            textAlign: 'center',
            fontWeight: 'bold',
            animation: 'fadeIn 1s ease-in-out',
            marginBottom: '20px',
          }}
        >
          Delivery Companies Statistics
        </div>{' '}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between', // Use space-between to distribute space
            gap: '20px',
            flexWrap: 'wrap', // Allows wrapping to the next line if necessary
            width: '100%',
          }}
        >
          {[
            { title: 'Total Drivers', component: <TotalDrivers /> },
            {
              title: 'Total Crash',
              component: (
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <TotalCrash />
                  {percentageChangeCrash !== null && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-15px',
                        left: '0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: percentageChangeCrash >= 0 ? 'green' : 'red',
                        fontWeight: 'bold',
                      }}
                    >
                      {percentageChangeCrash >= 0 ? (
                        <FaArrowUp />
                      ) : (
                        <FaArrowDown />
                      )}
                      {percentageChangeCrash}% this week
                    </span>
                  )}
                </div>
              ),
            },
            {
              title: 'Total Violation',
              component: (
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <TotalViolation />
                  {percentageChange !== null && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-15px',
                        left: '0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: percentageChange >= 0 ? 'green' : 'red',
                        fontWeight: 'bold',
                      }}
                    >
                      {percentageChange >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                      {percentageChange}% this week
                    </span>
                  )}
                </div>
              ),
            },
            {
              title: 'Total Complaints',
              component: (
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <TotalComplaints />
                  {percentageChangeComplaints !== null && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-15px',
                        left: '0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color:
                          percentageChangeComplaints >= 0 ? 'green' : 'red',
                        fontWeight: 'bold',
                      }}
                    >
                      {percentageChangeComplaints >= 0 ? (
                        <FaArrowUp />
                      ) : (
                        <FaArrowDown />
                      )}
                      {percentageChangeComplaints}% this week
                    </span>
                  )}
                </div>
              ),
            },
          ].map((item, index) => (
            <GridItem key={index} title={item.title}>
              {item.component}
            </GridItem>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '20px',
            width: '100%',
          }}
        ></div>
        {/* <div
          style={{
            backgroundColor: "#05b06d",
            color: "#ffffff",
            padding: "20px",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            borderBottomLeftRadius: "8px",
            borderBottomRightRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            flex: 1,
            textAlign: "center",
            marginBottom: "0",
            fontWeight: "bold",
            animation: "fadeIn 1s ease-in-out",
          }}
        >
          Traffic Statistics
        </div> */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '10px',
            width: '100%',
          }}
        >
          <div
            style={{
              backgroundColor: '#05b06d',
              color: '#ffffff',
              padding: '20px',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              borderBottomLeftRadius: '0',
              borderBottomRightRadius: '0',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              flex: 1,
              textAlign: 'center',
              fontWeight: 'bold',
              marginTop: '20px',
              animation: 'fadeIn 1s ease-in-out',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%', // Ensure the container takes full width
              }}
            >
              <div
                style={{
                  textAlign: 'left',
                  fontWeight: 'bold',
                  marginRight: '90px',
                }}
              >
                Violation Statistics
              </div>
              {/* First Radio Group */}
              <div className={d.radioinputs}>
                <label className={d.radio}>
                  <input
                    type='radio'
                    name='dateFilter1' // Unique name but controlled by state
                    value='week'
                    checked={filterByDate === 'week'}
                    onChange={handleDateFilterChange}
                  />
                  <span className={d.name}>Week</span>
                </label>
                <label className={d.radio}>
                  <input
                    type='radio'
                    name='dateFilter1'
                    value='Month'
                    checked={filterByDate === 'Month'}
                    onChange={handleDateFilterChange}
                  />
                  <span className={d.name}>Month</span>
                </label>
              </div>

              <div
                className='searchContainer'
                ref={violationDropdownRef}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <div
                  className='selectWrapper'
                  style={{
                    border: '2px solid #4CAF50',
                    backgroundColor: '#FFFFFF',
                    color: 'black',
                    borderRadius: '5px',
                    fontWeight: 'normal',
                    marginLeft: '0px',
                    width: '220px', // Fixed width
                    boxSizing: 'border-box', // Prevents expansion
                    position: 'relative', // For absolute dropdown positioning
                    marginLeft: '9px',
                  }}
                >
                  <div
                    className='customSelect'
                    onClick={() => toggleTypeDropdown('violations')}
                    style={{
                      cursor: 'pointer',
                      padding: '8px 12px',
                      width: '100%', // Prevents expansion
                      textAlign: 'left',
                      fontSize: '14px',
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      {violationFilterType === 'All'
                        ? 'Filter by Company'
                        : violationFilterType}
                    </span>
                    <span
                      style={{
                        border: 'solid #4CAF50',
                        borderWidth: '0 2px 2px 0',
                        display: 'inline-block',
                        padding: '4px',
                        transform: isTypeOpen.violations
                          ? 'rotate(-135deg)'
                          : 'rotate(45deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </div>

                  {isTypeOpen.violations && (
                    <div
                      className='dropdownMenu'
                      style={{
                        position: 'absolute',
                        zIndex: 1000,
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        width: '100%', // Matches select width
                        top: '100%', // Positions below the select
                        left: 0, // Ensures alignment
                        boxSizing: 'border-box',
                        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {companyOptions.map((option) => (
                        <div
                          key={option}
                          className='dropdownOption'
                          onClick={() => handleViolationOptionClick(option)}
                          style={{
                            padding: '12px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s',
                            fontSize: '14px',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = '#f0f0f0')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              'transparent')
                          }
                        >
                          {capitalizeFirstLetter(option)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#05b06d',
              color: '#ffffff',
              padding: '20px',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              borderBottomLeftRadius: '0',
              borderBottomRightRadius: '0',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              flex: 1,
              textAlign: 'center',
              fontWeight: 'bold',
              marginTop: '20px',
              animation: 'fadeIn 1s ease-in-out',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontWeight: 'bold', marginRight: '110px' }}>
                Crash Statistics
              </div>
              <div className={d.radioinputs2}>
                <label className={d.radio2}>
                  <input
                    type='radio'
                    name='dateFilter2' // Different name but still controlled by state
                    value='week'
                    checked={filterByDateCrash === 'week'}
                    onChange={handleDateFilterChangeCarsh}
                  />
                  <span className={d.name2}>Week</span>
                </label>
                <label className={d.radio2}>
                  <input
                    type='radio'
                    name={'dateFilter2'}
                    value='Month'
                    checked={filterByDateCrash === 'Month'}
                    onChange={handleDateFilterChangeCarsh}
                  />
                  <span className={d.name2}>Month</span>
                </label>
              </div>
              <div
                className='searchContainer'
                ref={complaintDropdownRef}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <div
                  className='selectWrapper'
                  style={{
                    border: '2px solid #4CAF50',
                    backgroundColor: '#FFFFFF',
                    color: 'black',
                    borderRadius: '5px',
                    fontWeight: 'normal',
                    width: '220px', // Fixed width
                    boxSizing: 'border-box', // Prevents expansion
                    position: 'relative', // For absolute dropdown positioning
                    marginLeft: '9px',
                  }}
                >
                  <div
                    className={`customSelect ${
                      isTypeOpen.complaints ? 'open' : ''
                    }`}
                    onClick={() => toggleTypeDropdown('complaints')}
                    style={{
                      cursor: 'pointer',
                      padding: '8px 12px',
                      width: '100%', // Prevents expansion
                      textAlign: 'left',
                      fontSize: '14px',
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {complaintFilterType === 'All' ? (
                      <span>Filter by Company</span>
                    ) : (
                      complaintFilterType
                    )}
                    <span
                      style={{
                        border: 'solid #4CAF50',
                        borderWidth: '0 2px 2px 0',
                        display: 'inline-block',
                        padding: '4px',
                        transform: isTypeOpen.complaints
                          ? 'rotate(-135deg)'
                          : 'rotate(45deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </div>
                  {isTypeOpen.complaints && (
                    <div
                      className='dropdownMenu'
                      style={{
                        position: 'absolute',
                        zIndex: 1000,
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        width: '100%', // Matches select width
                        top: '100%', // Positions below the select
                        left: 0, // Ensures alignment
                        boxSizing: 'border-box',
                        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {companyOptions.map((option) => (
                        <div
                          key={option}
                          className='dropdownOption'
                          onClick={() => handleComplaintOptionClick(option)}
                          style={{
                            padding: '10px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s',
                            fontSize: '14px',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = '#f0f0f0')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              'transparent')
                          }
                        >
                          {capitalizeFirstLetter(option)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Section: Charts */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            width: '100%',
          }}
        >
          {/* Row: Violations and Crashes side-by-side */}
          <div style={{ flex: 1 }}>
            <GridItem title='Number of Violations'>
              <NumberOfViolations
                dateType={filterByDate}
                companyName={violationFilterType}
              />
            </GridItem>
          </div>

          <div style={{ flex: 1 }}>
            <GridItem title='Number of Crashes'>
              <NumberofCrashes
                dateType={filterByDateCrash}
                companyName={complaintFilterType}
              />
            </GridItem>
          </div>
        </div>
        {/* Row: Reckless Violations and Staff Response side-by-side */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            width: '100%',
            marginTop: '50px',
            marginBottom: '50px',
          }}
        >
          {/* Reckless Violations Section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                backgroundColor: '#05b06d',
                color: '#ffffff',
                padding: '20px',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                borderBottomLeftRadius: '0',
                borderBottomRightRadius: '0',
                textAlign: 'center',
                fontWeight: 'bold',
                animation: 'fadeIn 1s ease-in-out',
              }}
            >
              Reckless Violation Statistics
            </div>
            <GridItem title='Reckless Violations'>
              <RecklessViolation
                dateType={filterByDate}
                companyName={violationFilterType}
              />
            </GridItem>
          </div>

          {/* Staff Response Section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                backgroundColor: '#05b06d',
                color: '#ffffff',
                padding: '20px',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                borderBottomLeftRadius: '0',
                borderBottomRightRadius: '0',
                textAlign: 'center',
                fontWeight: 'bold',
                animation: 'fadeIn 1s ease-in-out',
              }}
            >
              Staff Response Statistics
            </div>
            <GridItem title='Staff Response Chart'>
              <StaffChart />
            </GridItem>
          </div>
        </div>
        {/* Geo Charts */}
        <div
          style={{
            backgroundColor: '#05b06d',
            color: '#ffffff',
            padding: '20px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderBottomLeftRadius: '0',
            borderBottomRightRadius: '0',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            flex: 1,
            textAlign: 'center',
            fontWeight: 'bold',
            marginTop: '20px',
            animation: 'fadeIn 1s ease-in-out',
          }}
        >
          <div style={{ fontWeight: 'bold' }}>
            Riyadh Violation and Crash Distribution
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '20px',
            width: '100%',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <GridItem title=''>
              <ViolationCrashGeoChart />
            </GridItem>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GDTDashBoard;

const GridItem = ({ title, children }) => (
  <div
    style={{
      backgroundColor: '#FFFFFF',
      padding: '20px',
      borderTopLeftRadius: '0',
      borderTopRightRadius: '0',
      borderBottomLeftRadius: '8px',
      borderBottomRightRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      flex: 1,
      minWidth: '550px',
    }}
  >
    <h3 style={{ marginBottom: '15px', textAlign: 'center', color: '#059855' }}>
      {title}
    </h3>
    {children}
  </div>
);
