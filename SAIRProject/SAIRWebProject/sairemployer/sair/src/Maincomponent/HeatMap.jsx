import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  GoogleMap,
  InfoWindowF,
  MarkerF,
  HeatmapLayerF,
} from '@react-google-maps/api';
import motorcycle from '../images/motorcycle.png';
import '../css/CustomModal.css';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { FaExclamationTriangle } from 'react-icons/fa';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';

import { SearchOutlined } from '@ant-design/icons';
import { FaFilter } from 'react-icons/fa';
import q from '../css/Violations.module.css';
import m from '../css/DriverList.module.css';
import f from '../css/ComplaintList.module.css';
import s from '../css/ComplaintList.module.css'; // CSS module for ComplaintList
import axios from 'axios';

const containerStyle = {
  width: '98%', // Set the map width
  height: '566px', // Set the map height
  margin: 'auto', // Center the map
  marginRight: '8px',
  marginLeft: '8px',
  marginTop: '-23px',
};

// const beigeMapStyle = [
// { elementType: "geometry", stylers: [{ color: " #FFFAF0" }] }, // Base Color
// { elementType: "labels.text.fill", stylers: [{ color: "#776543" }] }, // Dark Brown Text
// { elementType: "labels.text.stroke", stylers: [{ color: "#f3f3f3" }] }, // Light Stroke Around Text
// { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] }, // Hide Borders
// { featureType: "water", stylers: [{ color: "#d4c4b7" }] }, // Light Beige Water
// { featureType: "road", stylers: [{ color: "#e6d5c3" }] }, // Light Beige Roads
// ];

const HeatMapWrapper = ({ heatmapData, visible = true }) => {
  const heatmapRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const prevVisibleRef = React.useRef(visible);
  const prevDataLengthRef = React.useRef(0);

  const onHeatmapLoad = React.useCallback((heatmapLayer) => {
    heatmapRef.current = heatmapLayer;
  }, []);

  React.useEffect(() => {
    if (heatmapRef.current) {
      // Store map reference when available
      if (!mapRef.current && heatmapRef.current.getMap()) {
        mapRef.current = heatmapRef.current.getMap();
      }

      // Handle visibility changes
      if (visible !== prevVisibleRef.current) {
        prevVisibleRef.current = visible;

        if (visible) {
          heatmapRef.current.setMap(mapRef.current);
        } else {
          heatmapRef.current.setMap(null);
        }
      }

      // Handle data changes only when visible
      if (visible && heatmapData && heatmapData.length > 0) {
        // Check if data length has changed - this indicates filtering happened
        const currentDataLength = heatmapData.length;
        if (currentDataLength !== prevDataLengthRef.current) {
          prevDataLengthRef.current = currentDataLength;

          // Force refresh by temporarily removing and re-adding the heatmap
          const tempMap = heatmapRef.current.getMap();
          heatmapRef.current.setMap(null);
          heatmapRef.current.setData(heatmapData);
          heatmapRef.current.setMap(tempMap);
        } else {
          // Regular data update without refresh
          heatmapRef.current.setData(heatmapData);
        }
      }
    }
  }, [heatmapData, visible]);

  // Only render when visible or first mount
  if (!visible && heatmapRef.current) {
    return null;
  }

  return (
    <HeatmapLayerF
      onLoad={onHeatmapLoad}
      data={heatmapData}
      options={{
        radius: 30,
        opacity: 0.7,
        gradient: [
          'rgba(0, 0, 255, 0)', // Transparent blue
          'rgba(0, 255, 255, 1)', // Cyan
          'rgba(0, 255, 0, 1)', // Green
          'rgba(255, 255, 0, 1)', // Yellow
          'rgba(255, 128, 0, 1)', // Orange
          'rgba(255, 0, 0, 1)', // Red
        ],
      }}
    />
  );
};

