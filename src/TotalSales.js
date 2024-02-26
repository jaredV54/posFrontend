import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import ReactToPrint from 'react-to-print';
import config from "./Config.json"

function TotalSales() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [storeInfo, setStoreInfo] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewOption, setViewOption] = useState('daily');
  const userTypeJSON = JSON.parse(localStorage.getItem("currentUserType"));
  const userType = userTypeJSON.userType;
  const componentRef = useRef(null);
  const [fieldInfo, setFieldInfo] = useState({
    loading: false,
    message: "",
    warn: "",
    isSuccessful: ""
  })

  useEffect(() => {
    getTransactions();
    //fetchStoreInfo();
  }, []);

  /* const fetchStoreInfo = async () => {
    try {
      setFieldInfo((prev) => ({...prev, loading: true }))
      const response = await axios.post(`${config.Configuration.database}/placeInfo`, values);
      setStoreInfo(response.data.storeInfo);
    } catch (error) {
      if (error.response) {
        console.log("Server Error:", error.response.data.message);
        setFieldInfo((prev) => ({
          ...prev,
          warn: error.response.statusText
        }))
      } else if (error.request) {
        setFieldInfo((prev) => ({
          ...prev,
          message: "No response from server. Please check your internet."
        }))
      } else {
        console.log("Error:", error.message);
      }
    } finally {
      setFieldInfo((prev) => ({...prev, loading: false }))
    }
  }; */

  const getTransactions = async () => {
    try {
      const response = await axios.get(`${config.Configuration.database}/transactions`);
      setTransactions(response.data);
      setFilteredTransactions(response.data.transactions);
      setFilteredTransactions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const formatDay = (dateString) => {
    const options = { weekday: 'long' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  };

  
  const handleStartDateChange = (event) => {
    const startDate = event.target.value;
    setStartDate(startDate);
    if (!startDate) {
      setFilteredTransactions(transactions);
    } else {
      filterTransactions(startDate, endDate);
    }
  };

  const handleEndDateChange = (event) => {
    const endDate = event.target.value;
    setEndDate(endDate);
    if (!endDate) {
      setFilteredTransactions(transactions);
    } else {
      filterTransactions(startDate, endDate);
    }
  };

  const filterTransactions = (startDate, endDate) => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && end) {
      if (viewOption === 'daily') {
        start.setHours(0, 0, 0, 0); 
        end.setHours(0, 0, 0, 0); 
      } else if (viewOption === 'monthly') {
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
      } else {
        end.setMonth(end.getMonth() + 12);
        end.setDate(0);
      }
    }
    
    const filtered = transactions.filter((trans) => {
      const transDate = new Date(trans.transDate);
      if (start && end) {
        return transDate >= start && transDate <= end;
      } else {
        return true;
      }
    });
    
    setFilteredTransactions(filtered);
  };
  
  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
    setFilteredTransactions(transactions);
  };

  const combineIdenticalDates = () => {
    const combinedData = {};
    filteredTransactions.forEach((trans) => {
      const { transDate, items, amount } = trans;
      const dateKey = new Date(transDate).toLocaleDateString('en-US');
    
      if (combinedData[dateKey]) {
        combinedData[dateKey].QTY += items;
        combinedData[dateKey].Sales += parseFloat(amount);
      } else {
        combinedData[dateKey] = { Date: dateKey, QTY: items, Sales: parseFloat(amount) };
      }
    });
    
    return Object.values(combinedData);
  };  

  const combinedTransactions = combineIdenticalDates();

  const totalQuantity = combinedTransactions.reduce((sum, item) => sum + item.QTY, 0);
  const totalSales = combinedTransactions.reduce((sum, sale) => sum + parseFloat(sale.Sales), 0);

  const handleViewOptionChange = (event) => {
    setViewOption(event.target.value);
  };

  let viewComponent;
  if (viewOption === 'monthly') {
    viewComponent = (
      <Monthly
        combinedTransactions={combinedTransactions}
        formatDay={formatDay}
        totalQuantity={totalQuantity}
        totalSales={totalSales} 
      />
    )
  } else if (viewOption === 'yearly') {
    viewComponent = (
      <Yearly
        combinedTransactions={combinedTransactions}
        formatDay={formatDay}
        totalQuantity={totalQuantity}
        totalSales={totalSales} 
      />
    )
  } else {
    viewComponent = (
      <Daily
        combinedTransactions={combinedTransactions}
        formatDay={formatDay}
        totalQuantity={totalQuantity}
        totalSales={totalSales}
      />
    );
  }

  if (userType !== 'user' && userType !== undefined) {
  return (
    <div>
      <div className="go-back">
        <Link to="/Purchase"><i className='bx bx-chevron-left' ></i></Link>
      </div>
      <h1 className="total-sales">Total Sales</h1>
      <div className='date-range'>
        <label htmlFor="start-date">From</label>
        <input
          className='start-date'
          type={
          viewOption === 'daily' ?
          "date" : viewOption === 'monthly' ?
          "month" : 
          "year"}
          id="start-date"
          name="start-date"
          value={startDate}
          onChange={handleStartDateChange}
        />
        <label htmlFor="end-date">To</label>
        <input
          className='end-date'
          type={
          viewOption === 'daily' ?
          "date" : viewOption === 'monthly' ?
          "month" : 
          "year"}
          id="end-date"
          name="end-date"
          value={endDate}
          onChange={handleEndDateChange}
        />
        <button className='clear-date' onClick={handleClearDates}>Clear</button>
        <select className="select-date-type" value={viewOption} onChange={(event) => {
         handleViewOptionChange(event);
         handleClearDates();
        }}>
           <option value="daily">Daily</option>
           <option value="monthly">Monthly</option>
           <option value="yearly">Yearly</option>
         </select>
      </div>
      {fieldInfo.loading ? (<>
      <div style={{top: "100%"}} class="lds-ellipsis"><div></div><div></div><div></div></div>
      </>) : null
      }

      <div className="print-sales-bttn-container">
      <ReactToPrint
        trigger={() => (
          <button className="print-sales-bttn" >
            Print Total Sales
          </button>
        )}
        content={() => componentRef.current}
        documentTitle="Total Sales"
      />
      </div>

      <div ref={componentRef} className="sales-data">
        {storeInfo.userTypeIs === 'admin'? null : (
          <div className="store-info" >
          <div>
            <span>Store</span> {storeInfo.storeName}
          </div>
          <div>
            <span>Address:</span> {storeInfo.address}
          </div>
          <div>
            <span>Contact No:</span> {storeInfo.contactNumber}
          </div>
          <div>
            <span>Bir/Tin:</span> {storeInfo.birTin}
          </div>
        </div>
        )}
        {viewComponent}
      </div>
    </div>
  );
  } else {
    return (<div>
      You don't have acces to this page.
    </div>);
  }
}

