import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.scss'
import './Home.scss'
import './Purchase.scss'
import './Store.scss'
import './Customer.scss'
import './SalesRecord.scss'
import './TotalSales.scss'
import './Nav.scss'
import './SplitPayment.scss'
import './SplitPaymentRecords.scss'
import './PageContainer.scss'
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'></link>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