const HeatMap = ({ locations }) => {
  const [gpsState, setGpsState] = useState({ active: [], inactive: [] });
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState([]);
  const [filters, setFilters] = useState({ company: [], status: [] });
  const [mapRefreshKey, setMapRefreshKey] = useState(0);

  const [filterStatus, setFilterStatus] = useState('All');
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const typeDropdownRef = useRef(null);

  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [map, setMap] = useState(null);
  // const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 24.7136, lng: 46.6953 }); // Center of Riyadh
  const [lastKnownLocations, setLastKnownLocations] = useState(() => {
    const storedLocations = localStorage.getItem('lastKnownLocationsEmployer');
    return storedLocations ? JSON.parse(storedLocations) : [];
  });
  const [initialLoad, setInitialLoad] = useState(true); // Track if it's the initial load
  const [zoomLevel, setZoomLevel] = useState(12); // Default zoom level
  const [driverDetails, setDriverDetails] = useState(null);
  const [motorcycleDetails, setMotorcycleDetails] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [shortCompanyName, setShortCompanyName] = useState('');
  const [CompanyName, setCompanyName] = useState('');

  const [expandedMotorcycleIds, setExpandedMotorcycleIds] = useState([]);
  const [expandedMotorcycleId, setExpandedMotorcycleId] = useState([]);
  const [activeMotorcycleId, setActiveMotorcycleId] = useState(null);
  const [motorcycleData, setMotorcycleData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uniqueCompanyNames, setUniqueCompanyNames] = useState([]);

  const employerUID = sessionStorage.getItem('employerUID');

  const [showMarkers, setShowMarkers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Add these state variables near your other state declarations
  const [markerPositions, setMarkerPositions] = useState({});
  const [markerHeadings, setMarkerHeadings] = useState({});
  const [animatingMarkers, setAnimatingMarkers] = useState({});

  useEffect(() => {
    const fetchShortCompanyName = async () => {
      console.log('in heatmap employer', CompanyName);
      if (!CompanyName) {
        // Only fetch if it's not set
        const employerUID = sessionStorage.getItem('employerUID');
        if (employerUID) {
          try {
            const userDocRef = doc(db, 'Employer', employerUID);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setCompanyName(data.ShortCompanyName || '');
              console.log('in map', CompanyName);
            }
          } catch (error) {
            console.error('Error fetching short company name:', error);
          }
        }
      }
    };

    fetchShortCompanyName();
  }, [CompanyName, setCompanyName]);

  const toggleTypeDropdown = () => {
    setIsTypeOpen((prev) => !prev);
  };

  const handleStatusClick = (status) => {
    setFilterStatus(status);
    setIsTypeOpen(false);
  };

  const combinedOptions = [
    // Companies
    ...[...uniqueCompanyNames].sort().map((name) => ({
      value: name,
      label: name,
      category: 'Company',
    })),
    // Statuses
    { value: 'Active', label: 'Active', category: 'Status' },
    { value: 'Inactive', label: 'Inactive', category: 'Status' },
  ];

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  // Modify your fetchGpsState function to incorporate animation
  const fetchGpsState = async () => {
    try {
      console.log(' Data:', CompanyName);
      const response = await fetch(
        'https://sair-server.onrender.com/api/gps-state'
      );

      if (!response.ok) {
        console.log('nnnnnnnnnnnnnnnnnnnnnnnn');
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      console.log('Fetched data:', data);

      const activeGpsData = Array.isArray(data?.active) ? data.active : [];
      const inactiveGpsData = Array.isArray(data?.inactive)
        ? data.inactive
        : [];

      // Combine both arrays to process all GPS data
      const combinedGpsData = [...activeGpsData, ...inactiveGpsData];

      // Extract gpsNumbers from the combined data
      const gpsNumbers = combinedGpsData.map((loc) => loc.gpsNumber);

      // Fetch Driver data based on gpsNumbers
      const driverPromises = gpsNumbers.map((gpsNumber) => {
        const driverQuery = query(
          collection(db, 'Driver'),
          where('GPSnumber', '==', gpsNumber)
        );
        return getDocs(driverQuery);
      });

      // Wait for all driver data to be fetched
      const driverSnapshots = await Promise.all(driverPromises);

      // Filter matching data
      const filteredData = [];

      // Process driver data and match companyName
      for (let i = 0; i < driverSnapshots.length; i++) {
        const snapshot = driverSnapshots[i];

        if (snapshot.docs.length === 0) continue; // Skip if no driver doc

        const driverData = snapshot.docs[0].data();

        if (driverData && driverData.CompanyName) {
          const employerQuery = query(
            collection(db, 'Employer'),
            where('CompanyName', '==', driverData.CompanyName)
          );
          const employerSnapshot = await getDocs(employerQuery);

          if (!employerSnapshot.empty) {
            const employerData = employerSnapshot.docs[0].data();
            const shortCompanyName = employerData?.ShortCompanyName;

            if (shortCompanyName === CompanyName) {
              const gpsNumber = gpsNumbers[i];
              const newLoc = {
                gpsNumber,
                lat: combinedGpsData[i].lat,
                lng: combinedGpsData[i].lng,
                status: activeGpsData.some(
                  (item) => item.gpsNumber === gpsNumber
                )
                  ? 'Active'
                  : 'Inactive',
              };

              // Check if this marker already exists and has moved
              const currentPos = markerPositions[gpsNumber];
              if (currentPos) {
                // If position has changed significantly, animate the marker
                if (
                  Math.abs(currentPos.lat - newLoc.lat) > 0.000001 ||
                  Math.abs(currentPos.lng - newLoc.lng) > 0.000001
                ) {
                  animateMarker(
                    gpsNumber,
                    currentPos.lat,
                    currentPos.lng,
                    newLoc.lat,
                    newLoc.lng
                  );
                }
              } else {
                // If it's a new marker, set position directly without animation
                setMarkerPositions((prev) => ({
                  ...prev,
                  [gpsNumber]: { lat: newLoc.lat, lng: newLoc.lng },
                }));
              }

              filteredData.push(newLoc);
            }
          }
        }
      }

      // Separate data into active and inactive arrays
      const activeData = filteredData.filter(
        (item) => item.status === 'Active'
      );
      const inactiveDataFiltered = filteredData.filter(
        (item) => item.status === 'Inactive'
      );

      // Update state with filtered data
      setGpsState({
        active: activeData,
        inactive: inactiveDataFiltered,
      });

      // Update lastKnownLocations with the latest position data
      setLastKnownLocations((prevLocations) => {
        const updatedLocations = [...prevLocations];

        filteredData.forEach((newLoc) => {
          const existingIndex = updatedLocations.findIndex(
            (loc) => loc.gpsNumber === newLoc.gpsNumber
          );

          if (existingIndex >= 0) {
            // Update existing location with new data but preserve other properties
            updatedLocations[existingIndex] = {
              ...updatedLocations[existingIndex],
              lat: markerPositions[newLoc.gpsNumber]?.lat || newLoc.lat,
              lng: markerPositions[newLoc.gpsNumber]?.lng || newLoc.lng,
              status: newLoc.status,
            };
          } else {
            // Add new location
            updatedLocations.push(newLoc);
          }
        });

        return updatedLocations;
      });

      console.log('Filtered Data:', filteredData);
    } catch (error) {
      console.error('Error fetching or filtering data:', error.message);
      setError(error.message);
    }
  };

  // Function to fetch GPS state from the server
  /*const fetchGpsState = async () => {
    try {
      console.log(' Data:', CompanyName);
      const response = await fetch(
        'https://sair-server.onrender.com/api/gps-state'
      ); // need to change port after host the server!!     const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/gps-state`);   هنا بعد ما نرفع السيرفر نحط ال url

      if (!response.ok) {
        console.log('nnnnnnnnnnnnnnnnnnnnnnnn');
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      console.log('Fetched data:', data);

      const activeGpsData = Array.isArray(data?.active) ? data.active : [];
      const inactiveGpsData = Array.isArray(data?.inactive)
        ? data.inactive
        : [];

      console.log(activeGpsData);
      console.log(inactiveGpsData);
      // Combine both arrays
      const combinedGpsData = [...activeGpsData, ...inactiveGpsData];

      // Extract gpsNumbers from the combined data
      const gpsNumbers = combinedGpsData.map((loc) => loc.gpsNumber);

      // Fetch Driver data based on gpsNumbers
      const driverPromises = gpsNumbers.map((gpsNumber) => {
        const driverQuery = query(
          collection(db, 'Driver'), // Query the "Driver" collection
          where('GPSnumber', '==', gpsNumber) // Filter by GPSnumber
        );
        return getDocs(driverQuery); // Use getDocs to retrieve matching documents
      });

      // Wait for all driver data to be fetched
      const driverSnapshots = await Promise.all(driverPromises);

      // Filter matching data
      const filteredData = [];

      // Process driver data and match companyName
      for (let i = 0; i < driverSnapshots.length; i++) {
        const snapshot = driverSnapshots[i];

        if (snapshot.docs.length === 0) continue; // Skip if no driver doc

        const driverData = snapshot.docs[0].data();

        if (driverData && driverData.CompanyName) {
          const employerQuery = query(
            collection(db, 'Employer'),
            where('CompanyName', '==', driverData.CompanyName)
          );
          const employerSnapshot = await getDocs(employerQuery);

          if (!employerSnapshot.empty) {
            const employerData = employerSnapshot.docs[0].data();
            const shortCompanyName = employerData?.ShortCompanyName;

            console.log('shortCompanyName:', shortCompanyName);
            console.log('CompanyName from UI:', CompanyName);

            if (shortCompanyName === CompanyName) {
              filteredData.push({
                gpsNumber: gpsNumbers[i],
                lat: combinedGpsData[i].lat,
                lng: combinedGpsData[i].lng,
                status: activeGpsData[i] ? 'Active' : 'Inactive',
              });
            }
          }
        }
      }

      // Separate data into active and inactive arrays
      const activeData = filteredData.filter(
        (item) => item.status === 'Active'
      );
      const inactiveDataFiltered = filteredData.filter(
        (item) => item.status === 'Inactive'
      );

      // Update state with filtered data
      setGpsState({
        active: activeData,
        inactive: inactiveDataFiltered,
      });
      // Log filtered data for validation

      console.log('Filtered Data:', filteredData); // Log filtered data for validation
    } catch (error) {
      console.error('Error fetching or filtering data:', error.message);
      setError(error.message); // Handle errors if needed
    }
  };*/

  // Call fetchGpsState when the component mounts
  useEffect(() => {
    // Fetch immediately when component mounts
    if (!CompanyName) return;

    fetchGpsState();

    // Then keep fetching every 10 seconds
    const interval = setInterval(() => {
      fetchGpsState();
    }, 1000); //  seconds

    // Cleanup the interval when component unmounts
    return () => clearInterval(interval);
  }, [CompanyName]);

  console.log(' Employer HeatMap Component');
  const updateMapData = useCallback(() => {
    if (
      (gpsState.active.length > 0 || gpsState.inactive.length > 0) &&
      window.google &&
      window.google.maps
    ) {
      const newHeatmapData = [
        ...gpsState.active
          .filter((loc) => loc && !isNaN(loc.lat) && !isNaN(loc.lng))
          .map((loc) => new window.google.maps.LatLng(loc.lat, loc.lng)),
        ...gpsState.inactive
          .filter((loc) => loc && !isNaN(loc.lat) && !isNaN(loc.lng))
          .map((loc) => new window.google.maps.LatLng(loc.lat, loc.lng)),
        ...staticMotorcycleData // Add static motorcycle data coordinates for heatmap
          .filter((sloc) => sloc.shortCompanyName === CompanyName)
          .map(
            (staticLoc) =>
              new window.google.maps.LatLng(staticLoc.lat, staticLoc.lng)
          ),
      ];
      setHeatmapData(newHeatmapData);

      if (initialLoad) {
        const firstAvailable = gpsState.active[0] || gpsState.inactive[0];
        const filteredStaticMotorcycles = staticMotorcycleData.filter(
          (motorcycle) => motorcycle.shortCompanyName === CompanyName
        );
        setLastKnownLocations([
          ...gpsState.active,
          ...gpsState.inactive,
          ...filteredStaticMotorcycles,
        ]);
        if (filteredMotorcycles.length > 0) {
          const firstMotorcycle = filteredMotorcycles[0];
          console.log('pppppppppppppppppp', firstMotorcycle);
          setMapCenter({ lat: firstMotorcycle.lat, lng: firstMotorcycle.lng });
        }
        // setMapCenter({ lat: firstAvailable.lat, lng: firstAvailable.lng });
        setInitialLoad(false);
      }
    }
  }, [gpsState, initialLoad]);

  useEffect(() => {
    updateMapData();
  }, [gpsState, updateMapData]);

  useEffect(() => {
    window.gm_authFailure = function () {
      console.error('Google Maps API authentication failed.');
    };
  }, []);

  /*useEffect(() => {
console.log("Locations received:", locations);



if (locations.length > 0) {
  try {
    if (!window.google || !window.google.maps) {
      console.warn("Google Maps API is not loaded yet.");
      return;
    }

    setHeatmapData(
      locations
        .filter(loc => loc && !isNaN(loc.lat) && !isNaN(loc.lng)) 
        .map(loc => new window.google.maps.LatLng(loc.lat, loc.lng))
    );
    setLastKnownLocations(locations); // 
    localStorage.setItem("lastKnownLocations", JSON.stringify(locations)); 

  } catch (error) {
    console.error("Error creating LatLng objects:", error);
  }
}
}, [locations]); */

  useEffect(() => {
    if (window.google && window.google.maps) {
      console.log('Google Maps API Loaded Successfully');
      // setIsMapLoaded(true);
    }
  }, []);

  const fetchMotorcycleAndDriverData = async () => {
    const gpsNumbers = [...gpsState.active, ...gpsState.inactive].map(
      (loc) => loc.gpsNumber
    );

    const motorcyclePromises = gpsNumbers.map((gpsNumber) => {
      const motorcycleQuery = query(
        collection(db, 'Motorcycle'),
        where('GPSnumber', '==', gpsNumber)
      );
      return getDocs(motorcycleQuery);
    });

    const driverPromises = gpsNumbers.map((gpsNumber) => {
      const driverQuery = query(
        collection(db, 'Driver'),
        where('GPSnumber', '==', gpsNumber)
      );
      return getDocs(driverQuery);
    });

    const employerPromises = gpsNumbers.map(async (gpsNumber) => {
      // Fetch the driver details first to get the CompanyName
      const driverQuery = query(
        collection(db, 'Driver'),
        where('GPSnumber', '==', gpsNumber)
      );
      const driverSnapshot = await getDocs(driverQuery);
      if (!driverSnapshot.empty) {
        const employerQuery = doc(db, 'Employer', employerUID);
        return getDoc(employerQuery);
      }
      return null; // If no driver found, return null
    });

    const motorcycleSnapshots = await Promise.all(motorcyclePromises);
    const driverSnapshots = await Promise.all(driverPromises);
    const employerSnapshots = await Promise.all(employerPromises);

    const motorcyclesWithDrivers = motorcycleSnapshots.map(
      (snapshot, index) => {
        const motorcycleData = snapshot.docs[0]?.data();
        const driverData = driverSnapshots[index].docs[0]?.data();
        // Determine status based on gpsState
        const status = gpsState.active.some(
          (item) => item.gpsNumber === motorcycleData?.GPSnumber
        )
          ? 'Active'
          : 'Inactive';
        return {
          motorcycleID: motorcycleData?.MotorcycleID || 'N/A',
          lat:
            locations?.find(
              (loc) => loc.gpsNumber === motorcycleData?.GPSnumber
            )?.lat || 0,
          lng:
            locations?.find(
              (loc) => loc.gpsNumber === motorcycleData?.GPSnumber
            )?.lng || 0,
          driverID: driverData?.DriverID || 'N/A',
          driverName: driverData
            ? `${driverData.Fname} ${driverData.Lname}`
            : 'Unknown',
          phoneNumber: driverData?.PhoneNumber || 'N/A',
          gpsNumber: motorcycleData?.GPSnumber || 'N/A',
          type: motorcycleData?.Type || 'N/A',
          licensePlate: motorcycleData?.LicensePlate || 'N/A',
          status,
        };
      }
    );

    // Combine the static motorcycle data
    const filteredStaticMotorcycles = staticMotorcycleData.filter(
      (motorcycle) => motorcycle.shortCompanyName === CompanyName
    );

    const combinedMotorcycleData = [
      ...motorcyclesWithDrivers,
      ...filteredStaticMotorcycles,
    ];

    setMotorcycleData(combinedMotorcycleData);
  };

  useEffect(() => {
    const filteredStaticMotorcycles = staticMotorcycleData.filter(
      (motorcycle) => motorcycle.shortCompanyName === CompanyName
    );
    if (
      gpsState.active.length > 0 ||
      gpsState.inactive.length > 0 ||
      filteredStaticMotorcycles.length > 0
    ) {
      fetchMotorcycleAndDriverData();
    }
  }, [gpsState]);

  // Add these functions after the `const motorcycleIcon = {...}` definition
  // Create a function to calculate icon size based on zoom level
  const getIconSize = (zoomLevel) => {
    // Base size for different zoom levels
    if (zoomLevel <= 10) return 20; // Small at far zoom
    if (zoomLevel <= 14) return 30; // Medium at medium zoom
    if (zoomLevel <= 16) return 40; // Larger at closer zoom
    return 50; // Full size when very close
  };

  // Update the motorcycle icon function to support rotation
  const getMotorcycleIcon = (zoomLevel, heading = 0) => {
    const size = getIconSize(zoomLevel);
    return {
      url: motorcycle,
      scaledSize: new window.google.maps.Size(size, size),
      origin: new window.google.maps.Point(0, 0),
      anchor: new window.google.maps.Point(size / 2, size),
      rotation: heading, // Add rotation based on heading
    };
  };

  const handleMapLoad = (mapInstance) => {
    mapInstance.addListener('zoom_changed', () => {
      setZoomLevel(mapInstance.getZoom());
    });
  };

  /* const center = locations.length > 0 ? { lat: locations[0].lat, lng: locations[0].lng } : { lat: 24.7136, lng: 46.6753 };
const center = lastKnownLocations.length > 0
? { lat: lastKnownLocations[0].lat, lng: lastKnownLocations[0].lng }
: { lat: 24.7136, lng: 46.6753 };
// if (!isMapLoaded) {
// return <div className="loading-message">Loading Map...</div>;
// }*/

  const handleMarkerClick = async (gpsNumber, location) => {
    setExpandedMotorcycleId(null); // Close dropdowns when a marker is clicked
    setZoomLevel(20); // Set zoom level to 150%

    // Find the motorcycle in the static data that matches the company name
    const clickedMotorcycle = staticMotorcycleData.find(
      (motorcycle) =>
        motorcycle.gpsNumber === gpsNumber &&
        motorcycle.shortCompanyName === CompanyName
    );

    if (clickedMotorcycle) {
      // Handle static motorcycle
      setMotorcycleDetails({
        MotorcycleID: clickedMotorcycle.MotorcycleID || 'N/A',
        GPSnumber: clickedMotorcycle.gpsNumber || 'N/A',
        Type: clickedMotorcycle.Type || 'N/A',
        LicensePlate: clickedMotorcycle.LicensePlate || 'N/A',
      });

      setDriverDetails({
        DriverID: clickedMotorcycle.driverID || 'N/A',
        Fname: clickedMotorcycle.driverName.split(' ')[0] || 'N/A', // First name
        Lname: clickedMotorcycle.driverName.split(' ')[1] || 'N/A', // Last name
        PhoneNumber: clickedMotorcycle.phoneNumber || 'N/A',
      });

      setSelectedLocation(location); // Set selected location for InfoWindow
    } else {
      // Handle dynamic motorcycle if not found in static data
      const driverQuery = query(
        collection(db, 'Driver'),
        where('GPSnumber', '==', gpsNumber)
      );

      const driverSnapshot = await getDocs(driverQuery);
      if (!driverSnapshot.empty) {
        const driverData = driverSnapshot.docs[0].data();
        setDriverDetails({
          DriverID: driverData.DriverID || 'N/A',
          Fname: driverData.Fname || 'N/A',
          Lname: driverData.Lname || 'N/A',
          PhoneNumber: driverData.PhoneNumber || 'N/A',
        });

        // Fetch the motorcycle details dynamically
        const motorcycleQuery = query(
          collection(db, 'Motorcycle'),
          where('GPSnumber', '==', gpsNumber)
        );

        const motorcycleSnapshot = await getDocs(motorcycleQuery);
        if (!motorcycleSnapshot.empty) {
          const motorcycleData = motorcycleSnapshot.docs[0].data();
          setMotorcycleDetails({
            MotorcycleID: motorcycleData.MotorcycleID || 'N/A',
            GPSnumber: motorcycleData.GPSnumber || 'N/A',
            Type: motorcycleData.Type || 'N/A',
            LicensePlate: motorcycleData.LicensePlate || 'N/A',
          });
          setSelectedLocation(location); // Set the selected location
        } else {
          // Handle case where no motorcycle data is found
          setMotorcycleDetails({
            MotorcycleID: 'N/A',
            GPSnumber: 'N/A',
            Type: 'N/A',
            LicensePlate: 'N/A',
          });
        }
      } else {
        // Handle case when no driver is found
        setDriverDetails({
          DriverID: 'N/A',
          Fname: 'N/A',
          Lname: 'N/A',
          PhoneNumber: 'N/A',
        });

        setMotorcycleDetails({
          MotorcycleID: 'N/A',
          GPSnumber: 'N/A',
          Type: 'N/A',
          LicensePlate: 'N/A',
        });
      }
    }
  };

  const handleListItemClick = (motorcycleId) => {
    const clickedLocation = lastKnownLocations.find(
      (loc) => loc.MotorcycleID === motorcycleId
    );
    if (clickedLocation) {
      setActiveMotorcycleId(motorcycleId); // Set the clicked motorcycle as active
      setSelectedLocation(clickedLocation); // Set the selected location
    }
  };

  const handleMotorcycleClick = (motorcycleId) => {
    const clickedLocation = lastKnownLocations.find(
      (loc) => loc.MotorcycleID === motorcycleId
    );
    if (clickedLocation) {
      setActiveMotorcycleId(motorcycleId); // Set the clicked motorcycle as active
      setSelectedLocation(clickedLocation); // Set the selected location
    }
  };

  const toggleExpand = (motorcycleID) => {
    setExpandedMotorcycleIds((prev) => {
      return prev.includes(motorcycleID)
        ? prev.filter((id) => id !== motorcycleID) // Collapse if already expanded
        : [...prev, motorcycleID]; // Expand this motorcycle
    });
  };

  const capitalizeName = (name) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const filteredMotorcycleData = motorcycleData.filter((item) => {
    const matchesSearch =
      item.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.driverID.toLowerCase().includes(searchQuery.toLowerCase());
    // const matchesFilter = selectedStatus === "" || item.shortCompanyName === selectedStatus;
    // console.log("Filtering based on:", selectedStatus);

    // console.log('vvvvvvvvvvvvvvvvvvvvvvvvvvv');
    //   console.log(lastKnownLocations);

    return matchesSearch;
  });

  const handleSelect = (value) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];

    setSelectedValues(newSelection);

    const newStatus = newSelection.filter(
      (val) => val === 'Active' || val === 'Inactive'
    );

    setFilters({ status: newStatus });
  };

  const staticMotorcycleData = [
    {
      MotorcycleID: '5000000001',
      gpsNumber: '123456789012345',
      lat: 24.7137,
      lng: 46.6753,
      driverName: 'Mohammed Al-Farsi',
      driverID: '4455500001',
      phoneNumber: '+966512345678',
      shortCompanyName: 'Jahez',
      Type: 'T4A',
      LicensePlate: '123 XYZ',
      status: 'Active',
    },
    {
      MotorcycleID: '5000000002',
      gpsNumber: '1234555555555557',
      lat: 24.7137,
      lng: 46.6753,
      driverName: 'Saad Al Askar',
      driverID: '12358711183',
      phoneNumber: '+966516666660',
      shortCompanyName: 'Hungerstation',
      Type: 'X',
      LicensePlate: '155 XYZ',
      status: 'Active',
    },
    {
      MotorcycleID: '5000000003',
      gpsNumber: '123456789012347',
      lat: 24.7137,
      lng: 46.6753,
      driverName: 'Omar Al-Salem',
      driverID: '12358790983',
      phoneNumber: '+966512345680',
      shortCompanyName: 'Jahez',
      Type: 'VX',
      LicensePlate: 'XYZ 125',
      status: 'Active',
    },
    {
      MotorcycleID: '5000000004',
      gpsNumber: '123456789012348',
      lat: 24.7137,
      lng: 46.6753,
      driverName: 'Yusuf Al-Jabir',
      driverID: '9865743564',
      phoneNumber: '+966512345681',
      shortCompanyName: 'Hungerstation',
      Type: '6XX',
      LicensePlate: '126 XYZ',
      status: 'Active',
    },
    {
      MotorcycleID: '5000000005',
      gpsNumber: '123456789012349',
      lat: 24.715,
      lng: 46.6758,
      driverName: 'Sami Al-Dossary',
      driverID: '19354675895',
      phoneNumber: '+966512345682',
      shortCompanyName: 'Jahez',
      Type: 'TD',
      LicensePlate: 'XYZ 127',
      status: 'Active',
    },
    {
      MotorcycleID: '5000000006',
      gpsNumber: '123456789012350',
      lat: 24.7153,
      lng: 46.678,
      driverName: 'Fahad Al-Hamdan',
      driverID: '1357865476',
      phoneNumber: '+966512345683',
      shortCompanyName: 'Hungerstation',
      Type: 'E',
      LicensePlate: '128 XYZ',
      status: 'Inactive',
    },
    {
      MotorcycleID: '5000000007',
      gpsNumber: '123456789012351',
      lat: 24.721,
      lng: 46.6765,
      driverName: 'Zaid Al-Fahad',
      driverID: '1265879886',
      phoneNumber: '+966512345684',
      shortCompanyName: 'Jahez',
      Type: 'CXC',
      LicensePlate: 'XYZ 129',
      status: 'Inactive',
    },
    {
      MotorcycleID: '5000000008',
      gpsNumber: '123456789012352',
      lat: 24.73,
      lng: 46.67,
      driverName: 'Nasser Al-Qassem',
      driverID: '3456008643',
      phoneNumber: '+966512345685',
      shortCompanyName: 'Hungerstation',
      Type: 'PO1',
      LicensePlate: '130 XYZ',
      status: 'Inactive',
    },
    {
      MotorcycleID: '5000000009',
      gpsNumber: '123456789012353',
      lat: 24.734,
      lng: 46.89,
      driverName: 'Salman Al-Harbi',
      driverID: '8363939449',
      phoneNumber: '+966512345686',
      shortCompanyName: 'Jahez',
      Type: 'HW',
      LicensePlate: 'XYZ 131',
      status: 'Inactive',
    },
    {
      MotorcycleID: '5000000010',
      gpsNumber: '123456789012354',
      lat: 24.74,
      lng: 46.8,
      driverName: 'Khalid Al-Badri',
      driverID: '1136988810',
      phoneNumber: '+966512345687',
      shortCompanyName: 'Hungerstation',
      Type: 'T4',
      LicensePlate: '132 XYZ',
      status: 'Inactive',
    },
    {
      MotorcycleID: '5000000011',
      gpsNumber: '123456789012355',
      lat: 24.75,
      lng: 46.6,
      driverName: 'Faisal Al-Amin',
      driverID: '4457355111',
      phoneNumber: '+966512345688',
      shortCompanyName: 'Jahez',
      Type: 'CXC',
      LicensePlate: '133 XYZ',
      status: 'Inactive',
    },
  ];

  const filteredMotorcycles = motorcycleData.filter((item) => {
    const matchesSearch =
      item.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.driverID.toLowerCase().includes(searchQuery.toLowerCase());

    // Determine the actual status (either from gpsState or fallback to m.status)
    let motorcycleStatus = '';
    const isActive = (gpsState.active || []).some(
      (item) => item.gpsNumber === m.gpsNumber
    );
    const isInactive = (gpsState.inactive || []).some(
      (item) => item.gpsNumber === m.gpsNumber
    );

    if (isActive) {
      motorcycleStatus = 'Active';
    } else if (isInactive) {
      motorcycleStatus = 'Inactive';
    } else if (item.status) {
      motorcycleStatus = item.status; // Ensure you are using item.status here
    }

    const statusMatch =
      filterStatus.length === 0 ||
      filterStatus.includes('All') ||
      filterStatus.includes(motorcycleStatus);

    return matchesSearch && statusMatch;
  });

  useEffect(() => {
    console.log('Updated lastKnownLocations', lastKnownLocations);
  }, [lastKnownLocations]);
  const filteredStaticMotorcycles = staticMotorcycleData.filter(
    (motorcycle) => motorcycle.shortCompanyName === CompanyName
  );

  const fullHeatmapData = [
    ...gpsState.active,
    ...gpsState.inactive,
    ...filteredStaticMotorcycles,
  ].map((loc) => {
    const matchingMotorcycle = motorcycleData.find(
      (m) => m.gpsNumber === loc.gpsNumber
    );
    return {
      ...loc,
      shortCompanyName:
        matchingMotorcycle?.shortCompanyName || loc.shortCompanyName || null,
      motorcycleID: matchingMotorcycle?.motorcycleID || null,
      driverName: matchingMotorcycle?.driverName || '',
      driverID: matchingMotorcycle?.driverID || '',
    };
  });

  const filteredHeatmapData = fullHeatmapData.filter((m) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      m.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.driverID?.toLowerCase().includes(searchQuery.toLowerCase());

    const isActive = gpsState.active?.some(
      (item) => item.gpsNumber === m.gpsNumber
    );
    const isInactive = gpsState.inactive?.some(
      (item) => item.gpsNumber === m.gpsNumber
    );

    const motorcycleStatus = isActive
      ? 'Active'
      : isInactive
      ? 'Inactive'
      : m.status || '';

    const statusMatch =
      filterStatus.length === 0 ||
      filterStatus.includes('All') ||
      filterStatus.includes(motorcycleStatus);

    return matchesSearch && statusMatch;
  });

  useEffect(() => {
    setMapRefreshKey((prev) => prev + 1);
  }, [lastKnownLocations]);

  // Add this inside the HeatMap component after all the existing useEffect blocks

  // Update this to match the GDTMap pattern for refreshing heatmap data
  const memoizedFilteredData = React.useMemo(
    () => filteredHeatmapData.filter((motor) => motor.lat && motor.lng),
    [filteredHeatmapData]
  );

  // Use useCallback to create a stable transform function
  const transformToLatLng = React.useCallback((items) => {
    return items.map(
      (motor) => new window.google.maps.LatLng(motor.lat, motor.lng)
    );
  }, []);

  // Create a memoized version of the heatmap data
  const memoizedHeatmapData = React.useMemo(
    () => transformToLatLng(memoizedFilteredData),
    [memoizedFilteredData, transformToLatLng]
  );

  // Set heatmap data with this stable reference
  React.useEffect(() => {
    if (window.google && window.google.maps) {
      setHeatmapData(memoizedHeatmapData);
    }
  }, [memoizedHeatmapData]);

  // Add this function to animate marker movements
  const animateMarker = useCallback(
    (gpsNumber, startLat, startLng, endLat, endLng) => {
      // Calculate heading (direction) in degrees
      const dx = endLng - startLng;
      const dy = endLat - startLat;
      const heading = (Math.atan2(dy, dx) * 180) / Math.PI;

      // Store the heading for this marker
      setMarkerHeadings((prev) => ({
        ...prev,
        [gpsNumber]: heading,
      }));

      // Set flag that this marker is animating
      setAnimatingMarkers((prev) => ({
        ...prev,
        [gpsNumber]: true,
      }));

      // Animation settings
      const duration = 1000; // 1 second animation
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use easeInOut for smoother motion
        const easeProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI);

        // Calculate current position
        const currentLat = startLat + (endLat - startLat) * easeProgress;
        const currentLng = startLng + (endLng - startLng) * easeProgress;

        // Update marker position
        setMarkerPositions((prev) => ({
          ...prev,
          [gpsNumber]: { lat: currentLat, lng: currentLng },
        }));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete
          setAnimatingMarkers((prev) => ({
            ...prev,
            [gpsNumber]: false,
          }));
        }
      };

      requestAnimationFrame(animate);
    },
    []
  );

  // Initialize marker positions on first load
  useEffect(() => {
    if (initialLoad && lastKnownLocations.length > 0) {
      const initialPositions = {};

      lastKnownLocations.forEach((loc) => {
        if (loc.gpsNumber && loc.lat && loc.lng) {
          initialPositions[loc.gpsNumber] = {
            lat: loc.lat,
            lng: loc.lng,
          };
        }
      });

      setMarkerPositions(initialPositions);
    }
  }, [initialLoad, lastKnownLocations]);

  return (
    <div style={{ display: 'flex', height: '80vh' }}>
      <div
        style={{
          width: '400px',
          flexShrink: 0,
          padding: '10px',
          borderRight: '1px solid #ccc',
          backgroundColor: '#f9f9f9',
          overflowY: 'auto',
          maxHeight: '590px',
        }}
      >
        <h4 style={{ color: 'green', fontSize: '25px', marginBottom: '10px' }}>
          Motorcycle List
        </h4>
        <div
          style={{
            flexDirection: 'column',
            marginBottom: '20px',
            alignItems: 'flex-start',
          }}
        >
          {/* Search Bar */}

          <div
            className={s.searchInputs}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            <div
              className={s.searchContainer}
              style={{ display: 'flex', alignItems: 'center', width: '100%' }}
            >
              <SearchOutlined
                style={{
                  color: '#059855',
                  marginRight: '3px',
                  marginLeft: '-55px',
                }}
              />

              <input
                type='text'
                placeholder='Search by Driver ID or Driver Name'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '230px',

                  height: '20px', // Ensures consistent height

                  borderRadius: '20px', // Round corners

                  border: 'none', // Remove border

                  backgroundColor: 'transparent', // Transparent background

                  padding: '0 0 0 0px', // Left padding to give space for icon

                  boxSizing: 'border-box', // Include padding in width

                  outline: 'none', // Remove outline on focus
                }}
              />
            </div>
          </div>

          {/* Filter Dropdown */}

          {/* <div className={q.searchContainer} >
                <div className={`${q.selectWrapper} ${q.dropdownContainer}`} style={{  width: '355px' ,marginLeft:'-11px'}}>
                  <FaFilter className={q.filterIcon}  style={{  marginLeft:'20px' }}/>
                  <div style={{ position: 'relative', width: '510px'}}>
                    <div
                      onClick={toggleDropdown}
                      style={{
                        padding: '8px',
                        backgroundColor: 'transparent', // Make background transparent
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'border 0.3s',
                        color: 'grey', // Set text color to grey
                        lineHeight: '1.0', 
                        fontSize:'14px',
                        
                      }}
                    >
                    {selectedValues.length > 0 ? selectedValues.join(', ') : 'Filter map'}

                    </div>

{dropdownOpen && (
  <div
    style={{
      position: 'absolute',
      background: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      zIndex: 1000,
      width: '350px',
      left: '-40px',
    }}
  >
    <div style={{ padding: '10px', fontWeight: 'bold' }}>Company</div>
    {combinedOptions
  .filter(combinedOptions => combinedOptions.category === "Company")
  .map(combinedOptions => (
    <div key={combinedOptions.value} style={{ padding: '10px', cursor: 'pointer' }}>
      <label style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={selectedValues.includes(combinedOptions.value)}
          onChange={() => handleSelect(combinedOptions.value)}
          style={{ marginRight: '10px' }}
        />
        {combinedOptions.label}
      </label>
  </div>
))}

<div style={{ padding: '10px', fontWeight: 'bold' }}>Status</div>
{combinedOptions.filter(combinedOptions => combinedOptions.category === "Status").map((combinedOptions) => (
  <div key={combinedOptions.value} style={{ padding: '10px', cursor: 'pointer' }}>
    <label style={{ display: 'flex', alignItems: 'center' }}>
      <input
        type="checkbox"
        checked={selectedValues.includes(combinedOptions.value)}
        onChange={() => handleSelect(combinedOptions.value)}
        style={{ marginRight: '10px' }}
      />
      {combinedOptions.label}
    </label>
  </div>
))}


    <div style={{ padding: '10px', textAlign: 'center' }}>
      <button
        onClick={() => {
          setSelectedValues([]);
          setFilters({ company: [], status: [] });
          toggleDropdown();
        }}
        style={{
          backgroundColor: 'transparent',
          color: 'blue',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 0',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
        }}
      >
        Reset Filter
      </button>
    </div>
  </div>
)}
</div>
                </div>
              </div> */}
          {/* Status Filter */}
          <div className={m.searchContainer} ref={typeDropdownRef}>
            <div className={f.selectWrapper} style={{ width: '380px' }}>
              <FaFilter
                style={{
                  color: '#1c7a50',
                  marginRight: '60px',
                  width: '15px',
                }}
              />
              <div
                className={f.customSelect}
                onClick={toggleTypeDropdown}
                style={{ marginLeft: '-50px' }}
              >
                <span style={{ color: filterStatus ? 'grey' : 'black' }}>
                  {filterStatus === 'All' ? 'Filter by Status' : filterStatus}
                </span>
                <div className={f.customArrow}>▼</div>
              </div>

              {isTypeOpen && (
                <div className={f.dropdownMenu}>
                  {['All', 'Active', 'Inactive'].map((status) => (
                    <div
                      key={status}
                      className={f.dropdownOption}
                      onClick={() => handleStatusClick(status)}
                      style={{ color: 'black' }} // Ensure dropdown options are black
                    >
                      {status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <ul style={{ listStyleType: 'none', padding: '0' }}>
          {searchQuery?.length > 0 && filteredMotorcycles.length === 0 ? (
            <li style={{ padding: '20px', textAlign: 'center', color: 'grey' }}>
              <div style={{ marginBottom: '10px' }}>
                <FaExclamationTriangle
                  style={{ color: 'grey', fontSize: '24px' }}
                />
              </div>
              No motorcycles available based on the selected filters and search.
            </li>
          ) : (
            filteredMotorcycles
              .sort((a, b) =>
                (a.driverName || '').localeCompare(b.driverName || '')
              )
              .map((item, index) => {
                const isStaticMotorcycle =
                  staticMotorcycleData.some(
                    (staticItem) =>
                      staticItem.MotorcycleID === item.motorcycleID
                  ) ||
                  staticMotorcycleData.some(
                    (staticItem) =>
                      staticItem.MotorcycleID === item.MotorcycleID
                  );

                // Determine which ID to use for expansion
                const motorcycleIDToUse =
                  item.motorcycleID || item.MotorcycleID;

                return (
                  <li
                    key={index}
                    style={{
                      position: 'relative',
                      marginBottom: '10px',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      backgroundColor: '#fff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <strong style={{ color: '#059855' }}>
                          Motorcycle ID:
                        </strong>{' '}
                        {motorcycleIDToUse} <br />
                        <strong style={{ color: '#059855' }}>
                          Driver Name:
                        </strong>{' '}
                        {capitalizeName(item.driverName)}
                        <br />
                        <strong style={{ color: '#059855' }}>
                          Status:
                        </strong>{' '}
                        {item.status === 'Active' ? (
                          <span style={{ color: 'green' }}>{item.status}</span>
                        ) : (
                          <span style={{ color: 'red' }}>{item.status}</span>
                        )}
                      </div>

                      <button
                        onClick={() => toggleExpand(motorcycleIDToUse)}
                        style={{
                          position: 'absolute',

                          top: '10px',

                          right: '0px',

                          background: 'none',

                          border: 'none',

                          cursor: 'pointer',

                          color: 'grey',

                          transition: 'color 0.3s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = '#059855')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = 'grey')
                        }
                      >
                        {expandedMotorcycleIds.includes(motorcycleIDToUse) ? (
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                          >
                            <path
                              d='M6 16 L12 10 L18 16'
                              stroke='currentColor'
                              strokeWidth='2'
                              fill='none'
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                          >
                            <path
                              d='M6 8 L12 14 L18 8'
                              stroke='currentColor'
                              strokeWidth='2'
                              fill='none'
                            />
                          </svg>
                        )}
                      </button>
                    </div>

                    {expandedMotorcycleIds.includes(motorcycleIDToUse) && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#555',
                          marginTop: '5px',
                        }}
                      >
                        <p style={{ margin: '5px 0' }}>
                          <strong style={{ color: '#059855' }}>
                            Driver ID:
                          </strong>{' '}
                          {item.driverID}
                        </p>

                        <p style={{ margin: '5px 0' }}>
                          <strong style={{ color: '#059855' }}>Phone:</strong>{' '}
                          {item.phoneNumber}
                        </p>

                        <p style={{ margin: '5px 0' }}>
                          <strong style={{ color: '#059855' }}>
                            GPS Number:
                          </strong>{' '}
                          {item.gpsNumber}
                          {item.GPSnumber}
                        </p>

                        <p style={{ margin: '5px 0' }}>
                          <strong style={{ color: '#059855' }}>Type:</strong>{' '}
                          {item.type}
                          {item.Type}
                        </p>

                        <p style={{ margin: '5px 0' }}>
                          <strong style={{ color: '#059855' }}>
                            License Plate:
                          </strong>{' '}
                          {item.licensePlate}
                          {item.LicensePlate}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            marginTop: '5px',
                          }}
                        >
                          <button
                            onClick={() =>
                              navigate(`/driver-details/${item.driverID}`, {
                                state: { from: 'Heatmap' },
                              })
                            }
                            style={{
                              backgroundColor: '#059855',

                              color: 'white',

                              border: 'none',

                              padding: '5px',

                              width: '120px',

                              cursor: 'pointer',

                              marginBottom: '5px',
                            }}
                          >
                            Full Information
                          </button>

                          <button
                            onClick={() => {
                              const clickedLocation = item;
                              console.log(
                                'Clicked Location Coordinates:',
                                item
                              );
                              if (clickedLocation) {
                                setMapCenter({
                                  lat: clickedLocation.lat,
                                  lng: clickedLocation.lng,
                                }); // Update map center
                                handleMarkerClick(
                                  clickedLocation.gpsNumber,
                                  clickedLocation
                                );
                              }
                            }}
                            style={{
                              backgroundColor: '#059855',
                              color: 'white',
                              border: 'none',
                              padding: '5px',
                              width: '120px',
                              cursor: 'pointer',
                            }}
                          >
                            Show on Map
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })
          )}
        </ul>
      </div>

      {/* The gps number in the location saved in array after that query the driver collection and motorcycle then display them in the list */}

      <div style={{ width: '100%', height: '100%', marginTop: '-35px' }}>
        <div
          style={{
            padding: '30px',
            borderRadius: '5px',
            boxShadow: '0px 2px 5px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '20px',
          }}
        >
          <label
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <input
              type='checkbox'
              checked={showMarkers}
              onChange={() => setShowMarkers(!showMarkers)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ color: '#059855', fontWeight: '500' }}>
              Show Motorcycles
            </span>
          </label>

          <label
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <input
              type='checkbox'
              checked={showHeatmap}
              onChange={() => setShowHeatmap(!showHeatmap)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ color: '#059855', fontWeight: '500' }}>
              Show Heatmap
            </span>
          </label>
        </div>

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={zoomLevel}
          onLoad={handleMapLoad}
          // options={{ styles: beigeMapStyle }}
          onClick={() => setSelectedLocation(null)}
          // onLoad={() => setIsMapLoaded(true)}
        >
          {/* Only render heatmap when showHeatmap is true */}
          <HeatMapWrapper
            heatmapData={heatmapData}
            visible={showHeatmap && heatmapData.length > 0}
          />

          {/* Only render markers when showMarkers is true */}
          {showMarkers &&
            filteredHeatmapData.map((item, index) => {
              // Get current animated position if available
              const animatedPosition = markerPositions[item.gpsNumber];
              const heading = markerHeadings[item.gpsNumber] || 0;

              // Use animated position if available, otherwise use the static position
              const position = animatedPosition
                ? {
                    lat: animatedPosition.lat,
                    lng: animatedPosition.lng,
                  }
                : {
                    lat: item.lat,
                    lng: item.lng,
                  };

              // Add a small offset to prevent overlapping markers
              const offset = 0.000003 * index;

              return (
                <MarkerF
                  key={`${item.gpsNumber}-${position.lat}-${position.lng}`}
                  position={{
                    lat: position.lat + offset,
                    lng: position.lng + offset,
                  }}
                  icon={getMotorcycleIcon(zoomLevel, heading)}
                  onClick={() =>
                    handleMarkerClick(item.gpsNumber, {
                      ...item,
                      lat: position.lat,
                      lng: position.lng,
                    })
                  }
                  // Add a little bounce animation for active markers that are moving
                  animation={
                    animatingMarkers[item.gpsNumber] && item.status === 'Active'
                      ? window.google.maps.Animation.BOUNCE
                      : null
                  }
                />
              );
            })}

          {selectedLocation && (
            <InfoWindowF
              position={{
                lat: selectedLocation.lat + 0.00005,
                lng: selectedLocation.lng,
              }}
              onCloseClick={() => {
                setSelectedLocation(null);
                setDriverDetails(null);
                setMotorcycleDetails(null);
              }}
              options={{ pixelOffset: new window.google.maps.Size(0, -40) }} // Adjust offset if needed
            >
              <div style={{ margin: 0, padding: '10px', lineHeight: '1.5' }}>
                <h4
                  style={{
                    color: '#059855',
                    margin: '-13px -10px 0px',
                    padding: '-10px',
                  }}
                >
                  Driver Information
                </h4>
                <p style={{ margin: '0' }}>
                  <strong style={{ color: '#059855' }}>Driver ID:</strong>{' '}
                  {driverDetails?.DriverID || 'N/A'}
                </p>
                <p style={{ margin: '0' }}>
                  <strong style={{ color: '#059855' }}>Name:</strong>{' '}
                  {driverDetails
                    ? `${capitalizeFirstLetter(
                        driverDetails.Fname
                      )} ${capitalizeFirstLetter(driverDetails.Lname)}`
                    : 'N/A'}
                </p>
                <p style={{ margin: '0' }}>
                  <strong style={{ color: '#059855' }}>Phone:</strong>{' '}
                  {driverDetails?.PhoneNumber || 'N/A'}
                </p>
                <hr></hr>
                <h4 style={{ color: '#059855', margin: '-13px -10px 0px' }}>
                  Motorcycle Information
                </h4>
                <p style={{ margin: '0' }}>
                  <strong style={{ color: '#059855' }}>ID:</strong>{' '}
                  {motorcycleDetails?.MotorcycleID || 'N/A'}
                </p>
                <p style={{ margin: '0' }}>
                  <strong style={{ color: '#059855' }}>GPS Number:</strong>{' '}
                  {motorcycleDetails?.GPSnumber || 'N/A'}
                </p>
                <p style={{ margin: '0' }}>
                  <strong style={{ color: '#059855' }}>Type:</strong>{' '}
                  {motorcycleDetails?.Type || 'N/A'}
                </p>
                <p style={{ margin: '0' }}>
                  <strong style={{ color: '#059855' }}>License Plate:</strong>{' '}
                  {motorcycleDetails?.LicensePlate || 'N/A'}
                </p>
                <button
                  onClick={() =>
                    navigate(`/driver-details/${driverDetails?.DriverID}`, {
                      state: { from: 'Heatmap' },
                    })
                  }
                  style={{
                    backgroundColor: '#059855',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    width: '120px',
                    marginLeft: '100px',
                    marginTop: '10px',
                    marginBottom: '-25px',
                  }}
                >
                  Full Information
                </button>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default HeatMap;
