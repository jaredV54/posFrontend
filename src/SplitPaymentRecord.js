import React, {useEffect, useState, useRef} from "react";
import axios from 'axios';
import ReactToPrint from 'react-to-print';
import decryptedUserDataFunc from './decrypt';
import OPIImage from './OIP.jpg';
import config from "./Config.json";

function SplitPaymentRecord() {
    const [splitPayment, setSplitPayment] = useState([]);
    const [filteredSplitPayment, setFilteredSplitPayment] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [decryptedUserData, setDecryptUserData] = useState({});
    const userType = decryptedUserData.userType;

    useEffect(() => {
      const userData = localStorage.getItem('encryptedData');
    
      if (userData) {
        const decryptionKey = 'NxPPaUqg9d';
        const decrypted = JSON.parse(decryptedUserDataFunc(userData, decryptionKey));
        setDecryptUserData(decrypted);
      }
    }, []);  
    
    const [displayCount, setDisplayCount] = useState(150);
    const [fieldInfo, setFieldInfo] = useState({
      loading: false,
      message: "",
      warn: "",
      isSuccessful: "",
      fetchingData: false
    })

    const [receiptContainer, setReceiptContainer] = useState ({
      splitId: 0,
      container: {},
      client: ""
    })

      useEffect(() => {
        getSplitPayments();
      }, []);

      const handleExpandClick = () => {
        setDisplayCount((prev) => prev + 150);
      }

      const getSplitPayments = async () => {
        try {
          setFieldInfo((prev) => ({...prev, fetchingData: true}))
          const response = await axios.get(`${config.Configuration.database}/splitPaymentRecords`);
          setSplitPayment(response.data);
          setFilteredSplitPayment(response.data);
        } catch (error) {
          if (error.response) {
            if (error.response) {
              setFieldInfo(prev => ({...prev, warn: error.response.data.message}));
            } else if (error.request) {
              setFieldInfo(prev => ({...prev, warn: "Network issue. Please try again later."}));
            } else {
              setFieldInfo(prev => ({...prev, warn: error.message}));
            }
          } else if (error.request) {
            console.error("No response received:", error.request);
          } else {
            console.error("Error during request setup:", error.message);
          }
        } finally {
          setFieldInfo((prev) => ({...prev, fetchingData: false}))
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

      const formatTime = (dateString) => {
        const options = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        const date = new Date(dateString);
        const formattedTime = date.toLocaleTimeString(undefined, options);
        return formattedTime;
      };
      
      const filterTransId = () => {
        const query = searchQuery.trim();
        const filteredSplitId = splitPayment.filter((split) => {
        const id = String(split.id);
        return id === query;
        });
        
        if (filteredSplitId.length > 0) {
          setReceiptContainer((prev) => ({
            ...prev,
            splitId: parseFloat(query)
          }))
        } else {
          setReceiptContainer(prev => ({...prev, splitId: 0}))
        }
        setFilteredSplitPayment(filteredSplitId);
        if (query === "") {
          getSplitPayments()
        }
      };

      useEffect(() => {
        filterTransId();
      }, [searchQuery]);

      const handleRetriveReceipt = (query) => {
        const id = query.toString()
        setSearchQuery(id);
      }

      const fieldMessageRef = useRef(null);
      const fieldWarnRef = useRef(null);
      const fieldIsSuccessfulRef = useRef(null);
  
      useEffect(() => {
        const showNotification = (elementRef) => {
          const element = elementRef.current;
          if (element) {
            element.classList.add("field_show");
            setTimeout(() => {
              element.classList.remove("field_show");
              setTimeout(() => {
                setFieldInfo((prev) => ({
                  ...prev,
                  message: "",
                  warn: "",
                  isSuccessful: ""
                }));
              }, 500);
            }, 3000);
          }
        };
        if (fieldInfo.message) {
          showNotification(fieldMessageRef);
        } else if (fieldInfo.warn){
          showNotification(fieldWarnRef);
        } else if (fieldInfo.isSuccessful) {
          showNotification(fieldIsSuccessfulRef);
        }
      }, [fieldInfo.message, fieldInfo.isSuccessful, fieldInfo.warn]);


    if (userType !== undefined) {
    return (
        <React.Fragment>
          {fieldInfo.fetchingData ? (<>
          <div className="lds-ellipsis"><div></div><div></div><div></div></div>
          </>) : null
          }
        <div className="field_message" ref={fieldMessageRef}>
        {fieldInfo.message}
        </div>
        <div className="field_warn" ref={fieldWarnRef}>
          {fieldInfo.warn}
        </div>
        <div className="field_is_successful" ref={fieldIsSuccessfulRef}>
          {fieldInfo.isSuccessful}
        </div>
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
            placeholder='Split ID'
          />
          <i className='bx bx-search search-icon' ></i>
        </div>

        <Receipt 
        receiptContainer={receiptContainer}
        setReceiptContainer={setReceiptContainer}
        setFieldInfo={setFieldInfo}
        setSearchQuery={setSearchQuery}
        formatDate={formatDate}
        formatTime={formatTime}
        />

        <table className='sales-table'
        style={{
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          <thead className='table-column'>
            <tr className='sales-column'>
              <th>ID</th>
              <th>Trans ID</th>
              <th>Item</th>
              <th>Prev Balance</th>
              <th>Cash</th>
              <th>Balance</th>
              <th>Transaction Datetime</th>
              <th>Receipt#</th>
              <th>Client ID</th>
              <th>Mode of Payment</th>
              <th>Acc Number</th>
              <th>Receipt</th>
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
                <td>{`${formatDate(split.transDate)} ${formatTime(split.transDate)}`}</td>
                <td>{split.receiptNo}</td>
                <td>{split.customerId}</td>
                <td>{split.modeOfPayment}</td>
                <td>{split.accNo}</td>
                <td onClick={() => handleRetriveReceipt(split.id)} className='view_receipt_bttn'>View</td>
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

const stylesForReceipt = {
  container: {
    width: "600px",
    height: "auto",
    padding: "15px",
    position: "relative",
    margin: "75px auto 0",
    zIndex: 120,
    backgroundColor: "#fefefe",
    color: "#262626"
  },
  row1: {
    hybridInfo: {
      container: {
        height: "auto",
      },
      divBorder: {
        borderBottom: "double 6px #373737"
      },
      serviceBckgrnd: {
        container: {
          backgroundColor: "#e1e1e1",
          padding: "10px",
          display: "inlineBlock",
          width: "450px",
          borderRadius: "10px",
          height: "110px",
          marginBottom: "20px"
        },
        div1: {
          fontSize: ".95rem",
          fontWeight: 700,
          textTransform: "uppercase",
          textAlign: "center"
        },
        div2: {
          fontSize: ".87rem",
          fontWeight: 500,
          marginTop: "5px",
        }
      },
      img: {
        width: "130px",
        position: "absolute",
        top: "0",
        right: "0"
      }
    },
  },
  row2: {
    purchaseInfo: {
      container: {
        padding: "20px 0",
        width: "100%",
        height: "auto",
        borderBottom: "double 6px #373737"
      },
      table: {
        container: {
          fontSize: ".9rem",
          fontWeight: 500,
          width: "100%"
        }
      }
    }
  },
  row3: {
    placeInfo: {
      container: {
        padding: "20px 0 0 0",
        width: "100%",
        height: "auto",
      },
      table: {
        container: {
          fontSize: ".9rem",
          fontWeight: 500,
          width: "100%"
        }
      }
    }
  }
}

const Receipt = ({
  receiptContainer,
  setReceiptContainer,
  setFieldInfo,
  setSearchQuery,
  formatDate,
  formatTime
}) => {
  const componentRef = useRef(null);
  const { splitId } = receiptContainer;
  const {
    transDate,
    modeOfPayment,
    amount,
    cash,
    receiptNo,
    balance,
    storeName,
    contactNumber,
    birTin,
    branchName,
    address,
    email,
    name,
    price,
    hybrid,
    fName,
    lName
  } = receiptContainer.container

  const client = `${fName} ${lName}`

  const getReceipt = async () => {
    const id = splitId;

    try {
      setFieldInfo((prev) => ({...prev, loading: true}));
      const response = await axios.get(`${config.Configuration.database}/splitReceipt/${id}`);
      console.log(response.data.result[0]);
      setReceiptContainer((prev) => ({...prev, container: response.data.result[0] }))
    } catch (error) {
      if (error.response) {
        setFieldInfo(prev => ({...prev, warn: error.response.data.message}));
      } else if (error.request) {
        console.log(error.request);
        setFieldInfo(prev => ({...prev, warn: "Network issue. Please try again later."}));
      } else {
        console.log(error.message);
        setFieldInfo(prev => ({...prev, warn: error.message}));
      }
    } finally {
      setFieldInfo((prev) => ({...prev, loading: false}));
    }
  }

  useEffect(() => {
    if (splitId > 0) {
      getReceipt();
      console.log(splitId)
    }
  }, [splitId]);

  if (splitId > 0) {
    return (
      <React.Fragment>
        <div className='react_to_print_sales'>
          <div className='print_bttn_container'
          style={{
            display: "inline-block",
            top: "170px"
          }}>
            <button 
            type="button"
            onClick={() => 
              setSearchQuery("")
              }>
              Remove 
            </button>
            <ReactToPrint
              trigger={() => (
                <button className="print-sales-bttn" >
                  Print Receipt
                </button>
              )}
              content={() => componentRef.current}
              documentTitle="Total Sales"
            />
          </div>
  
          <div ref={componentRef} id='receipt' style={stylesForReceipt.container}>
  
              <div id='hybrid_info' style={stylesForReceipt.row1.hybridInfo.container}>
                <div style={stylesForReceipt.row1.hybridInfo.divBorder}>
                <div id='service_bckgrnd' style={stylesForReceipt.row1.hybridInfo.serviceBckgrnd.container}>
                <div style={stylesForReceipt.row1.hybridInfo.serviceBckgrnd.div1}>
                  -------------------------- {hybrid} --------------------------
                </div>
                <div style={stylesForReceipt.row1.hybridInfo.serviceBckgrnd.div2}>
                  <p style={{fontSize: ".92rem", fontWeight: 600}}>{name}</p>
                  <p><span style={{fontWeight: 600}}>Price: </span>{price}</p>
                </div>
                </div>
                <img src={OPIImage} alt="OPI Logo" style={stylesForReceipt.row1.hybridInfo.img} />
                </div>
              </div>
  
              <div id='purchase_info' style={stylesForReceipt.row2.purchaseInfo.container}>
                <table style={stylesForReceipt.row2.purchaseInfo.table.container}>
                  <tbody>
                    <tr>
                      <td style={{fontWeight: 600}}>Client</td>
                      <td>{client}</td>
                      <td style={{fontWeight: 600}}>Mode of payment</td>
                      <td>{modeOfPayment}</td>
                    </tr>
  
                    <tr>
                      <td style={{fontWeight: 600}}>Date</td>
                      <td>{formatDate(transDate)}</td>
                      <td style={{fontWeight: 600}}>Type of payment</td>
                      <td>Split</td>
                    </tr>
  
                    <tr>
                      <td style={{fontWeight: 600}}>Time</td>
                      <td>{formatTime(transDate)}</td>
                      <td style={{fontWeight: 600}}>Prev Balance</td>
                      <td>{amount}</td>
                    </tr>
  
                    <tr>
                      <td style={{fontWeight: 600}}>Receipt No</td>
                      <td style={{color: "#0204AB"}}>#{receiptNo}</td>
                      <td style={{fontWeight: 600}}>Amount paid</td>
                      <td>{cash}</td>
                    </tr>
  
                    <tr>
                      <td style={{fontWeight: 600}}>Split ID</td>
                      <td style={{color: "#E30403"}}>#{splitId}</td>
                      <td style={{fontWeight: 600}}>Balance</td>
                      <td>{balance}</td> 
                    </tr>
  
                  </tbody>
                </table>
              </div>
  
              <div id='place_info' style={stylesForReceipt.row3.placeInfo.container}>
                <table style={stylesForReceipt.row3.placeInfo.table.container}>
                  <tbody>
                    <tr>
                      <td style={{fontWeight: 600}}>Place</td>
                      <td>{storeName}</td>
                    </tr>
                    <tr>
                      <td style={{fontWeight: 600}}>Address</td>
                      <td>{address}</td>
                    </tr>
                    <tr>
                      <td style={{fontWeight: 600}}>Contact Number</td>
                      <td>{contactNumber}</td>
                    </tr>
                    <tr>
                      <td style={{fontWeight: 600}}>Email</td>
                      <td>{email}</td>
                    </tr>
                    <tr>
                      <td style={{fontWeight: 600}}>BIR TIN</td>
                      <td>{birTin}</td>
                    </tr>
                    <tr>
                      <td style={{fontWeight: 600}}>Branch</td>
                      <td>{branchName}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
  
          </div>
        </div>
      </React.Fragment>
    )
  }
}

export default SplitPaymentRecord;