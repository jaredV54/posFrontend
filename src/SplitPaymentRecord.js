import React, {useEffect, useState, useRef} from "react";
import axios from 'axios';
import { Link } from 'react-router-dom';
import ReactToPrint from 'react-to-print';
import config from "./Config.json";

function SplitPaymentRecord() {
    const [splitPayment, setSplitPayment] = useState([]);
    const [filteredSplitPayment, setFilteredSplitPayment] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [storeInfo, setStoreInfo] = useState([]);
    const [endDate, setEndDate] = useState('');
    const initialValues = JSON.parse(localStorage.getItem('loginValues')) || {
      email: '',
      password: ''
    };
    const userTypeJSON = JSON.parse(localStorage.getItem("currentUserType"));
    const userType = userTypeJSON.userType;
    const [displayCount, setDisplayCount] = useState(150);
    const [values, setValues] = useState(initialValues);
    const [fieldInfo, setFieldInfo] = useState({
      loading: false
    })

      useEffect(() => {
        getSplitPayments();
      }, []);

      useEffect(() => {
        filterTransId();
      }, [searchQuery]);

      useEffect(() => {
        fetchStoreInfo();
      }, [values]);

      const handleExpandClick = () => {
        setDisplayCount((prev) => prev + 150);
      }
    
      const fetchStoreInfo = async () => {
        try {
          setFieldInfo((prev) => ({...prev, loading: true }))
          const response = await axios.post(`${config.Configuration.database}/placeInfo`, values);
          setStoreInfo(response.data.storeInfo);
        } catch (error) {
          if (error.response) {
            console.log("Server Error:", error.response.data);
          } else if (error.request) {
            console.log("No response from server");
          } else {
            console.log("Error:", error.message);
          }
        } finally {
          setFieldInfo((prev) => ({...prev, loading: false }))
        }
      }

      const getSplitPayments = async () => {
        try {
          const response = await axios.get(`${config.Configuration.database}/splitPaymentRecords`);
          setSplitPayment(response.data);
          setFilteredSplitPayment(response.data);
        } catch (error) {
          if (error.response) {
            console.error("Request failed with status code:", error.response.status);
            console.error("Error data:", error.response.data);
            console.error("Request headers:", error.response.headers);
          } else if (error.request) {
            console.error("No response received:", error.request);
          } else {
            console.error("Error during request setup:", error.message);
          }
        }
      };

      const handleClearDates = () => {
        setStartDate('');
        setEndDate('');
        setFilteredSplitPayment(splitPayment);
      };

      const handleStartDateChange = (event) => {
        const startDate = event.target.value;
        setStartDate(startDate);
        if (!startDate) {
          setFilteredSplitPayment(splitPayment);
        } else {
          filterTransactions(startDate, endDate);
        }
      };
    
      const handleEndDateChange = (event) => {
        const endDate = event.target.value;
        setEndDate(endDate);
        if (!endDate) {
          setFilteredSplitPayment(splitPayment);
        } else {
          filterTransactions(startDate, endDate);
        }
      };

      const filterTransactions = (startDate, endDate) => {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
    
        if (start && end) {
            start.setHours(0, 0, 0, 0); 
            end.setHours(0, 0, 0, 0); 
        }

        const filtered = splitPayment.filter((trans) => {
          const transDate = new Date(trans.transDate);
          if (start && end) {
            return transDate >= start && transDate <= end;
          } else {
            return true;
          }
        });
          
        setFilteredSplitPayment(filtered);
      }

      const formatDate = (dateString) => {
        const options = { month: '2-digit', day: '2-digit', year: '2-digit'};
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString('en-US', options).replace(',', ' -');
        return formattedDate;
      }; 

      const formatDay = (dateString) => {
        const options = { weekday: 'long' };
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, options);
      };
      
      const filterTransId = () => {
        const query = searchQuery.trim();
        if (query === '') {
          setFilteredSplitPayment(splitPayment);
        } else {
          const filteredTransId = splitPayment.filter((split) => {
          const id = String(split.transId);
          return id === query;
        });
          setFilteredSplitPayment(filteredTransId);
        }
      };

    if (userType !== undefined) {
    return (
        <React.Fragment>
        <div className="split-records-container">
        <div id='sales-record-container'>
        <h1>Split Payment Records</h1>

        <div className='date-range'>
        <label htmlFor="start-date">From</label>
        <input
          className='start-date'
          type='date'
          id="start-date"
          name="start-date"
          value={startDate}
          onChange={handleStartDateChange}
        />
        <label htmlFor="end-date">To</label>
        <input
          className='end-date'
          type='date'
          id="end-date"
          name="end-date"
          value={endDate}
          onChange={handleEndDateChange}
        />
        <button className='clear-date' onClick={handleClearDates}>Clear</button>
      </div>

        <div className='search-form'>
          <input
            className='search-bar'
            type='number'
            name='search-bar'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Trans No#'
          />
          <i className='bx bx-search search-icon' ></i>
        </div>
        <Receipt storeInfo={storeInfo}
        trackReceipt={filteredSplitPayment}
        formatDay={formatDay}
        searchQuery={searchQuery}
        formatDate={formatDate}
        startDate={startDate}
        endDate={endDate} />
        <table className='sales-table'>
          <thead className='table-column'>
            <tr className='sales-column'>
              <th>ID</th>
              <th>Trans ID</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Cash</th>
              <th>Balance</th>
              <th>Transaction Date</th>
              <th>Receipt No#</th>
              <th>Client ID</th>
              <th>Mode of Payment</th>
              <th>Acc Number</th>
            </tr>
          </thead>
          <tbody className='table-rows'>
          {filteredSplitPayment.slice(0, displayCount).map((split) => (
              <tr key={split.id} className='sales-row'>
                <td>{split.id}</td>
                <td>{split.transId}</td>
                <td>{split.items}</td>
                <td>{split.amount}</td>
                <td>{split.cash}</td>
                <td style={{ color: split.balance === '0.00' ? '#f7860e' : 'inherit' }}>{split.balance}</td>
                <td>{formatDate(split.transDate)}</td>
                <td>{split.receiptNo}</td>
                <td>{split.customerId}</td>
                <td>{split.modeOfPayment}</td>
                <td>{split.accNo}</td>
              </tr>
          ))}
          {filteredSplitPayment.length >= displayCount ? (
              <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td id='expand' onClick={handleExpandClick}>Expand</td>
            </tr>
            ): null}
            </tbody>

        </table>
        {fieldInfo.loading ? (<>
            <div style={{top: "100%"}} class="lds-ellipsis"><div></div><div></div><div></div></div>
            </>) : null
          }
      </div>
            </div>
        </React.Fragment>
    );
    } else {
      (<div>
        You don't have acces to this page.
      </div>);
    }
}

