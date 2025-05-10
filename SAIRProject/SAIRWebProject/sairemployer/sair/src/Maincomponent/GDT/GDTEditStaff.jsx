import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc,
  updateDoc,
  getDoc,
  where,
  getDocs,
  query,
  collection,
} from "firebase/firestore";
import successImage from "../../images/Sucess.png";
import errorImage from "../../images/Error.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import {
  getAuth,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
} from "firebase/auth";
import Header from "./GDTHeader";
import { Modal } from "antd";
import s from "../../css/Profile.module.css";
import { useContext } from "react";
import "../../css/CustomModal.css";

const GDTEditStaff = () => {
  const { staffId } = useParams(); //from the URL
  const [GDT, setGDT] = useState({
    GDTEmail: "",
    Lname: "",
    PhoneNumber: "",
    Fname: "",
    ID: "",
  });

  const [originalGDTData, setOriginalGDTData] = useState({});
  const [editMode, setEditMode] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
  const [missingFields, setMissingFields] = useState({});
    const [isSuccess, setIsSuccess] = useState(false);
      const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [validationMessages, setValidationMessages] = useState({
    phoneError: "",
    emailError: "",
    emailperError: "",
    Fnameempty: "",
    Lnameempty: "",
    IDempty: "",
  });

  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupImage, setPopupImage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [currentPassValid, setCurrentPassValid] = useState(false); // New state for current password validity
  const navigate = useNavigate();
  useEffect(() => {
    if (!staffId) {
      console.error("staffId is null or undefined");
      setPopupMessage("staffId not found, please log in.");
      return;
    }

    const fetchGDT = async () => {
      try {
        const docRef = doc(db, "GDT", staffId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log("Document data:", docSnap.data());
          setGDT(docSnap.data()); // Set the retrieved data to the GDT state
          setOriginalGDTData(docSnap.data()); // Store the original data
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };

    fetchGDT();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGDT((prev) => ({ ...prev, [name]: value || "" }));
    // Clear the missing field error as soon as the user fills it
    if (value.trim() !== "" && missingFields[name]) {
      console.log(missingFields);
      setMissingFields((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    setValidationMessages((prev) => ({
      ...prev,
    }));

    switch (name) {
      case "newPassword":
        const updatedRequirements = {
          length: value.length >= 8,
          uppercase: /[A-Z]/.test(value),
          lowercase: /[a-z]/.test(value),
          number: /\d/.test(value),
          special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        };

        // Check if all requirements are met
        const allRequirementsMet =
          Object.values(updatedRequirements).every(Boolean);

        setValidationMessages((prev) => ({
          ...prev,
        }));
        break;
      default:
        break;
    }
  };

  const handlePhoneNumberChange = (e) => {
    console.log(e.target.value);
    const { name, value } = e.target;
    // Clear the missing field error as soon as the user fills it
    if (value.trim() !== "" && missingFields[name]) {
      setMissingFields((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    let newPhoneNumber = e.target.value;
    if (newPhoneNumber.startsWith("+966")) {
      setGDT({ ...GDT, PhoneNumber: newPhoneNumber }); // Store only the digits
    } else {
      newPhoneNumber = "+966" + newPhoneNumber.slice(3);
      setGDT({ ...GDT, PhoneNumber: newPhoneNumber }); // Store only the digits
    }
    let phoneError = "";
    if (newPhoneNumber.length > 4) {
      if (validatePhoneNumber(newPhoneNumber) === "") {
        phoneError = "";
      } else if (validatePhoneNumber(newPhoneNumber) === "0") {
        phoneError = "";
        var str = newPhoneNumber + "";
        str = str.substring(str.indexOf("5"));
        var st = "+966" + str;
        setGDT({ ...GDT, PhoneNumber: st });
      } else {
        phoneError = validatePhoneNumber(newPhoneNumber);
      }
    }

    setValidationMessages((prev) => ({
      ...prev,
      phoneError: phoneError,
    })); //removed when empty
  };

  const handleFNameChange = (e) => {
    const value = e.target.value;
    setGDT((prev) => ({ ...prev, Fname: value })); // Clear the missing field error as soon as the user fills it

    if (value.trim() !== "" && missingFields.FirstName) {
      setMissingFields((prev) => {
        const updated = { ...prev };
        delete updated.FirstName;
        return updated;
      });
    }
  };

  const handleLNameChange = (e) => {
    const value = e.target.value;
    setGDT((prev) => ({ ...prev, Lname: value })); // Clear the missing field error as soon as the user fills it

    if (value.trim() !== "" && missingFields.LastName) {
      setMissingFields((prev) => {
        const updated = { ...prev };
        delete updated.LastName;
        return updated;
      });
    }
  };

  const handleIDChange = (e) => {
    const value = e.target.value;
    setGDT((prev) => ({ ...prev, ID: value })); // Clear the missing field error as soon as the user fills it

    if (value.trim() !== "" && missingFields.ID) {
      setMissingFields((prev) => {
        const updated = { ...prev };
        delete updated.ID;
        return updated;
      });
    }
  };
  const validatePhoneNumber = (phoneNumber) => {
    const phoneRegex = /^\+9665\d{8}$/; // Example for a specific format
    const phoneRegex1 = /^\+96605\d{8}$/; // Example for a specific format
    if (phoneRegex.test(phoneNumber)) {
      return "";
    } else if (phoneRegex1.test(phoneNumber)) {
      return "0";
    } else {
      return "Phone number must start with +9665 and be followed by 8 digits.";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const newMissingFields = {}; // Check empty fields for first name, last name, and ID

    if (!GDT.Fname) {
      newMissingFields.FirstName = "Please enter staff first name";
    }

    if (!GDT.Lname) {
      newMissingFields.LastName = "Please enter staff last name";
    }

    if (!GDT.ID) {
      newMissingFields.ID = "Please enter staff ID (National Number)";
    } else if (GDT.ID.length !== 10) {
      newMissingFields.ID = "ID must be exactly 10 digits";
    } else if (!/^\d+$/.test(GDT.ID)) {
      newMissingFields.ID = "ID must contain only digits";
    } // Check for required fields like PhoneNumber

    if (!GDT.PhoneNumber || GDT.PhoneNumber === "+966") {
      newMissingFields.PhoneNumber = "Please enter staff phone number";
    } // If there are missing fields, set them and stop form submission

    if (Object.keys(newMissingFields).length > 0) {
      setMissingFields(newMissingFields);
      setLoading(false);
      return;
    }
    if (Object.values(validationMessages).some((msg) => msg)) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, "GDT", staffId);
    const currentData = await getDoc(docRef);

    if (currentData.exists()) {
      const existingPhoneNumber = currentData.data().PhoneNumber;

      if (GDT.PhoneNumber && GDT.PhoneNumber !== existingPhoneNumber) {
        const existingUserQuery1 = await getDocs(
          query(
            collection(db, "GDT"),
            where("PhoneNumber", "==", GDT.PhoneNumber)
          )
        );

        if (!existingUserQuery1.empty) {
          setPopupMessage(
            "The phone number is already used. Please use a new number."
          );
          setPopupImage(errorImage);
          setPopupVisible(true);
          setLoading(false);
          return;
        }
      }
    }
    // Validate new password and confirm password
    if (GDT.newPassword || GDT.confirmNewPassword) {
      // Check if passwords match
      if (GDT.newPassword !== GDT.confirmNewPassword) {
        setPopupMessage("Passwords do not match.");
        setPopupImage(errorImage);
        setPopupVisible(true);
        setLoading(false);
        return;
      }
    }

    const auth = getAuth();
    const user = auth.currentUser;

    try {
      const updateData = { ...GDT };
      delete updateData.currentPassword;
      delete updateData.newPassword;
      delete updateData.confirmNewPassword;

      await updateDoc(docRef, updateData);
      if (GDT.newPassword && user) {
        const credential = EmailAuthProvider.credential(
          user.email,
          GDT.currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, GDT.newPassword);
      }

      setPopupMessage("Staff Information Updated Successfully.");
      // Redirect to Driver List after a short delay
      setTimeout(() => {
        navigate('/gdtstafflist');
      }, 2000);
      setPopupImage(successImage);
      setPopupVisible(true);
      setEditMode(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
      setCurrentPassValid(false); //new

      setPasswordRequirements({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      });

      setGDT((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      }));
    } catch (error) {
      console.error("Error updating profile:", error);
      setPopupMessage("Failed to update profile.");
      setPopupImage(errorImage);
      setPopupVisible(true);
    } finally {
      setLoading(false);
    }
  };

    // Show notification function
    const showNotification = (message, success) => {
      setNotificationMessage(message);
      setIsSuccess(success);
      setIsNotificationVisible(true);
      setTimeout(() => {
        setIsNotificationVisible(false);
      }, 2000);
    };

  const handleCancel = async () => {
    setEditMode(true)
    const docRef = doc(db, "GDT", staffId);
    // Fetch the latest data from the database
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const latestData = docSnap.data();
      setGDT(latestData); // Restore the latest data
      setOriginalGDTData(latestData); // Update original data to latest from DB
    }

    setEditMode(false); // Exit edit mode
    setMissingFields({});
    setValidationMessages({
      // Clear validation messages
      phoneError: "",
      emailError: "",
      newPassword: "",
      confirmNewPassword: "",
      currentPasswordError: "",
      emailperError: "",
      currentPasswordEmpty: "",
      confirmNewPasswordError: "",
      currentPasswordsuccess: "",
      Fnameempty: "",
      Lnameempty: "",
      IDempty: "",
    });
    // Clear the current password in the form's state
    setGDT((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    }));

      // Redirect to Driver List after a short delay
      setTimeout(() => {
        navigate('/gdtstafflist');
      }, 1000);
  };
  const handleClosePopup = () => {
    setPopupVisible(false);
  };

  const togglePasswordVisibility = (type) => {
    if (type === "current") {
      setShowCurrentPassword(!showCurrentPassword);
    } else if (type === "new") {
      setShowNewPassword(!showNewPassword);
    } else if (type === "confirm") {
      setShowConfirmNewPassword(!showConfirmNewPassword);
    }
  };

  // Logout function to navigate back to the login page
  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        navigate("/"); // Redirect to login page (Login.jsx)
      })
      .catch((error) => {
        console.error("Error LOGGING out:", error);
      });
  };

  // Handle redirection functions for each page
  const handleNavigation = (path) => {
    navigate(path); // Navigate to the specified path
  };

  return (
    <div>
      <Header active="gdtstafflist"/>
      <div class="breadcrumb">
        <a onClick={() => navigate("/GDThome")}>Home</a>
        <span> / </span>
        <a onClick={() => navigate("/gdtstafflist")}>Staff List</a>
        <span> / </span>
        <a onClick={() => navigate("/gdteditstaff")}>Edit Staff</a>
      </div>
      <div className={s.forme}>
        <div className={s.container}>
          <form onSubmit={handleSave} noValidate>
            <h2 className="title">Edit Staff</h2>

            <div className={s.formRow}>
              <div>
                <label className={s.profileLabel}>First Name</label>
                <input
                  type="text"
                  name="Fname"
                  value={GDT.Fname}
                  onChange={handleFNameChange}
                />
                {missingFields.FirstName && (
                  <p style={{ color: "red", marginTop: "3px" }}>
                    {missingFields.FirstName}
                  </p>
                )}
                {validationMessages.Fnameempty && (
                  <p style={{ color: "red", marginTop: "3px" }}>
                    {validationMessages.Fnameempty}
                  </p>
                )}
              </div>
              <div>
                <label className={s.profileLabel}>Last Name</label>
                <input
                  type="text"
                  name="Lname"
                  value={GDT.Lname}
                  onChange={handleLNameChange}
                />
                {missingFields.LastName && (
                  <p style={{ color: "red", marginTop: "3px" }}>
                    {missingFields.LastName}
                  </p>
                )}
                {validationMessages.Lnameempty && (
                  <p style={{ color: "red", marginTop: "3px" }}>
                    {validationMessages.Lnameempty}
                  </p>
                )}
              </div>
            </div>

            <div className={s.formRow}>
              <div>
                <label className={s.profileLabel}>ID (National Number)</label>
                <input
                  type="text"
                  name="ID"
                  value={GDT.ID}
                  onChange={handleIDChange}
                />
                {missingFields.ID && (
                  <p style={{ color: "red", marginTop: "3px" }}>
                    {missingFields.ID}
                  </p>
                )}
              </div>
              <div>
                <label className={s.profileLabel}>Position</label>
                <input
                  type="text"
                  name="position"
                  value={GDT.isAdmin ? "Admin" : "Staff"}
                  onChange={handleChange}
                  readOnly
                />
              </div>
            </div>

            <div className={s.formRow}>
              <div>
                <label className={s.profileLabel}>Phone Number</label>
                <input
                  type="tel"
                  name="PhoneNumber"
                  placeholder="+966"
                  value={`${GDT.PhoneNumber}`}
                  onChange={handlePhoneNumberChange}
                  pattern="\+9665\d{8}"
                  required
                />
                {missingFields["PhoneNumber"] && (
                  <p style={{ color: "red", marginTop: "3px" }}>
                    {missingFields["PhoneNumber"]}
                  </p>
                )}
                {validationMessages.phoneError && (
                  <p style={{ color: "red", marginTop: "3px" }}>
                    {validationMessages.phoneError}
                  </p>
                )}
              </div>
              <div>
                <label className={s.profileLabel}>Email</label>
                <input
                  type="text"
                  name="GDTEmail"
                  value={GDT.GDTEmail}
                  onChange={handleChange}
                  readOnly
                />
              </div>
            </div>

            <div>
                <div>
                <button
                    type="button"
                    className={s.profileCancel}
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={s.profilesave}
                    disabled={loading}
                  >
                    {loading ? "Update Staff" : "Update Staff"}
                  </button>
               
                  </div>
              </div>
            {}
          </form>

          <Modal
            visible={popupVisible}
            onCancel={handleClosePopup}
            footer={<p style={{ textAlign: "center" }}> {popupMessage}</p>}
            style={{ top: "38%" }}
            className="custom-modal"
            closeIcon={<span className="custom-modal-close-icon">×</span>}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <img
                src={popupImage}
                alt="Popup"
                style={{ width: "20%", marginBottom: "16px" }}
              />
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default GDTEditStaff;