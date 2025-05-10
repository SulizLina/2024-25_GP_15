import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Table, Modal, Pagination } from "antd";
import { db } from "../../firebase";
import Header from "./GDTHeader";
import s from "../../css/VDriver.module.css";
import EyeIcon from "../../images/eye.png";
import { FaEye } from 'react-icons/fa';
import { collection, query, where, getDocs } from "firebase/firestore";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
const ViolationsTable = () => {
  const { driverId } = useParams(); // Get driverId from URL parameters
  const [violations, setViolations] = useState([]); // State for storing violations
  const [error, setError] = useState(null); // State for error messages
  const navigate = useNavigate(); // Hook to programmatically navigate
  const [driverName, setDriverName] = useState("");
  const location = useLocation();
  const state = location.state;
  const [currentPage, setCurrentPage] = useState(1);

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
  const goBack = () => {
    navigate(-1); // Navigate back to the previous page
  };
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatDate = (time) => {
    const date = new Date(time * 1000); // Assuming timestamp is in seconds
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    const day = date.getDate().toString().padStart(2, "0"); // Days are 1-based
    return `${month}/${day}/${year}`; // Format as MM/DD/YYYY
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
      title: "Type",
      dataIndex: "violationType",
      key: "violationType",
      align: "center",
      render: (text, record) => {
        // Check if count30 or count50 is greater than 0
        if (record.count30 > 0 || record.count50 > 0) {
          return "Reckless Violation"; // If either count30 or count50 is greater than 0, mark as Reckless Violation
        }
        return "Regular Violation"; // Otherwise, mark as Regular Violation
      },
    },
    {
      title: "Violation Details",
      key: "actions",
      align: "center",
      className: "svg",
      render: (_, record) => {
        const linkState = state === "driverlist" 
          ? { breadcrumbParam: "Driver List" } 
          : { breadcrumbParam: "Driver Violations List" };
      
        return (
          <Link
            to={`/gdtviolation/general/${record.id}`}
            state={linkState}
          >
           <FaEye
                               style={{ cursor: 'pointer', fontSize: '1.5em', color: '#059855' }} 
                             />
          </Link>
        );
      },
      
    },
  ];

  if (error) {
    return <div>{error}</div>; // Display error message if there's an error
  }
  const paginatedData = violations.slice((currentPage - 1) * 5, currentPage * 5);

  return (
    <>
    <Header
        active={
          state === "driverlist"? "gdtdriverlist" : "gdtviolations"
        }
      />

      <div className="breadcrumb">
        <a onClick={() => navigate("/gdthome")}>Home</a>
        <span> / </span>
        {state === "driverlist" ? (
          <>
            <a onClick={() => navigate("/gdtdriverlist")}>Driver List</a>
            <span> / </span>
            <a onClick={() => navigate(`/gdtdriverdetails/${driverId}`)}>
              Driver Details
            </a>
            <span> / </span>
            <a onClick={() => navigate(`/gdtviolationdriver/${driverId}`)}>
              Driver Violations List
            </a>
          </>
        ) : (
          <>
            <a onClick={() => navigate("/gdtviolations")}>Violation List</a>
            <span> / </span>
            <a onClick={() => navigate("/gdtricklessdrives")}>
              Reckless Drivers List
            </a>
            <span> / </span>
            <a onClick={() => navigate(`/gdtviolationdriver/${driverId}`)}>
              Driver Violations List
            </a>
          </>
        )}
      </div>

      <div className={s.container}>
        <h2 className={s.title}>
          Violations for : {capitalizeFirstLetter(driverName)}
        </h2>
        <Table
          columns={columns}
          dataSource={paginatedData}
          pagination={false}
          rowKey="id"
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
            defaultCurrent={currentPage}
            pageSize={5}
            total={violations.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            showLessItems
          />
          {/* 
          <Pagination
          current={currentPage}
          pageSize={5}
          total={filteredCrashes.length}
          onChange={(page) => setCurrentPage(page)}
          showSizeChanger={false}
          showLessItems
        />
          */}
        </div>
      </div>
    </>
  );
};

export default ViolationsTable;