const Receipt = ({storeInfo, trackReceipt, formatDay, searchQuery, formatDate, startDate, endDate}) => {

  const componentRef = React.createRef();
    if ((searchQuery || (startDate && endDate)) && trackReceipt.length > 0) {
      return (
        <React.Fragment>
          <ReactToPrint 
            trigger={() => {
              return <button className='print-button' style={{
                position: "relative",
                left: "50%",
                marginTop: "20px",
                transform: "translateX(-50%)"
              }}>Print Data</button>
            }}
            content={() => componentRef.current}
            documentTitle='Split Transaction'
            />
            <div ref={componentRef} className="print-split-records-container"
            style={{
              width: "550px",
              margin: "10px auto",
              position: "relative",
              left: "0px"
            }}>
              {storeInfo.userTypeIs === 'admin'? null : (
                <div className="store-info" >
                <div>
                  <span>Store:</span> {storeInfo.storeName}
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
            <table className='print-split-table' style={{
              marginTop: "20px",
              color: "#fff",
              border: "2px solid #1a1a1a",
              fontSize: ".95rem",
              width: "550px",
              fontWeight: "500"
            }}>
            <thead className='table-column' style={{
              backgroundColor: "#313a72"
            }}>
              <tr className='sales-column'>
                <th style={{padding: "5px"}}>Split ID</th>
                <th style={{padding: "5px"}}>Trans ID</th>
                <th style={{padding: "5px"}}>Cust ID</th>
                <th style={{padding: "5px"}}>Day</th>
                <th style={{padding: "5px"}}>Date</th>
                <th style={{padding: "5px"}}>Amount</th>
                <th style={{padding: "5px"}}>Cash</th>
                <th style={{padding: "5px"}}>Balance</th>
              </tr>
            </thead>
            {trackReceipt.map((split) => (
              <tbody className='table-rows' key={split.id} style={{
                backgroundColor: "#dfdfdf",
                color: "#1a1a1a",
                fontWeight: "500"
              }}>
                <tr className='sales-row'>
                  <td style={{padding: "5px"}}>{split.id}</td>
                  <td style={{padding: "5px"}}>{split.transId}</td>
                  <td style={{padding: "5px"}}>{split.customerId}</td>
                  <td style={{padding: "5px"}}>{formatDay(split.transDate)}</td>
                  <td style={{padding: "5px"}}>{formatDate(split.transDate)}</td>
                  <td style={{padding: "5px"}}>{split.amount}</td>
                  <td style={{padding: "5px"}}>{split.cash}</td>
                  <td style={{ color: split.balance === '0.00' ? '#f7860e' : 'inherit', padding: "5px" }}>{split.balance}</td>
                </tr>
              </tbody>
            ))}
            </table>
            
            </div>
        </React.Fragment>
    )
    } else {
      return null
    }
}

export default SplitPaymentRecord;