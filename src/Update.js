import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Validation from './UpdateValidation';
import axios from 'axios';

function Update() {
  const navigate = useNavigate();

  const [values, setValues] = useState({
    password: '',
    email: '',
    newPassword: '',
    wrongInput: ''
  });

  const [errors, setErrors] = useState({});

  const processAccount = () => {
    if (
      errors.email === '' &&
      errors.password === '' &&
      errors.newPassword === ''
    ) {
      if (
        values.password !== '' &&
        values.newPassword !== '' &&
        values.password === values.newPassword
      ) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          identicalPass: 'Identical'
        }));
      } else {
        axios
          .post('http://localhost:8081/update', values)
          .then((res) => {
            if (res.data === 'Change Password Success') {
              alert('Password Changed');
              navigate('/');
            } else if (res.data === 'Wrong Password') {
              setErrors((prev) => ({ ...prev, password: 'Wrong Password' }));
            } else if (res.data === "Email doesn't exist") {
              setErrors((prev) => ({ ...prev, email: "User doesn't exist" }));
            } else {
              alert('Error');
            }
          })
          .catch((err) => console.log(err));
      }
    }
  };

  const handleInput = (event) => {
    setValues((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
      wrongInput: '',
      identicalPass: ''
    }));
  };

  const handleSubmit = (event) => {
    processAccount();
    event.preventDefault();
    setErrors(Validation(values));
  };

  return (
    <div className='wrapper'>
      <div className="container">
        <fieldset>
          <legend className="page-name">Update Account</legend>
        </fieldset>
        <form action="" onSubmit={handleSubmit}>
          <div className="input-container">
            {errors.wrongInput && <span>{errors.wrongInput}</span>}
            <label htmlFor="email">
              Email {errors.email && <span>{errors.email}</span>}
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your Email"
              onChange={handleInput}
            />
          </div>
          <div className="input-container">
            <label htmlFor="password">
              Current Password{' '}
              {errors.password && <span>{errors.password}</span>}
              {errors.identicalPass && (
                <span className="identical-pass">{errors.identicalPass}</span>
              )}
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              onChange={handleInput}
            />
          </div>
          <div className="input-container">
            <label htmlFor="password">
              New Password{' '}
              {errors.newPassword && <span>{errors.newPassword}</span>}
              {errors.identicalPass && (
                <span className="identical-pass">{errors.identicalPass}</span>
              )}
            </label>
            <input
              type="password"
              name="newPassword"
              placeholder="New password"
              onChange={handleInput}
            />
          </div>
          <button className="submit-type-bttn" type="submit">
            <div className="submit-text-update">Change Password</div>
            <i className="bx bxs-user-detail user-detail"></i>
          </button>
        </form>
        <div>
          <div>
            <Link className="link" to="/">
              <button className="change-page-bttn">
                <div className="login-acc-txt">Log In</div>
                <i className="bx bx-chevrons-right arrow-right"></i>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Update;
