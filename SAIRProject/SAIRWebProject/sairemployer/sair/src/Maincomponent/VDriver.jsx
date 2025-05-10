import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Table, Button } from "antd";
import { db } from "../firebase";
import Header from "./Header";
import s from "../css/VDriver.module.css";
import EyeIcon from "../images/eye.png";
import { FaEye } from "react-icons/fa"; 
import "../css/CustomModal.css";
import { ArrowLeftOutlined } from "@ant-design/icons";


const ViolationsTable = () => {
  const { driverId, type } = useParams(); // Get driverId from URL parameters
  const [violations, setViolations] = useState([]); // State for storing violations
  const [error, setError] = useState(null); // State for error messages
  const navigate = useNavigate(); // Hook to programmatically navigate
  const [driverName, setDriverName] = useState("");
  useEffect(() => {
    if (!driverId) {
      setError("Driver ID is missing.");
      return; // Exit early if driverId is not available
    }
    const fetchViolationsAndDriver = async () => {
      try {
        // Fetch violations
        const violationsQuery = query(
          collection(db, "Violation"),
          where("driverID", "==", driverId)
        );
        const querySnapshot = await getDocs(violationsQuery);
        const violationsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const sortedViolations = violationsList.sort((a, b) => b.time - a.time);
        setViolations(sortedViolations);

        // Fetch driver information
        const driverQuery = query(
          collection(db, "Driver"),
          where("DriverID", "==", driverId)
        );
        const driverSnapshot = await getDocs(driverQuery);
        if (!driverSnapshot.empty) {
          const driverData = driverSnapshot.docs[0].data();
          setDriverName(`${driverData.Fname} ${driverData.Lname}`); // Set driver's full name
        } else {
          setDriverName("Unknown Driver"); // Default if not found
        }
      } catch (error) {
        console.error("Error fetching violations or driver info:", error);
        setError("Failed to fetch violations or driver info.");
      }
    };

    fetchViolationsAndDriver();
  }, [driverId]);
 
  const activeHeader =
    type === "reckless-drivers" ? "violations" : "driverslist";

  const formatDate = (time) => {
    const date = new Date(time * 1000); // Assuming timestamp is in seconds
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    const day = date.getDate().toString().padStart(2, "0"); // Days are 1-based
    return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
  };
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };
  const columns = [
    {
      title: "Violation ID",
      dataIndex: "violationID",
      key: "violationID",
      align: "center",
    },
    {
      title: "Street Speed",
      dataIndex: "streetMaxSpeed",
      key: "streetMaxSpeed",
      align: "center",
    },
    {
      title: "Motorcycle Speed",
      dataIndex: "driverSpeed",
      key: "driverSpeed",
      align: "center",
    },
    {
      title: "Violation Amount",
      dataIndex: "price",
      key: "price",
      align: "center",
    },
    {
      title: "Date",
      key: "date",
      align: "center",
      render: (text, record) => formatDate(record.time),
    },
    {
      title: "Details",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Link 
          to={`/violation/detail/${record.id}`} 
          state={{ 
            driverId, 
            breadcrumbParam: type === "reckless-drivers" ? "breadcrumbParam" : "DriversList", 
            from: type === "reckless-drivers" ? "RecklessDriversList" : "DriversList"
          }}
        >
          <FaEye
            style={{
              cursor: "pointer",
              color: "#059855",
              fontSize: "24px",
            }}
          />
        </Link>
      ),
    },
  ];

  if (error) {
    return <div>{error}</div>; // Display error message if there's an error
  }

  const goBack = () => {
    navigate(-1); // Navigates to the previous page
  };

  return (
    <>
      <Header active={activeHeader} />
      <div className="breadcrumb">
        <a onClick={() => navigate("/employer-home")}>Home</a>
        <span> / </span>
        {type === "reckless-drivers" ? (
          <>
            <a onClick={() => navigate("/violations")}>Violation List</a>
            <span> / </span>
            <a onClick={() => navigate(`/ricklessdrives`)}>
              Reckless Drivers List
            </a>
            <span> / </span>
          </>
        ) : (
          <>
            <a onClick={() => navigate("/driverslist")}>Driver List</a>
            <span> / </span>
            <a onClick={() => navigate(`/driver-details/${driverId}`)}>
              Drivers Details
            </a>
            <span> / </span>
            
          </>
        )}
        <a
          onClick={() =>
            navigate(`/drivers/${driverId}/violations`, {
              state: { breadcrumbParam: "Driver Violations List" },
            })
          }
        >
          Driver Violations List
        </a>
      </div>
      <div className={s.container}>
        <h2 className={s.title}>
          {" "}
          Violations for : {capitalizeFirstLetter(driverName)}
        </h2>
        <Table dataSource={violations} columns={columns} rowKey="id" />
      </div>
      <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "-55px",
                  marginLeft:'240px'
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
                </div>
    </>
  );
};

export default ViolationsTable;