function Daily({ combinedTransactions, formatDay, totalQuantity, totalSales }) {
  return (
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Date</th>
              <th>Size</th>
              <th>Sales</th>
            </tr>
          </thead>
          <tbody>
          {combinedTransactions.map((trans) => (
            <tr key={`${trans.Day}-${trans.Date}`}>
              <td>{formatDay(trans.Date)}</td>
              <td>{trans.Date}</td>
              <td>{trans.QTY}</td>
              <td>{trans.Sales.toFixed(2)}</td>
            </tr>
          ))}

            <tr style={{backgroundColor: "#6878e0"}}>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>Total:</td>
              <td></td>
              <td>{totalQuantity}</td>
              <td>{totalSales.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
  )
}

function Monthly({ combinedTransactions, totalQuantity, totalSales }) {

  const combineIdenticalMonths = () => {
    const combinedData = {};
    combinedTransactions.forEach((trans) => {
      const { Date: transactionDate, QTY, Sales } = trans;
      const dateParts = transactionDate.split('/');
      const transDate = new Date(`${dateParts[2]}`, dateParts[0] - 1, dateParts[1]);
      const month = transDate.toLocaleString('en-US', { month: 'long' });
      const year = transDate.getFullYear();
      const dateKey = `${month}-${year}`;

      if (combinedData[dateKey]) {
        combinedData[dateKey].QTY += QTY;
        combinedData[dateKey].Sales += Sales;
      } else {
        combinedData[dateKey] = { month, year, QTY, Sales };
      }
    });
    return Object.values(combinedData);
  };

  const combinedMonths = combineIdenticalMonths();

  return (
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Year</th>
            <th>QTY</th>
            <th>Sales</th>
          </tr>
        </thead>
        <tbody>
          {combinedMonths.map((trans, index) => (
            <tr key={index}>
              <td>{trans.month}</td>
              <td>{trans.year}</td>
              <td>{trans.QTY}</td>
              <td>{trans.Sales.toFixed(2)}</td>
            </tr>
          ))}

          <tr style={{ backgroundColor: "#6878e0" }}>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>Total:</td>
            <td></td>
            <td>{totalQuantity}</td>
            <td>{totalSales.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
  );
}

function Yearly({ combinedTransactions, formatDay, totalQuantity, totalSales }) {
  const combineIdenticalYears = () => {
    const combinedData = {};
    combinedTransactions.forEach((trans) => {
      const { Date: transactionDate, QTY, Sales } = trans;
      const dateParts = transactionDate.split('/');
      const year = dateParts[2];

      if (combinedData[year]) {
        combinedData[year].QTY += QTY;
        combinedData[year].Sales += Sales;
      } else {
        combinedData[year] = { year, QTY, Sales };
      }
    });

    return Object.values(combinedData);
  };

  const combinedYears = combineIdenticalYears();

  return (
      <table>
        <thead>
          <tr>
            <th>Year</th>
            <th>QTY</th>
            <th>Sales</th>
          </tr>
        </thead>
        <tbody>
          {combinedYears.map((trans, index) => (
            <tr key={index}>
              <td>{trans.year}</td>
              <td>{trans.QTY}</td>
              <td>{trans.Sales.toFixed(2)}</td>
            </tr>
          ))}

          <tr style={{ backgroundColor: "#6878e0" }}>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>Total:</td>
            <td>{totalQuantity}</td>
            <td>{totalSales.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
  );
}


export default TotalSales;
