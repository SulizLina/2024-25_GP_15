"use client";
import { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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

const NumberofDrivers = () => {
  const [data, setData] = useState([]);
  const [totalDrivers, setTotalDrivers] = useState(0);
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
    const fetchDrivers = async () => {
      try {
        const driverSnapshot = await getDocs(collection(db, "Driver"));
        const driverCompanyMap = new Map();
    
        // Count drivers per company
        driverSnapshot.forEach((doc) => {
          const { CompanyName } = doc.data();
          if (CompanyName) {
            driverCompanyMap.set(CompanyName, (driverCompanyMap.get(CompanyName) || 0) + 1);
          }
        });
    
        // Get all employers
        const employerSnapshot = await getDocs(collection(db, "Employer"));
        const chartData = [];
    
        employerSnapshot.forEach((doc) => {
          const { CompanyName, ShortCompanyName } = doc.data();
          if (CompanyName) {
            const value = driverCompanyMap.get(CompanyName) || 0;
            chartData.push({
              name: capitalizeFirstLetter(ShortCompanyName || CompanyName),
              value,
              companyName: CompanyName,
            });
          }
        });

        chartData.sort((a, b) => {
          if (b.value === a.value) {
            return a.name.localeCompare(b.name); // Sort alphabetically if complaints are the same
          }
          return b.value - a.value; // Sort by total complaints (descending)
        });
    
        setData(chartData);
        setTotalDrivers(chartData.reduce((sum, entry) => sum + entry.value, 0));
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };
    

    fetchDrivers();
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
              navigate(`/GDTdriverlist/${encodeURIComponent(company)}`);
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
              value: "Number of Drivers",
              angle: -90,
              position: "middle",
              dx: -20,
            }}
          />
          <Tooltip />
          <Bar
            dataKey="value"
            fill="#4CAF50"
            name="Number of Drivers"
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

      {/* Total Drivers Display */}
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
        Total Drivers: {totalDrivers}
      </div>
    </div>
  );
};

export default NumberofDrivers;
