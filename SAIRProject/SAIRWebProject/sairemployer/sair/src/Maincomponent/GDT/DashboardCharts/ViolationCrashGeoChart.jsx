import React, { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, where, query } from 'firebase/firestore';
import { ResponsiveContainer } from 'recharts';
import { GoogleMap, MarkerF } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '600px', margin: 'auto' };

const ViolationCrashGeoChart = () => {
  const [districtData, setDistrictData] = useState([]);
  const [selectedOption, setSelectedOption] = useState('All');
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const options = ['All', 'Violation', 'Crash'];
  const [mapCenter] = useState({ lat: 24.6986, lng: 46.6853 }); // Initial center only
  const [zoomLevel] = useState(11); // Initial zoom only
  const mapRef = useRef(null);

  // useCallback prevents recreation of this function on re-renders
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Alias map for Arabic neighborhoods
  const aliasMap = {
    'حي الملقا': 'Al Malqa',
    الملقا: 'Al Malqa',
    ملقا: 'Al Malqa',
  };

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const handleOptionClick = (opt) => {
    setSelectedOption(opt);
    setDropdownOpen(false);
  };

  // Geocode: prioritize English sublocalities/neighborhoods and skip generic locality 'Riyadh'

  const getDistrict = async (latitude, longitude) => {
    const geocoder = new window.google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { location: { lat: latitude, lng: longitude } },
        (results, status) => {
          if (status === 'OK' && results.length > 0) {
            const addressComponents = results[3].address_components;
            console.log('Geocode Results:', results);
            console.log('Address Components:', addressComponents);
            // Try to get neighborhood first (most specific)
            const neighborhood = addressComponents.find(
              (component) =>
                component.types.includes('neighborhood') ||
                component.types.includes('sublocality_level_1')
            );

            // If no neighborhood found, try for sublocality
            const sublocality = addressComponents.find((component) =>
              component.types.includes('sublocality')
            );

            // If neither found, fall back to district
            const district = addressComponents.find((component) =>
              component.types.includes('administrative_area_level_2')
            );

            // Use the most specific result available
            const areaName = neighborhood
              ? neighborhood.short_name
              : sublocality
              ? sublocality.short_name
              : district
              ? district.short_name
              : 'Area not found';

            resolve(areaName);
          } else {
            reject('Geocoding failed: ' + status);
          }
        }
      );
    });
  };

  // Function to get district name based on latitude and longitude
  //
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const [vSnap, cSnap] = await Promise.all([
          getDocs(collection(db, 'Violation')),
          getDocs(
            query(
              collection(db, 'Crash'),
              where('Status', '==', 'Emergency SOS')
            )
          ),
        ]);
        const events = [];
        vSnap.forEach((doc) => {
          const d = doc.data();
          if (d.time && d.position)
            events.push({ ...d.position, type: 'violation' });
        });
        cSnap.forEach((doc) => {
          const d = doc.data();
          if (d.time && d.position)
            events.push({ ...d.position, type: 'crash' });
        });

        const enriched = await Promise.all(
          events.map(async (ev) => {
            const district = await getDistrict(ev.latitude, ev.longitude);
            console.log(
              `District for event at ------------------>>> ${ev.latitude}, ${ev.longitude}: ${district}`
            );
            return { ...ev, district };
          })
        );

        const mapAgg = new Map();
        enriched.forEach((ev) => {
          const name = (ev.district || 'Unknown').trim();
          if (!mapAgg.has(name)) {
            mapAgg.set(name, {
              violation: 0,
              crash: 0,
              latSum: 0,
              lngSum: 0,
              count: 0,
            });
          }
          const entry = mapAgg.get(name);
          entry[ev.type]++;
          entry.latSum += ev.latitude;
          entry.lngSum += ev.longitude;
          entry.count++;
        });

        const dataArr = Array.from(mapAgg.entries()).map(([district, e]) => ({
          district,
          violation: e.violation,
          crash: e.crash,
          total: e.violation + e.crash,
          position: { lat: e.latSum / e.count, lng: e.lngSum / e.count },
        }));

        if (mounted) setDistrictData(dataArr);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);
  const filteredMapData = districtData.filter((d) => {
    if (selectedOption === 'All') return true;
    return selectedOption === 'Violation' ? d.violation > 0 : d.crash > 0;
  });

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <div
        style={{
          width: '100%',
          height: '400px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {/* Map Container */}
        <div
          style={{
            width: '48%',
            height: '100%',
            position: 'relative',
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            background: '#f4f4f4',
          }}
        >
          {/* Dropdown Filter */}
          <div
            className='searchContainer'
            style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
          >
            <div
              className='selectWrapper'
              style={{
                border: '2px solid #4CAF50',
                backgroundColor: '#fff',
                borderRadius: 5,
                padding: 5,
              }}
            >
              <div
                onClick={toggleDropdown}
                style={{
                  cursor: 'pointer',
                  padding: '5px 10px',
                  width: 200,
                  position: 'relative',
                  textAlign: 'left',
                }}
              >
                {selectedOption === 'All'
                  ? 'Filter by Incident Type'
                  : selectedOption}
                <span
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                  }}
                >
                  <i
                    className='fas fa-chevron-down'
                    style={{ marginLeft: 8 }}
                  ></i>
                </span>
              </div>
              {isDropdownOpen && (
                <div
                  className='dropdownMenu'
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 5,
                    zIndex: 1000,
                  }}
                >
                  {options.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => handleOptionClick(opt)}
                      style={{ padding: 10, cursor: 'pointer' }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = '#f0f0f0')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Google Map */}
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter} // Initial center
            zoom={zoomLevel} // Initial zoom
            onLoad={onMapLoad}
            options={{
              fullscreenControl: false,
              mapTypeControl: false,
              streetViewControl: false,
              gestureHandling: 'greedy',
            }}
          >
            {filteredMapData.map((d, i) => {
              const count =
                selectedOption === 'All'
                  ? d.total
                  : selectedOption === 'Violation'
                  ? d.violation
                  : d.crash;
              const validPosition =
                d.position &&
                typeof d.position.lat === 'number' &&
                typeof d.position.lng === 'number'
                  ? { lat: d.position.lat, lng: d.position.lng }
                  : { lat: mapCenter.lat, lng: mapCenter.lng }; // fallback to map center

              return (
                <MarkerF
                  key={i}
                  position={validPosition}
                  label={{
                    text: String(count),
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: 'red',
                    fillOpacity: 1,
                    scale: 20,
                    strokeWeight: 0,
                  }}
                />
              );
            })}
          </GoogleMap>
        </div>

        {/* Table Container */}
        <div
          style={{
            width: '48%',
            height: '100%',
            background: '#fff',
            borderRadius: '15px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            padding: '0 20px 20px',
            overflow: 'hidden',
          }}
        >
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead
                style={{
                  position: 'sticky',
                  top: 0,
                  background: '#FAFAFA',
                  zIndex: 1,
                }}
              >
                <tr style={{ color: '#000000E0' }}>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'left',
                      borderBottom: '2px solid #ddd',
                    }}
                  >
                    Neighborhood Name
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'left',
                      borderBottom: '2px solid #ddd',
                    }}
                  >
                    Number of Violations
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'left',
                      borderBottom: '2px solid #ddd',
                    }}
                  >
                    Number of Crashes
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'left',
                      borderBottom: '2px solid #ddd',
                    }}
                  >
                    Total Incidents
                  </th>
                </tr>
              </thead>
              <tbody>
                {districtData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ textAlign: 'center', padding: '20px' }}
                    >
                      Loading data...
                    </td>
                  </tr>
                ) : (
                  districtData.map((d, idx) => (
                    <tr key={idx}>
                      <td
                        style={{
                          padding: '10px',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        {d.district}
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        {d.violation}
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        {d.crash}
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          borderBottom: '1px solid #ddd',
                        }}
                      >
                        {d.total}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
};

export default ViolationCrashGeoChart;
