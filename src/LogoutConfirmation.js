import React from 'react';

const LogoutConfirmation = ({ onCancel, onLogout }) => {
  return (
    <div className="logout-confirmation">
      <div className='log-out-container'>
      <p>Are you sure you want to log out?</p>
      <div>
      <button onClick={onCancel}>Cancel</button>
      <button className='log-out-bttn' onClick={onLogout}>Log Out</button>
      </div>
      </div>
    </div>
  );
};

export default LogoutConfirmation;
