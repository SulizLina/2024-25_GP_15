import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import successImage from "../../images/Sucess.png";
import errorImage from "../../images/Error.png";
import backgroundImage from "../../images/sairbackgroundL.png";
import { Form, Modal, Steps } from "antd";
import {
  UserOutlined,
  SolutionOutlined,
  LoadingOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { v4 as uuidv4 } from 'uuid';
import s from "../../css/Login.module.css";
// import '@fortawesome/fontawesome-free/css/all.min.css';
// import '../../App.css';
import "../../css/common.css";
import { useContext } from "react";
import { ShortCompanyNameContext } from "../../ShortCompanyNameContext";
import { FirstNameContext } from "../../FirstNameContext";
import "../../css/CustomModal.css";
import l from "../../css/Signup.module.css";
const { Step } = Steps;
//
const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const { shortCompanyName, setShortCompanyName } = useContext(
    ShortCompanyNameContext
  );
  const { firstName, setFirstName } = useContext(FirstNameContext);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passworde, setPassworde] = useState("");
  const [missingFields, setMissingFields] = useState({});
  const [showDetailsFormAdmin, setShowDetailsFormAdmin] = useState(false); // State to toggle details form
  const [showDetailsFormStaff, setShowDetailsFormStaff] = useState(false); // State to toggle details form
  const [showPasswordDetails, setshowPasswordDetails] = useState(false); // State to toggle details form
  const [showConfirmLogin, setshowConfirmLogin] = useState(false); // State to toggle details form
  const [showConfirmNewPassword, setshowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [Fname, setFname] = useState("");
  const [Lname, setLname] = useState("");
  const [ConfirmationPass, setConfirmationPass] = useState("");
  const [ID, setID] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [Phonenumber, setPhonenumber] = useState("");
  const [validationMessages, setValidationMessages] = useState({
    phoneError: "",
    idError: "",
    passwordError: "",
    confirmPasswordError: "",
  });
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [current, setCurrent] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showpassworde, setShowpassworde] = useState(false);
  const [errors, setErrors] = useState({
    phoneStartError: "",
    phoneLengthError: "",
    commercialError: "",
  });
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupImage, setPopupImage] = useState("");
  const gdtUID = sessionStorage.getItem("gdtUID");

  // useEffect(() => {
  //   validatePhoneNumber(phoneNumber);
  // }, [phoneNumber]);

  // useEffect(() => {
  //     if (role === 'employer') {
  //         validateCommercialNumber(email);
  //     } else {
  //         setErrors((prev) => ({ ...prev, commercialError: '' }));
  //     }
  // }, [email, role]);

  const handleRoleChange = (event) => {
    const selectedRole = event.target.value;
    setRole(selectedRole);
    setPhoneNumber("");
    setEmail("");
    setPassword("");
    setErrors({
      phoneStartError: "",
      phoneLengthError: "",
      commercialError: "",
    });
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
      setPhonenumber(newPhoneNumber);
    } else {
      newPhoneNumber = "+966" + newPhoneNumber.slice(3);
      setPhonenumber(newPhoneNumber);
    }

    // Only validate if there is more than just the prefix ('+966')
    // const phoneError = newPhoneNumber !== '+966' ? validatePhoneNumber(newPhoneNumber) : '';
    let phoneError = "";
    if (newPhoneNumber.length > 4) {
      if (validatePhoneNumber(newPhoneNumber) === "") {
        phoneError = "";
      } else if (validatePhoneNumber(newPhoneNumber) === "0") {
        phoneError = "";
        var str = newPhoneNumber + "";
        str = str.substring(str.indexOf("5"));
        var st = "+966" + str;
        setPhonenumber(st);
      } else {
        phoneError = validatePhoneNumber(newPhoneNumber);
      }
    }
    setValidationMessages((prev) => ({
      ...prev,
      phoneError: phoneError,
    }));
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Update state dynamically based on the input's `name` attribute
    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    } else if (name === "Fname") {
      setFname(value);
    } else if (name === "Lname") {
      setLname(value);
    } else if (name === "ID") {
      setID(value);
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
    } else if (name === "passworde") {
      setPassworde(value);
    }

    if (name === "ID") {
      if (value.trim() == "") {
        validationMessages.idError = "";
      } else if (value.length !== 10) {
        validationMessages.idError = "Driver ID must be 10 digits";
      } else {
        validationMessages.idError = ""; // Clear error if valid
      }
    }

    // Clear the missing field error as soon as the user starts typing
    if (value.trim() !== "" && missingFields[name]) {
      setMissingFields((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    if (name === "passworde") {
      // Calculate password requirements
      const updatedRequirements = {
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      };

      // Update password requirements state
      setPasswordRequirements(updatedRequirements);

      // Check if all requirements are met
      const allRequirementsMet =
        Object.values(updatedRequirements).every(Boolean);

      setValidationMessages((prev) => ({
        ...prev,
        passwordError: allRequirementsMet
          ? ""
          : "Password does not meet the requirements.",
      }));
    }
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = (type) => {
    if (type === "old") {
      setShowPassword(!showPassword);
    } else if (type === "new") {
      setShowpassworde(!showpassworde);
    } else if (type === "confirm") {
      setshowConfirmNewPassword(!showConfirmNewPassword);
    }
  };

  // const validatePhoneNumber = (phoneValue) => {
  //   let phoneStartError = '';
  //   let phoneLengthError = '';

  //   if (!phoneValue.startsWith('+9665') && phoneValue.length > 0) {
  //     phoneStartError = 'Phone number must start with +9665.';
  //   }

  //   if (phoneValue.length !== 13 && phoneValue.length > 0) {
  //     phoneLengthError = 'Phone number must be exactly 13 digits.';
  //   }

  //   setErrors((prev) => ({
  //     ...prev,
  //     phoneStartError,
  //     phoneLengthError,
  //   }));
  // };

  //const validateCommercialNumber = (commercialValue) => {
  // const numberRegex = /^\d{10}$/;
  //const commercialError = numberRegex.test(commercialValue) ? '' : 'Commercial registration number must be exactly 10 digits long.';
  //setErrors((prev) => ({
  //  ...prev,
  //commercialError,
  // }));
  // };

  const handleSubmit = async (event) => {
    console.log("in log out", gdtUID);

    // event.preventDefault();
    const newMissingFields = {};
    if (!email) {
      newMissingFields.email = "Please enter your email.";
    }
    if (!password) {
      newMissingFields.password = "Please enter your password.";
    }

    if (Object.keys(newMissingFields).length > 0) {
      setMissingFields(newMissingFields);
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      let userFound = false;

      if (role === "gdt") {
        const q = query(collection(db, "GDT"), where("GDTEmail", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          try {
            const userCredential = await signInWithEmailAndPassword(
              auth,
              email,
              password
            );
            const user = userCredential.user;

            //proceed with login
            userFound = true;
            const isAdmin = querySnapshot.docs[0].data().isAdmin;
            const isDefaultPassword =
              querySnapshot.docs[0].data().isDefaultPassword;

            if (isAdmin === true) {
              if (isDefaultPassword) {
                setShowDetailsFormAdmin(true);
              } else {
                const gdtUID = querySnapshot.docs[0].id;
                sessionStorage.setItem("gdtUID", gdtUID);
                const GDTData = querySnapshot.docs[0].data();
                const Fname = GDTData.Fname || "su";
                sessionStorage.setItem("FirstName", Fname);
                setFirstName(Fname); // Update the context
                sessionStorage.setItem("isAdmin", GDTData.isAdmin || false);
                console.log("looooooog in", Fname);
                console.log("looooooog in", gdtUID);

                setTimeout(() => {
                  const randomQuery =GDTData.isAdmin ? `?${uuidv4()}` : '';
                  navigate(`/gdthome${randomQuery}`);
                }, 1500);
              }
            } else {
              if (isDefaultPassword) {
                setShowDetailsFormStaff(true);
                setshowPasswordDetails(true);
              } else {
                const gdtUID = querySnapshot.docs[0].id;
                sessionStorage.setItem("gdtUID", gdtUID);
                const GDTData = querySnapshot.docs[0].data();
                const Fname = GDTData.Fname || "";
                sessionStorage.setItem("FirstName", Fname);
                setFirstName(Fname); // Update the context
                sessionStorage.setItem("isAdmin", GDTData.isAdmin || false);
                setTimeout(() => {
                  const randomQuery = GDTData.isAdmin ? `?${uuidv4()}` : '';
                  navigate(`/gdthome${randomQuery}`);
                }, 1500);
              }
            }
          } catch (error) {
            setPopupMessage("Invalid email or password.");
            setPopupImage(errorImage);
            setPopupVisible(true);
          }
        } else {
          setPopupMessage("Invalid email or password.");
          setPopupImage(errorImage);
          setPopupVisible(true);
        }
      }

      if (role === "employer") {
        const q = query(
          collection(db, "Employer"),
          where("CompanyEmail", "==", email)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          try {
            const userCredential = await signInWithEmailAndPassword(
              auth,
              email,
              password
            );
            const user = userCredential.user;

            // Check if the user's email is verified
            if (!user.emailVerified) {
              setPopupMessage("Please verify your email before logging in.");
              setPopupImage(errorImage);
              setPopupVisible(true);
              return;
            }

            // If the email is verified, proceed with login
            userFound = true;
            const employerUID = querySnapshot.docs[0].id;
            sessionStorage.setItem("employerUID", employerUID);
            localStorage.setItem("crashIds", JSON.stringify([])); //not sure
            // Fetch the ShortCompanyName and update sessionStorage
            const employerData = querySnapshot.docs[0].data();
            const shortCompanyName = employerData.ShortCompanyName || "";
            sessionStorage.setItem("ShortCompanyName", shortCompanyName);
            setShortCompanyName(shortCompanyName); // Update the context
            console.log("in empllllllll", shortCompanyName);

            setTimeout(() => {
              navigate("/employer-home");
            }, 1500);
          } catch (error) {
            setPopupMessage("Invalid email or password.");
            setPopupImage(errorImage);
            setPopupVisible(true);
          }
        } else {
          setPopupMessage("Invalid email or password.");
          setPopupImage(errorImage);
          setPopupVisible(true);
        }
      }

      if (!userFound) {
        setPopupMessage("Invalid Email or password.");
        setPopupImage(errorImage);
        setPopupVisible(true);
      }
    } catch (error) {
      console.error("Error fetching user: ", error);
    }
  };

  const handleNext = async (e) => {
    // event.preventDefault();
    let isvalid = true;
    const newMissingFields = {};
    if (!Fname) {
      newMissingFields.Fname = "Please enter your first name.";
    }
    if (!Lname) {
      newMissingFields.Lname = "Please enter your last name.";
    }
    if (!ID) {
      newMissingFields.ID = "Please enter your id.";
    }
    if (!Phonenumber) {
      newMissingFields.Phonenumber = "Please enter your phone number.";
    }

    if (Object.keys(newMissingFields).length > 0) {
      setMissingFields(newMissingFields);
      setLoading(false);
      isvalid = false;
      return;
    }
    const hasExistingErrors = Object.values(validationMessages).some(
      (message) => message.length > 0
    );
    if (hasExistingErrors) {
      isvalid = false;
      console.log(
        "Errors in validation messages. Stopping sign-up.",
        validationMessages
      );
      return;
    }

    const existingUserQuery2 = await getDocs(
      query(collection(db, "GDT"), where("ID", "==", ID))
    );

    if (!existingUserQuery2.empty) {
      isvalid = false;
      setPopupMessage("The ID is already used. Please use a new id.");
      setPopupImage(errorImage);
      setPopupVisible(true);
      setLoading(false);
      return; // Prevent sign-up if commercial number exists
    }

    const existingUserQuery1 = await getDocs(
      query(collection(db, "GDT"), where("PhoneNumber", "==", Phonenumber))
    );

    if (!existingUserQuery1.empty) {
      isvalid = false;
      setPopupMessage(
        "The phone number is already used. Please use a new number."
      );
      setPopupImage(errorImage);
      setPopupVisible(true);
      setLoading(false);
      return; // Prevent sign-up if commercial number exists
    }

    if (isvalid === true) {
      setCurrent(current + 1);
      setshowPasswordDetails(true);
    }
    console.log(showPasswordDetails);

    // setTimeout(() => {
    //   navigate('/gdthome');
    // }, 1500);
  };

  const handleNext2 = async (e) => {
    const newMissingFields = {};
    if (!passworde) {
      newMissingFields.passworde = "Please enter your password.";
    }
    if (!confirmPassword) {
      newMissingFields.confirmPassword = "Please confirm your new password.";
    }

    if (Object.keys(newMissingFields).length > 0) {
      setMissingFields(newMissingFields);
      setLoading(false);
      return;
    }
    const hasExistingErrors = Object.values(validationMessages).some(
      (message) => message.length > 0
    );
    if (hasExistingErrors) {
      console.log("Errors in validation messages. Stopping sign-up.");
      return;
    }

    if (passworde !== confirmPassword) {
      setPopupMessage("Passwords do not match.");
      setPopupImage(errorImage);
      setPopupVisible(true);
      setLoading(false);
      return;
    }

    if (showDetailsFormAdmin === true) {
      try {
        // Reference to the collection
        const GDTCollection = collection(db, "GDT");

        // Query for the document with the matching email
        const q = query(GDTCollection, where("GDTEmail", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          // Assuming email is unique, update the first matched document
          const docRef = querySnapshot.docs[0].ref;
          const auth = getAuth();
          const user = auth.currentUser;

          const newFields = {
            Fname: Fname,
            Lname: Lname,
            PhoneNumber: Phonenumber,
            ID: ID,
            isDefaultPassword: false,
          };
          if (user) {
            updatePassword(user, passworde)
              .then(() => {
                console.log("Password updated successfully!");
              })
              .catch((error) => {
                console.error("Error updating password:", error.message);
              });
            await updateDoc(docRef, newFields);

            console.log(`Document with email ${email} updated successfully!`);
            setCurrent(current + 1);
            setshowPasswordDetails(false);
            setshowConfirmLogin(true);
          } else {
            console.log("No user is signed in.");
          }
        } else {
          console.log(`No document found for email: ${email}`);
        }
      } catch (error) {
        console.error("Error updating document:", error.message);
      }
    } else if (showDetailsFormStaff === true) {
      console.log("in stafffffffffff");
      try {
        // Reference to the collection
        const GDTCollection = collection(db, "GDT");

        // Query for the document with the matching email
        const q = query(GDTCollection, where("GDTEmail", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          // Assuming email is unique, update the first matched document
          const docRef = querySnapshot.docs[0].ref;
          const auth = getAuth();
          const user = auth.currentUser;
          const docSnapshot = await getDoc(docRef);
          const existingData = docSnapshot.data();
          // Merge new fields with existing data
          const updatedFields = { ...existingData, isDefaultPassword: false };
          await updateDoc(docRef, updatedFields);
          if (user) {
            updatePassword(user, passworde)
              .then(() => {
                console.log("Password updated successfully!");
              })
              .catch((error) => {
                console.error("Error updating password:", error.message);
              });

            console.log(`Document with email ${email} updated successfully!`);
            const gdtUID = querySnapshot.docs[0].id;
            sessionStorage.setItem("gdtUID", gdtUID);
            const GDTData = querySnapshot.docs[0].data();
            const Fname = GDTData.Fname || "";
            sessionStorage.setItem("FirstName", Fname);
            setFirstName(Fname); // Update the context
            sessionStorage.setItem("isAdmin", GDTData.isAdmin || false);
            setCurrent(current + 1);
            setTimeout(() => {
              const randomQuery = GDTData.isAdmin ? `?${uuidv4()}` : '';
              navigate(`/gdthome${randomQuery}`);
            }, 1500);
          } else {
            console.log("No user is signed in.");
          }
        } else {
          console.log(`No document found for email: ${email}`);
        }
      } catch (error) {
        console.error("Error updating document:", error.message);
      }
    } else {
      console.log("inside else");
    }
  };

  const handleNext3 = async (e) => {
    setCurrent(current + 1);
    window.location.reload();
  };

  const handleback = async (e) => {
    setCurrent(current - 1);
    setValidationMessages((prev) => ({
      phoneError: "",
      idError: "",
      passwordError: "",
      confirmPasswordError: "",
    }));
    setshowPasswordDetails(false);
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
  };

  return (
    <div className={s.loginContainer}>
      <div>
        <img src={backgroundImage} alt="sair" className={s.rightImage} />
      </div>

      <h1>Welcome to SAIR!</h1>
      <div style={{ marginTop: "50px" }}>
        {!showDetailsFormAdmin && !showDetailsFormStaff && (
          <label style={{ fontSize: "18px" }}>
            Please Select your Role
            <select id="roleSelect" onChange={handleRoleChange}>
              <option style={{ fontSize: "15px" }} value="">
                -- Select a Role --
              </option>
              <option style={{ fontSize: "15px" }} value="gdt">
                GDT
              </option>
              <option style={{ fontSize: "15px" }} value="employer">
                Employer
              </option>
            </select>
          </label>
        )}
        <br />
        <br />

        <div
          style={{
            display: role ? "block" : "none",
          }}
        >
          {!showDetailsFormAdmin &&
          !showDetailsFormStaff &&
          !showPasswordDetails ? (
            <Form
              id="dynamicForm"
              onSubmit={handleSubmit}
              className={l.formContainer}
            >
              {role === "gdt" ? (
                <div>
                  <p style={{ marginBottom: "20px" }}>
                    Please fill in the following information to log in to your
                    account.
                  </p>

                  <style>
                    {`
        input::placeholder {
          font-size: 14px;
          padding-left: 15px;

        }
      `}
                  </style>
                  <div className={l.profileField}>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      value={email}
                      onFocus={(e) => (e.target.placeholder = "")} // Clear placeholder on focus
                      onBlur={(e) =>
                        (e.target.placeholder = "Enter your email")
                      } // Restore placeholder on blur if empty
                      onChange={handleInputChange}
                    />
                    {missingFields.email && (
                      <p
                        style={{
                          color: "red",
                          marginTop: "3px",
                          fontSize: "14px",
                        }}
                      >
                        {missingFields.email}
                      </p>
                    )}
                  </div>

                  <div className={l.profileField}>
                    <label htmlFor="password"></label>
                    {/* <br /> */}
                    <div className={l.passwordContainer}>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        value={password}
                        onFocus={(e) => (e.target.placeholder = "")} // Clear placeholder on focus
                        onBlur={(e) =>
                          (e.target.placeholder = "Enter your password")
                        } // Restore placeholder on blur if empty
                        onChange={handleInputChange}
                      />
                      <span
                        onClick={() => togglePasswordVisibility("old")}
                        className={l.passwordVisibilityToggle}
                      >
                        <i
                          className={
                            showPassword ? "far fa-eye" : "far fa-eye-slash"
                          }
                        ></i>
                      </span>
                      {missingFields.password && (
                        <p
                          style={{
                            color: "red",
                            marginTop: "3px",
                            fontSize: "14px",
                          }}
                        >
                          {missingFields.password}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : role === "employer" ? (
                <div>
                  <p style={{ marginBottom: "20px" }}>
                    Please fill in the following information to log in to your
                    account.
                  </p>
                  <style>
                    {`
          input::placeholder {
            font-size: 14px;
            padding-left: 15px;

          }
        `}
                  </style>
                  <div className={l.profileField}>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your Company email"
                      value={email}
                      onFocus={(e) => (e.target.placeholder = "")} // Clear placeholder on focus
                      onBlur={(e) =>
                        (e.target.placeholder = "Enter your Company email")
                      } // Restore placeholder on blur if empty
                      onChange={handleInputChange}
                    />
                    {missingFields.email && (
                      <p
                        style={{
                          color: "red",
                          marginTop: "3px",
                          fontSize: "14px",
                        }}
                      >
                        {missingFields.email}
                      </p>
                    )}
                  </div>

                  <div className={l.profileField}>
                    <label htmlFor="password"></label>
                    {/* <br /> */}
                    <div className={l.passwordContainer}>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        value={password}
                        onFocus={(e) => (e.target.placeholder = "")} // Clear placeholder on focus
                        onBlur={(e) =>
                          (e.target.placeholder = "Enter your password")
                        } // Restore placeholder on blur if empty
                        onChange={handleInputChange}
                      />
                      <span
                        onClick={() => togglePasswordVisibility("old")}
                        className={l.passwordVisibilityToggle}
                      >
                        <i
                          className={
                            showPassword ? "far fa-eye" : "far fa-eye-slash"
                          }
                        ></i>
                      </span>
                      {missingFields.password && (
                        <p
                          style={{
                            color: "red",
                            marginTop: "3px",
                            fontSize: "14px",
                          }}
                        >
                          {missingFields.password}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
              <br></br>
              <div className="linksConta">
                <a
                  className={s.forget}
                  id="forget"
                  onClick={() => navigate(`/ForgotPassword?role=${role}`)}
                >
                  Forget password?
                </a>
                <br />
                {role === "employer" && (
                  <a
                    className={s.signupLink}
                    onClick={() => navigate("/Signup")}
                  >
                    Don't have a employer account? Sign up here
                  </a>
                )}
              </div>
              <button
                className={s.submitButton}
                onClick={handleSubmit}
                type="submit"
              >
                Log in
              </button>
            </Form>
          ) : (
            <div>
              {showDetailsFormAdmin && !showDetailsFormStaff ? (
                <div style={{ width: "120%" }}>
                  <Steps
                    current={current}
                    size="small"
                    className={s.customSteps}
                  >
                    <Step title="Complete user Info" description="" />
                    <Step title="Reset user Password" description="" />
                    <Step title="Registration Completed" description="" />
                  </Steps>
                </div>
              ) : null}

              {showDetailsFormAdmin &&
              !showPasswordDetails &&
              !showConfirmLogin ? (
                <div>
                  <p
                    style={{ marginBottom: "20px", marginTop: "60px" }} //i add marginTop for the journey numbers
                  >
                    Please fill in the following information to complete your
                    registration.
                  </p>

                  <style>
                    {`
        input::placeholder {
          font-size: 14px;
          padding-left: 15px;

        }
      `}
                  </style>
                  <div className={l.profileField}>
                    <input
                      type="text"
                      id="Fname"
                      name="Fname"
                      placeholder="Enter your first name"
                      value={Fname}
                      onFocus={(e) => (e.target.placeholder = "")} // Clear placeholder on focus
                      onBlur={(e) =>
                        (e.target.placeholder = "Enter your first name")
                      } // Restore placeholder on blur if empty
                      onChange={handleInputChange}
                    />
                    {missingFields.Fname && (
                      <p
                        style={{
                          color: "red",
                          marginTop: "3px",
                          fontSize: "14px",
                        }}
                      >
                        {missingFields.Fname}
                      </p>
                    )}
                  </div>

                  <div className={l.profileField}>
                    <input
                      type="text"
                      id="Lname"
                      name="Lname"
                      placeholder="Enter your last name"
                      value={Lname}
                      onFocus={(e) => (e.target.placeholder = "")} // Clear placeholder on focus
                      onBlur={(e) =>
                        (e.target.placeholder = "Enter your last name")
                      } // Restore placeholder on blur if empty
                      onChange={handleInputChange}
                    />
                    {missingFields.Lname && (
                      <p
                        style={{
                          color: "red",
                          marginTop: "3px",
                          fontSize: "14px",
                        }}
                      >
                        {missingFields.Lname}
                      </p>
                    )}
                  </div>

                  <div className={l.profileField}>
                    <input
                      type="text"
                      id="ID"
                      name="ID"
                      placeholder="Enter your id"
                      value={ID}
                      onFocus={(e) => (e.target.placeholder = "")} // Clear placeholder on focus
                      onBlur={(e) => (e.target.placeholder = "Enter your id")} // Restore placeholder on blur if empty
                      onChange={handleInputChange}
                    />
                    {validationMessages.idError && (
                      <p
                        style={{
                          color: "red",
                          marginTop: "3px",
                          fontSize: "14px",
                        }}
                      >
                        {validationMessages.idError}
                      </p>
                    )}
                    {missingFields.ID && (
                      <p
                        style={{
                          color: "red",
                          marginTop: "3px",
                          fontSize: "14px",
                        }}
                      >
                        {missingFields.ID}
                      </p>
                    )}
                  </div>

                  <div className={l.profileField}>
                    <input
                      type="tel"
                      id="Phonenumber"
                      name="Phonenumber"
                      value={Phonenumber}
                      placeholder="+966"
                      onChange={handlePhoneNumberChange}
                      pattern="\+9665\d{8}"
                    />
                    {validationMessages.phoneError && (
                      <p
                        style={{
                          color: "red",
                          marginTop: "3px",
                          fontSize: "14px",
                        }}
                      >
                        {validationMessages.phoneError}
                      </p>
                    )}
                    {missingFields.Phonenumber && (
                      <p
                        style={{
                          color: "red",
                          marginTop: "3px",
                          fontSize: "14px",
                        }}
                      >
                        {missingFields.Phonenumber}
                      </p>
                    )}
                  </div>

                  <button
                    className={s.submitButton}
                    onClick={handleNext}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              ) : showPasswordDetails && !showConfirmLogin ? (
                <div>
                  {showDetailsFormStaff &&
                  !showDetailsFormAdmin &&
                  showPasswordDetails ? (
                    <div>
                      <p
                        style={{ marginBottom: "20px" }} //i add marginTop for the journey numbers
                      >
                        Please reset your password, for security reasons.
                      </p>
                    </div>
                  ) : null}

                  {showDetailsFormAdmin &&
                  !showDetailsFormStaff &&
                  showPasswordDetails ? (
                    <div>
                      <p
                        style={{ marginBottom: "20px", marginTop: "60px" }} //i add marginTop for the journey numbers
                      >
                        Please reset your password, for security reasons.
                      </p>
                    </div>
                  ) : null}

                  <div
                    style={{ position: "relative" }}
                    className={`${l.profileField} ${l.passwordContainer}`}
                  >
                    <input
                      type={showpassworde ? "text" : "password"}
                      name="passworde"
                      value={passworde}
                      placeholder="Enter your new password"
                      onFocus={(e) => (e.target.placeholder = "")} // Clear placeholder on focus
                      onBlur={(e) =>
                        (e.target.placeholder = "Enter your new password")
                      } // Restore placeholder on blur if empty
                      onChange={handleInputChange}
                    />

                    <span
                      onClick={() => togglePasswordVisibility("new")}
                      className={l.passwordVisibilityToggle}
                    >
                      <i
                        className={
                          showpassworde ? "far fa-eye" : "far fa-eye-slash"
                        }
                      ></i>
                    </span>
                    {missingFields["passworde"] && (
                      <p
                        style={{
                          color: "red",
                          marginTop: "3px",
                          fontSize: "14px",
                        }}
                      >
                        {missingFields["passworde"]}
                      </p>
                    )}
                  </div>
                  <div>
                    <ul style={{ marginLeft: "30px", fontSize: "14px" }}>
                      <li
                        style={{
                          color: passwordRequirements.length
                            ? "#059855"
                            : "red",
                        }}
                      >
                        Contain at least 8 characters
                      </li>
                      <li
                        style={{
                          color: passwordRequirements.uppercase
                            ? "#059855"
                            : "red",
                        }}
                      >
                        Contain at least one uppercase letter
                      </li>
                      <li
                        style={{
                          color: passwordRequirements.lowercase
                            ? "#059855"
                            : "red",
                        }}
                      >
                        Contain at least one lowercase letter
                      </li>
                      <li
                        style={{
                          color: passwordRequirements.number
                            ? "#059855"
                            : "red",
                        }}
                      >
                        Contain at least one number
                      </li>
                      <li
                        style={{
                          color: passwordRequirements.special
                            ? "#059855"
                            : "red",
                          marginBottom: "15px",
                        }}
                      >
                        Contain at least one special character(!@#$%^&*)
                      </li>
                    </ul>
                  </div>

                  <div
                    style={{ position: "relative" }}
                    className={`${l.profileField} ${l.passwordContainer}`}
                  >
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={confirmPassword}
                      placeholder="Confirm your new password"
                      onFocus={(e) => (e.target.placeholder = "")} // Clear placeholder on focus
                      onBlur={(e) =>
                        (e.target.placeholder = "Confirm your new password")
                      } // Restore placeholder on blur if empty
                      onChange={handleInputChange}
                    />
                    <span
                      onClick={() => togglePasswordVisibility("confirm")}
                      className={l.passwordVisibilityToggle}
                    >
                      <i
                        className={
                          showConfirmNewPassword
                            ? "far fa-eye"
                            : "far fa-eye-slash"
                        }
                      ></i>
                    </span>
                    {missingFields["confirmPassword"] && (
                      <p
                        style={{
                          color: "red",
                          marginTop: "3px",
                          fontSize: "14px",
                        }}
                      >
                        {missingFields["confirmPassword"]}
                      </p>
                    )}
                    <br />
                  </div>

                  {showDetailsFormAdmin &&
                  showPasswordDetails &&
                  !showDetailsFormStaff ? (
                    <button
                      className={s.submitButton}
                      onClick={handleback}
                      type="button"
                      style={{ marginLeft: "0px" }}
                    >
                      Back
                    </button>
                  ) : null}

                  
                  {showDetailsFormAdmin &&
                  showPasswordDetails &&
                  !showDetailsFormStaff ? (
                    <button
                      className={s.submitButton}
                      onClick={handleNext2}
                      type="button"
                      style={{ marginLeft: "10px" }}
                    >
                      Next
                    </button>
                  ) : null}


                  
                  {!showDetailsFormAdmin &&
                  showPasswordDetails &&
                  showDetailsFormStaff ? (
                    <button
                      className={s.submitButton}
                      onClick={handleNext2}
                      type="button"
                    >
                      Next
                    </button>
                  ) : null}

                  
                </div>
              ) : null}
              {showConfirmLogin &&
              showDetailsFormAdmin &&
              !showDetailsFormStaff &&
              !showPasswordDetails ? (
                <div>
                  <img
                    style={{
                      marginBottom: "20px",
                      marginTop: "60px",
                      width: "180px",
                      height: "auto",
                      marginLeft: "178px",
                    }}
                    src={successImage}
                    alt="success"
                  />
                  <p style={{ marginLeft: "65px" }}>
                    Your registration has been successfully completed.
                  </p>
                  <p style={{ marginLeft: "190px" }}>Click Next to log in.</p>{" "}
                  <br></br>
                  <button
                    style={{ marginLeft: "170px" }}
                    className={s.submitButton}
                    onClick={handleNext3}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {popupVisible && (
        <Modal
          visible={popupVisible}
          onCancel={handleClosePopup}
          footer={<p style={{ textAlign: "center" }}>{popupMessage}</p>}
          style={{ top: "38%" }}
          bodyStyle={{ textAlign: "center" }} // Center text in modal body
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
              style={{ width: "20%", marginBottom: "16px" }} // Adjusted to match the modal style
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Login;
