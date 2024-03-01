import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import ReactToPrint from 'react-to-print';
import decryptedUserDataFunc from './decrypt';
import config from "./Config.json"

function TotalSales() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [storeInfo, setStoreInfo] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewOption, setViewOption] = useState('daily');
  const [place, setPlace] = useState({
    pickedPlaceId: 0,
    selectedPlace: {},
    places: [{}]
  })
  const [decryptedUserData, setDecryptUserData] = useState({});
  const userType = decryptedUserData.userType;
  console.log(place.selectedPlace)
  useEffect(() => {
    const userData = localStorage.getItem('encryptedData');
  
    if (userData) {
      const decryptionKey = 'NxPPaUqg9d';
      const decrypted = JSON.parse(decryptedUserDataFunc(userData, decryptionKey));
      setDecryptUserData(decrypted);
    }
  }, []);  
  
  const componentRef = useRef(null);
  const [fieldInfo, setFieldInfo] = useState({
    loading: false,
    message: "",
    warn: "",
    isSuccessful: "",
    isfetching: false
  })

  useEffect(() => {
    getTransactions();
    getPlaces()
  }, []);

  useEffect(() => {
    if (place.selectedPlace.id > 0) {
      filterSalesById();
    } else {
      getTransactions();
    }
  }, [place.selectedPlace])

  const filterSalesById = async () => {
    const id = place.selectedPlace.id;
    try {
      setFieldInfo((prev) => ({...prev, isfetching: true}));
      const response = await axios.get(`${config.Configuration.database}/transactionPlace/${id}`);
      console.log(response.data.result)
      if (response.data.isSuccessful) setFilteredTransactions(response.data.result);
    } catch (error) {
      console.log(error.response)
    } finally {
      setFieldInfo((prev) => ({...prev, isfetching: false}));
    }
  }

  const getPlaces = async () => {
    try {
      setFieldInfo((prev) => ({...prev, loading: true}));
      const response = await axios.get(`${config.Configuration.database}/store`);
      if (response.data.isSuccessful) setPlace(prev => ({...prev, places: response.data.result}));
    } catch (error) {
      if (error.response) {
        setFieldInfo((prev) => ({...prev, warn: error.response.data.message}));
      } else if (error.request) {
        setFieldInfo((prev) => ({...prev, warn: "Network issue. Please try again later."}));
      } else {
        setFieldInfo((prev) => ({...prev, warn: error.message}))
      } 
    } finally {
      setFieldInfo((prev) => ({...prev, loading: false}));
    }
  }

  const getTransactions = async () => {
    try {
      setFieldInfo((prev) => ({...prev, loading: true}));
      const response = await axios.get(`${config.Configuration.database}/transactions`);
      setTransactions(response.data);
      setFilteredTransactions(response.data.transactions);
      setFilteredTransactions(response.data);
    } catch (error) {
      if (error.response) {
        setFieldInfo((prev) => ({...prev, warn: error.response.data.message}));
      } else {
        setFieldInfo((prev) => ({...prev, warn: error.message}))
      } 
    } finally {
      setFieldInfo((prev) => ({...prev, loading: false}));
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

  const handleShowPlaceIds = () => {
    const button = document.querySelector(".place_id_container");
    if (button) {
      button.classList.toggle("place_id_container_toggle")
    }
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

      <div className="print_bttn_container"
      style={{
        position: "relative",
        top: 0,
        marginTop: "20px"
      }}>

      <button className="select_place_id" onClick={() => handleShowPlaceIds()}>
        <span>Select Place</span>
        <div className="place_id_container">
          <div onClick={() => setPlace((prev) => ({...prev, selectedPlace: {}}))}>
            All place revenue
          </div>
          {place.places.length > 0 ? place.places.map((p) => (
            <div key={p.id} onClick={() => setPlace((prev) => ({...prev, selectedPlace: p}))}>
              {p.storeName}
            </div> 
          )) : null}
        </div>
      </button>

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
        {place.selectedPlace.id > 0 ? (
          <div className="store-info" >
          <div>
            <span>Store</span> {place.selectedPlace.storeName}
          </div>
          <div>
            <span>Address:</span> {place.selectedPlace.address}
          </div>
          <div>
            <span>Contact No:</span> {place.selectedPlace.contactNumber}
          </div>
          <div>
            <span>Bir/Tin:</span> {place.selectedPlace.birTin}
          </div>
        </div>
        ) : null}
        {viewComponent}
      </div>
    </div>
  );
  } else {
    return;
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
            <th>Size</th>
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
            <th>Size</th>
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
