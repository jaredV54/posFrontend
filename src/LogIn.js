import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Validation from './LogInValidation';
import axios from 'axios';
import config from "./Config.json";
import CryptoJS from 'crypto-js';

function LogIn({ values, setValues, handleLogin  }) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const encryptData = (data, key) => {
    return CryptoJS.AES.encrypt(data, key).toString();
  };

  const [fieldInfo, setFieldInfo] = useState({
    loading: false,
    loggedInAs: ""
  })

  const handleInput = (event) => {
    setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrors(Validation(values));
  };

  const handleSaveToLocalStorage = (data) => {
    const sensitiveData = JSON.stringify(data);
    const encryptionKey = 'NxPPaUqg9d';

    const encrypted = encryptData(sensitiveData, encryptionKey);
    localStorage.setItem('encryptedData', encrypted);
  }

  useEffect(() => {
    if (errors.email === '' && errors.password === '') {
      setFieldInfo((prev) => ({...prev, loading: true}));
      axios.post(`${config.Configuration.database}/login`, values)
        .then((res) => {
          if (res.data && res.data.data) {
            const { userType, storeId, userId } = res.data.data[0];
            if (userType && (storeId || userType === "admin")) {
              handleSaveToLocalStorage({ userType, storeId, userId });
              if (res.data.message === 'Requirements Matched') {
                handleLogin(true);
                navigate('/Purchase');
              }
            } 
          } if (res.data) {
            switch (res.data) {
              case 'Wrong Password':
                setErrors((prev) => ({ ...prev, password: 'Wrong Password' }));
                break;
              case "Email doesn't exist":
                setErrors((prev) => ({ ...prev, email: "User doesn't exist" }));
                break;
              default:
                break;
            }
          }
           else {
            alert("No user data received, Please check your internet");
          }
        })
        .catch((err) => console.log(err))
        .finally(() => {
          setFieldInfo((prev) => ({...prev, loading: false}))
      });
    }
  }, [values, errors, navigate, handleLogin]);
  

  useEffect(() => {
    const savedValues = JSON.parse(localStorage.getItem('loginValues'));
    if (savedValues) {
      setValues(savedValues);
    }
  }, [setValues]);

  return (
    <div className='wrapper'>
      {fieldInfo.loading ? (<span className="loader"></span>) : null}
      <div className="container">
      <fieldset><legend className='page-name'>Log In</legend></fieldset>
        <form action="" onSubmit={handleSubmit}>
          <div className="input-container">
            <label htmlFor="email">Email {errors.email && <span>{errors.email}</span>}</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              required="required"
              onChange={handleInput}
            />
          </div>
          <div className="input-container">
            <label htmlFor="password">Password {errors.password && <span>{errors.password}</span>}</label>
            <input
              required="required"
              type="password"
              name="password"
              placeholder="Enter password"
              onChange={handleInput}
            />
          </div>
          <button className='submit-type-bttn' type="submit">
            <div className='submit-text-logIn'>
             Log in
            </div>
            <i className='bx bx-chevrons-right arrow-right'></i>
          </button>
          <p className='terms-paragraph'>Welcome to PSYZYGY POS!</p>
        </form>
      </div>
    </div>
  );
}

export default LogIn;
