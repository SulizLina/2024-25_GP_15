import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  doc,
  onSnapshot,
  deleteDoc,
  query,
  where,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import EyeIcon from "../images/eye.png";
import { FaEye } from "react-icons/fa"; 
import successImage from "../images/Sucess.png";
import errorImage from "../images/Error.png";
import { SearchOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import { Button, Table, Modal, Pagination } from "antd";
import Header from './Header';
import "../css/CustomModal.css";
import s from "../css/DriverList.module.css";
import { useNavigate } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";

const DriverList = () => {
  const [driverData, setDriverData] = useState([]);
  const [driverToRemove, setDriverToRemove] = useState(null);
  const [availableMotorcycles, setAvailableMotorcycles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(true);
  const navigate = useNavigate();
  const goBack = () => navigate(-1); // Go back to the previous page
  const employerUID = sessionStorage.getItem("employerUID");
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const columns = [
    {
      title: "Driver ID",
      dataIndex: "DriverID",
      key: "DriverID",
      align: "center",
    },
    {
      title: "Driver Name",
      dataIndex: "DriverName",
      key: "DriverName",
      align: "center",
      render: (text, record) => (
        <span>{capitalizeFirstLetter(`${record.Fname} ${record.Lname}`)}</span>
      ),
    },
    {
      title: "Phone Number",
      dataIndex: "PhoneNumber",
      key: "PhoneNumber",
      align: "center",
    },
    {
      title: "Email",
      dataIndex: "Email",
      key: "Email",
      align: "center",
      render: (text) => (
        <a
          href={`mailto:${text}`}
          style={{
            color: "black",
            textDecoration: "underline",
            transition: "color 0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "green")} // Change color on hover
          onMouseLeave={(e) => (e.currentTarget.style.color = "black")} // Revert color on mouse leave
        >
          {text}
        </a>
      ),
    },
    {
      title: "Violations Details",
      key: "Details",
      align: "center",
      render: (text, record) => (
<FaEye
    style={{ cursor: "pointer", fontSize: "1.5em" , color:'#059855'}} // Adjust size as needed
    onClick={() => viewDriverDetails(record.DriverID)}
  />
      ),
    },
  ];

  const filteredData = driverData.filter((driver) => {
    const fullName = `${driver.Fname || ""} ${
      driver.Lname || ""
    }`.toLowerCase();
    const driverID = (driver.DriverID || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return driverID.includes(query) || fullName.includes(query);
  });

  useEffect(() => {
    const fetchRecklessDrivers = async () => {
      try {
        // Step 1: Fetch drivers with count30
        const count30Query = query(
          collection(db, "Violation"),
          where("count30", ">=", 1)
        );

        const count30Snapshot = await getDocs(count30Query);
        console.log("Count30 Snapshot:", count30Snapshot.docs);

        const recklessDrivers = {};
        console.log("Processing Count30 Drivers:");

        count30Snapshot.docs.forEach((doc) => {
          const data = doc.data();
          console.log(`Count30 DriverID: ${data.driverID}`);
          if (data.driverID) {
            if (!recklessDrivers[data.driverID]) {
              recklessDrivers[data.driverID] = {
                id: doc.id,
                ...data,
              };
              console.log(`Added to Reckless Drivers: ${data.driverID}`);
            }
          }
        });

        // Step 2: Fetch drivers with count50
        const count50Query = query(
          collection(db, "Violation"),
          where("count50", ">=", 1)
        );

        const count50Snapshot = await getDocs(count50Query);
        console.log("Processing Count50 Drivers:");

        count50Snapshot.docs.forEach((doc) => {
          const data = doc.data();
          console.log(`Count50 DriverID: ${data.driverID}`);
          if (data.driverID) {
            if (!recklessDrivers[data.driverID]) {
              recklessDrivers[data.driverID] = {
                id: doc.id,
                ...data,
              };
              console.log(`Added to Reckless Drivers: ${data.driverID}`);
            } else {
              console.log(`Driver already exists: ${data.driverID}`);
              recklessDrivers[data.driverID].count50 = data.count50; // Combine counts
            }
          }
        });

        console.log("Reckless Drivers:", recklessDrivers);

        // Step 3: Fetch driver details from the Driver table
        const driverIDs = Object.keys(recklessDrivers);

        // Use Promise.all to fetch all driver details in parallel
        const driverDetailsPromises = driverIDs.map(async (id) => {
          const driverQuery = query(
            collection(db, "Driver"),
            where("DriverID", "==", id)
          );
          const driverSnapshot = await getDocs(driverQuery);
          if (!driverSnapshot.empty) {
            const driverData = driverSnapshot.docs[0].data();
            return {
              ...recklessDrivers[id],
              ...driverData, // Merge driver data
            };
          }
          return recklessDrivers[id]; // Return reckless driver if no match found
        });

        const detailedRecklessDrivers = await Promise.all(
          driverDetailsPromises
        );

        console.log("Detailed Reckless Drivers:", detailedRecklessDrivers);
        setDriverData(detailedRecklessDrivers);
      } catch (error) {
        console.error("Error fetching reckless drivers:", error);
      }
    };
    const fetchMotorcycles = () => {
      const motorcycleQuery = query(collection(db, "Motorcycle"));
      const unsubscribe = onSnapshot(motorcycleQuery, (snapshot) => {
        const bikes = snapshot.docs.map((doc) => ({
          id: doc.id,
          GPSnumber: doc.data().GPSnumber,
        }));
        setAvailableMotorcycles(bikes);
      });
      return () => unsubscribe();
    };

    fetchRecklessDrivers();
    fetchMotorcycles();
  }, [employerUID]);

  const viewDriverDetails = (driverID) => {
    console.log("Navigating to details for driver ID:", driverID);
    navigate(`/drivers/${driverID}/violations/reckless-drivers`);
  };

  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        console.error("Error LOGGING out:", error);
      });
  };

  return (
    <div>
      <Header active="violations" />
      <div className="breadcrumb" style={{ marginRight: "100px" }}>
        <a onClick={() => navigate("/employer-home")}>Home</a>
        <span> / </span>
        <a onClick={() => navigate("/violations")}>Violation List</a>
        <span> / </span>
        <a>Reckless Drivers List</a>
      </div>
      <main>
        <div className={s.container}>
          <h2 className={s.title}>Reckless Drivers List</h2>
          <div className={s.searchInputs}>
            <div className={s.searchContainer}>
              <SearchOutlined style={{ color: "#059855" }} />
              <input
                type="text"
                placeholder="Search by Driver ID or Driver Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "300px" }}
              />
            </div>
          </div>
        </div>
        <br />

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={false} // Disable default pagination
          style={{ width: "1200px", margin: "0 auto", marginBottom: "20px" }}
        />

        {/* Flexbox container for button and pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <Button
            onClick={goBack}
            style={{
              height: "60px",
              fontSize: "15px",
              color: "#059855",
              borderColor: "#059855",
            }}
          >
            <ArrowLeftOutlined style={{ marginRight: "8px" }} /> Go Back
          </Button>

          {/* Pagination component */}
          <Pagination
            defaultCurrent={1}
            total={filteredData.length}
            pageSize={5}
            showSizeChanger={false} // Optional: hide size changer if not needed
          />
        </div>

        

        {/* Notification Modal */}
        <Modal
          visible={isNotificationVisible}
          onCancel={() => setIsNotificationVisible(false)}
          footer={<p style={{ textAlign: "center" }}>{notificationMessage}</p>}
          style={{ top: "38%" }}
          className="custom-modal"
          closeIcon={<span className="custom-modal-close-icon">×</span>}
        >
          <div style={{ textAlign: "center" }}>
            <img
              src={isSuccess ? successImage : errorImage}
              alt={isSuccess ? "Success" : "Error"}
              style={{ width: "20%", marginBottom: "16px" }}
            />
          </div>
        </Modal>
      </main>
    </div>
  );
};

export default DriverList;
