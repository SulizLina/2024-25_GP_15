import React from 'react';
import ReactDOM from 'react-dom/client'; 
import App from './App'; 
import { ConfigProvider } from 'antd';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
       <ConfigProvider
    theme={{
      token: {
        // Seed Token
        colorPrimary: '#3CC585',
        borderRadius: 5,
      },
     
     
    }}
   >
   <App />
   </ConfigProvider>
  </React.StrictMode>
);
 