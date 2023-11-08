import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Validation from './LogInValidation';
import axios from 'axios';
import config from "./Config.json";

function LogIn({ values, setValues, setAuthenticated  }) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const handleInput = (event) => {
    setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    setErrors(Validation(values));
  };

  useEffect(() => {
    if (errors.email === '' && errors.password === '') {
      axios
        .post(`${config.Configuration.database}/login`, values)
        .then((res) => {
          const { userType, storeId } = res.data.data[0];
          if (userType && storeId) {
            localStorage.setItem('currentUserType', JSON.stringify({ userType, storeId }));
            if (res.data.message === 'Requirements Matched') {
              localStorage.setItem('loginValues', JSON.stringify({ email: values.email }));
              setAuthenticated(true);
              navigate('/Purchase');
            } else if (res.data === 'Wrong Password') {
              setErrors((prev) => ({ ...prev, password: 'Wrong Password' }));
            } else if (res.data === "Email doesn't exist") {
              setErrors((prev) => ({ ...prev, email: "User doesn't exist" }));
            } else {
              console.log(res.data);
              alert('Error');
            }
          } else {
            navigate("/");
          }
        })
        .catch((err) => console.log(err));
    }
  }, [values, errors, navigate]);

  useEffect(() => {
    const savedValues = JSON.parse(localStorage.getItem('loginValues'));
    if (savedValues) {
      setValues(savedValues);
    }
  }, [setValues]);

  return (
    <div className='wrapper'>
      <div className="container">
      <fieldset><legend className='page-name'>Log In</legend></fieldset>
        <form action="" onSubmit={handleSubmit}>
          <div className="input-container">
            <label htmlFor="email">Email {errors.email && <span>{errors.email}</span>}</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              onChange={handleInput}
            />
          </div>
          <div className="input-container">
            <label htmlFor="password">Password {errors.password && <span>{errors.password}</span>}</label>
            <input
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
          <p className='terms-paragraph'>You agree to our Terms of Policies?</p>
        </form>
      </div>
    </div>
  );
}

export default LogIn;
