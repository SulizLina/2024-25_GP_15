import { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
const COLORS = [
  "#2E7D32",
  "#4CAF50",
  "#FFC107",
  "#FF5722",
  "#03A9F4",
  "#9C27B0",
]; // Colors for companies

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const TotalComplaints = () => {
  const [data, setData] = useState([]);
  const [totalCopmplaints, setTotalCompalints] = useState(0);
  const navigate = useNavigate();
  const [startIndex, setStartIndex] = useState(0); // Track the start index for pagination
  const visibleCount = 5; // Number of items to display

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - visibleCount));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      Math.min(data.length - visibleCount, prev + visibleCount)
    );
  };
  const visibleData = data.slice(startIndex, startIndex + visibleCount); // Get the currently visible data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Step 1: Fetch violations (get driverIDs)
        const violationSnapshot = await getDocs(collection(db, "Complaint"));
        const driverIDs = new Set();

        violationSnapshot.forEach((doc) => {
          const { driverID } = doc.data();
          if (driverID) driverIDs.add(driverID);
        });

        console.log("Driver IDs from Complaints", [...driverIDs]);

        if (driverIDs.size === 0) {
          console.warn("No driverIDs found in Complaints collection");
          setData([]);
          return;
        }

        // Step 2: Fetch drivers (batch queries to avoid Firestore limit)
        const driverIDList = [...driverIDs];
        const driverMap = new Map();

        for (let i = 0; i < driverIDList.length; i += 10) {
          const batch = driverIDList.slice(i, i + 10);
          const q = query(
            collection(db, "Driver"),
            where("DriverID", "in", batch)
          );
          const driverSnapshot = await getDocs(q);

          driverSnapshot.forEach((doc) => {
            const { DriverID, CompanyName } = doc.data();
            if (DriverID && CompanyName) {
              driverMap.set(DriverID, CompanyName);
            }
          });
        }

        console.log("Driver Map (driverID -> CompanyName):", driverMap);

        // Step 3: Map violations to CompanyNames
        const companyMap = new Map();
        violationSnapshot.forEach((doc) => {
          const { driverID } = doc.data();
          const companyName = driverMap.get(driverID);

          if (companyName) {
            companyMap.set(companyName, (companyMap.get(companyName) || 0) + 1);
          } else {
            console.warn(`No CompanyName found for driverID: ${driverID}`);
          }
        });

        console.log(
          "Company Map (CompanyName -> Violation Count):",
          companyMap
        );
        // Calculate total number of violations
        const total = Array.from(companyMap.values()).reduce(
          (sum, count) => sum + count,
          0
        );
        setTotalCompalints(total);

        // Step 4: Fetch employers (map CompanyName to ShortCompanyName)
        const employerSnapshot = await getDocs(collection(db, "Employer"));
        const employerMap = new Map();

        employerSnapshot.forEach((doc) => {
          const { CompanyName, ShortCompanyName } = doc.data();
          if (CompanyName && ShortCompanyName) {
            employerMap.set(CompanyName, ShortCompanyName);
          }
        });
        // Dummy data for testing
        const dummyDrivers = [];

        dummyDrivers.forEach(({ CompanyName }) => {
          if (CompanyName) {
            companyMap.set(CompanyName, (companyMap.get(CompanyName) || 0) + 1);
          }
        });
        //end of Dummy

        // Step 5: Ensure all employers are included, even if they have 0 complaints
        const chartData = Array.from(employerMap.entries()).map(
          ([companyName, shortName]) => ({
            name: capitalizeFirstLetter(shortName),
            value: companyMap.get(companyName) || 0,
            companyName,
          })
        );

        console.log("Final Chart Data:", chartData);
        setTotalCompalints(
          chartData.reduce((sum, entry) => sum + entry.value, 0)
        ); // Calculate total count

        chartData.sort((a, b) => {
          if (b.value === a.value) {
            return a.name.localeCompare(b.name); // Sort alphabetically if complaints are the same
          }
          return b.value - a.value; // Sort by total complaints (descending)
        });
        
        setData(chartData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
      }
    };

    fetchData();
  }, []);
  return (
    <div style={{ width: "100%", height: "400px", position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={visibleData}
          width={visibleData.length * 150}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          onClick={(state) => {
            const payload = state?.activePayload?.[0]?.payload;
            const company = payload?.companyName;
            const value = payload?.value;
            if (company && value > 0) {
              navigate(`/GDTComplaints?company=${encodeURIComponent(company)}`);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          {/* X Axis in the middle */}
          <XAxis
            dataKey="name"
            tick={{ dy: 10 }}
            label={{
              value: "Delivery Companies",
              position: "insideBottom",
              dy: 25,
            }}
          />

          <YAxis
            allowDecimals={false}
            label={{
              value: "Number of Complaints",
              angle: -90,
              position: "middle",
              dx: -20,
            }}
          />
          <Tooltip />
          <Bar
            dataKey="value"
            fill="#4CAF50"
            name="Number of Complaints"
            barSize={50}
            style={{ cursor: "pointer" }}
          >
            {data.map((_, index) => (
              <rect key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {data.length > 0 && (
          <div style={{position: "relative"}}>
            <Button
              onClick={handlePrev}
              disabled={startIndex === 0}
              style={{
                position: "absolute",
                left: "10px",
                bottom: "0px",
                fontSize: "20px",
                backgroundColor: "white",
                color: "black",
                width: "45px",
                height: "45px",
                border: "1px solid #e7eae8",
                borderRadius: "8px",
                opacity: startIndex === 0 ? 0.5 : 1,
                backgroundColor: startIndex === 0 ?  "#edeceb ": "white" ,
                cursor: startIndex === 0 ? "not-allowed" : "pointer",              }}
            >
              ←
            </Button>
            <Button
              onClick={handleNext}
              disabled={startIndex + visibleCount >= data.length}
              style={{
                position: "absolute",
                right: "10px",
                bottom: "0",
                fontSize: "20px",
                backgroundColor: "white",
                color: "black",
                width: "45px",
                height: "45px",
                border: "1px solid #e7eae8",
                borderRadius: "8px",
                opacity: startIndex + visibleCount >= data.length ? 0.5 : 1,
                backgroundColor: startIndex + visibleCount >= data.length ? "#edeceb ": "white" ,
                cursor: startIndex + visibleCount >= data.length ? "not-allowed" : "pointer",              }}
            >
              →
            </Button>
          </div>
        )}
      {/* Total Complaints Display */}
      <div
        style={{
          position: "absolute",
          top: "-12px",
          right: "30px",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#333",
        }}
      >
        Total Complaints: {totalCopmplaints}
      </div>
    </div>
  );
};

export default TotalComplaints;
