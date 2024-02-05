import React, { useEffect, useState } from 'react';
import { Link, useMatch, useResolvedPath, useNavigate } from 'react-router-dom';
import LogoutConfirmation from './LogoutConfirmation';
import axios from 'axios';
import config from "./Config.json";

const NavArea = () => {
  const [openBar, setOpenBar] = useState(true);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const navigate = useNavigate();
  const userType = JSON.parse(localStorage.getItem("currentUserType"));

  const handleMenuClick = () => {
    const NavMenu = document.getElementById("nav-menu");
    const NavArea = document.getElementById("nav-container");
    const shadow = document.getElementById("shadow");
    setOpenBar((prevOpenBar) => !prevOpenBar);
    if (openBar) {
      NavMenu.classList.add("close-nav-menu");
      NavArea.classList.add("open-nav-area");
      shadow.classList.add("show-shadow");
    } else {
      NavMenu.classList.remove("close-nav-menu");
      NavArea.classList.remove("open-nav-area");
      shadow.classList.remove("show-shadow");
    }
  };

  const handleRemoveClass = () => {
    const NavMenu = document.getElementById("nav-menu");
    const NavArea = document.getElementById("nav-container");
    const shadow = document.getElementById("shadow");
    setOpenBar((prevOpenBar) => !prevOpenBar);
    if (!openBar) {
      NavMenu.classList.remove("close-nav-menu");
      shadow.classList.remove("show-shadow");
      NavArea.classList.remove("open-nav-area");
    }
  };

  const handleLogoutConfirmation = () => {
    setShowLogoutConfirmation(true);
  };

  const handleLogout = () => {
    setShowLogoutConfirmation(false);
    localStorage.removeItem('loginValues');
    localStorage.removeItem('currentUserType');
    localStorage.removeItem('selectedCustomer');
    localStorage.removeItem('authenticated');
    localStorage.removeItem('transId');
    navigate('/');
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  if (userType.userType !== undefined) {
  return (
    <React.Fragment>
      <div id='nav-menu-container' className='nav-menu-container'>
        <div onClick={handleMenuClick} id='nav-menu' className='open-nav-menu'></div>
      </div>
      <div id='shadow' className='shadow' onClick={handleRemoveClass}></div>
      <nav id='nav-container' className='nav-area close-nav-area'>
        {userType.userType === 'admin' ?
        (
          <ul className='nav-ul' onClick={handleRemoveClass}>
            <CustomLink to="/Purchase"><i className='bx bx-money' data-text="Purchase"></i></CustomLink>
            <CustomLink to="/Hybrid"><i className='bx bx-category' data-text="Product/Service"></i></CustomLink>
            <CustomLink to="/SalesRecord"><i className='bx bx-bar-chart-square' data-text="Sales Record"></i></CustomLink>
            <CustomLink to="/Transactions"><i className='bx bx-transfer-alt' data-text="Transactions"></i></CustomLink>
            <CustomLink to="/SplitPaymentRecord"><i className='bx bx-expand-horizontal' data-text="Split Payments"></i></CustomLink>
            <CustomLink to="/TotalSales"><i className='bx bx-dollar-circle' data-text="Total Sales"></i></CustomLink>
            <CustomLink to="/Store"><i className='bx bxs-store' data-text="Store"></i></CustomLink>
            <CustomLink to="/Customer"><i className='bx bx-spreadsheet' data-text="Clients"></i></CustomLink>
            <CustomLink to="/User"><i className='bx bxs-user' data-text="User"></i></CustomLink>
          <li>
            <span onClick={handleLogoutConfirmation}>
              <i className='bx bx-log-out' data-text="Log out"
              style={{
                cursor: "pointer",
                color: "#fff"
              }}></i>
            </span>
          </li>
        </ul>
        ) : userType.userType === 'manager' ? (
          <ul className='nav-ul' onClick={handleRemoveClass}>
            <CustomLink to="/Purchase"><i className='bx bx-money' data-text="Purchase"></i></CustomLink>
            <CustomLink to="/Hybrid"><i className='bx bx-category' data-text="Product/Service"></i></CustomLink>
            <CustomLink to="/SalesRecord"><i className='bx bx-bar-chart-square' data-text="Sales Record"></i></CustomLink>
            <CustomLink to="/Transactions"><i className='bx bx-transfer-alt' data-text="Transactions"></i></CustomLink>
            <CustomLink to="/SplitPaymentRecord"><i className='bx bx-expand-horizontal' data-text="Split Payments"></i></CustomLink>
            <CustomLink to="/TotalSales"><i className='bx bx-dollar-circle' data-text="Total Sales"></i></CustomLink>
            <CustomLink to="/Customer"><i className='bx bx-spreadsheet' data-text="Clients"></i></CustomLink>
          <li>
            <span onClick={handleLogoutConfirmation}>
              <i className='bx bx-log-out' data-text="Log out"
              style={{
                cursor: "pointer",
                color: "#fff"
              }}></i>
            </span>
          </li>
        </ul>
        ) : (
          <ul className='nav-ul' onClick={handleRemoveClass}>
            <CustomLink to="/Purchase"><i className='bx bx-money' data-text="Purchase"></i></CustomLink>
            <CustomLink to="/Transactions"><i className='bx bx-transfer-alt' data-text="Transactions"></i></CustomLink>
            <CustomLink to="/SplitPaymentRecord"><i className='bx bx-expand-horizontal' data-text="Split Payments"></i></CustomLink>
            <CustomLink to="/Customer"><i className='bx bx-spreadsheet' data-text="Clients"></i></CustomLink>
          <li>
            <span onClick={handleLogoutConfirmation}>
              <i className='bx bx-log-out' data-text="Log out"
              style={{
                cursor: "pointer",
                color: "#fff"
              }}></i>
            </span>
          </li>
        </ul>
        )}
      </nav>

       {showLogoutConfirmation && (
        <LogoutConfirmation
          onCancel={handleCancelLogout}
          onLogout={handleLogout}
        />
      )}
    </React.Fragment>
  );
  } else {
    return (<div></div>)
  } 
};

function CustomLink({ to, children, ...props }) {
  const resolvedPath = useResolvedPath(to);
  const isActive = useMatch({ path: resolvedPath.pathname, end: true });
  return (
    <li className={isActive ? "active" : ""}>
      <Link to={to} {...props}>{children}</Link>
    </li>
  );
}

export default NavArea;
