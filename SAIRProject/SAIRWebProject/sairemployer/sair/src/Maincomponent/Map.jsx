import React from 'react';
import { LoadScript, GoogleMap, MarkerF } from '@react-google-maps/api'; 
import '../css/CustomModal.css';

const Map = ({ lat, lng, placeName }) => { 
  const containerStyle = {
    width: '50%',
    height: '400px',
     //margin: '10px 100px',Center the map horizontally
  };

  const center = {
    lat: lat,
    lng: lng,
  };
 
  // Function to open Google Maps in a new tab
  const handleMarkerClick = () => {
    console.log(`Opening Google Maps at: ${lat}, ${lng}`); // Log the coordinates
    const encodedPlaceName = encodeURIComponent(placeName); // Encode the place name
    const googleMapsUrl = `https://www.google.com/maps/place/${encodedPlaceName}/@${lat},${lng},17z`;
    window.open(googleMapsUrl, '_blank'); // Open in a new tab
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={14} 
        >
          <MarkerF 
            position={center} 
            onClick={handleMarkerClick} // Add click event to marker
          />
        </GoogleMap>
      </div>
   
  );
};

export default Map;