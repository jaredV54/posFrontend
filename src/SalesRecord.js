import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ReactToPrint from 'react-to-print';
import config from "./Config.json";
import decryptedUserDataFunc from './decrypt';
import OPIImage from './OIP.jpg';

function SalesRecord() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [displayCount, setDisplayCount] = useState(150);
  const [searchQuery, setSearchQuery] = useState('');
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
  useEffect(() => {
    getSalesRecord();
  }, []);

  const [fieldInfo, setFieldInfo] = useState({
    loading: false,
    message: "",
    warn: "",
    isSuccessful: "",
    fetching: false
  });

  const [receiptContainer, setReceiptContainer] = useState ({
    transId: 0,
    container: [],
    hybridName: "",
    actualPrice: "",
    hybridType: "",
    selectedHybrids: []
  })

  const getSalesRecord = async () => {
    try {
      setFieldInfo((prev) => ({...prev, loading: true }));
      const response = await axios.get(`${config.Configuration.database}/sales`);
      if (response.data !== 'Error retrieving sales record') {
        setSales(response.data);
      } else {
        setFieldInfo((prev) => ({
          ...prev,
          message: response.data
        }))
      }
    } catch (error) {
      if (error.response) {
        setFieldInfo((prev) => ({
          ...prev,
          warn: error.response.data
        }))
      } else if (error.request) {
        setFieldInfo((prev) => ({
          ...prev,
          warn: "Network issue please try again!"
        }))
      } else {
        setFieldInfo((prev) => ({
          ...prev,
          warn: error.message
        }))
      }
    } finally {
      setFieldInfo((prev) => ({...prev, loading: false }));
    }
  };

  const filterSales = () => {
    const query = searchQuery.trim();
    const filteredSalesQuery = sales.filter((sale) => {
      const transId = String(sale.transId);
      return transId === query;
    });

    if (filteredSalesQuery.length > 0) {
      console.log(filteredSalesQuery)
      setReceiptContainer(prev => ({
        ...prev, 
        transId: parseFloat(query),
        hybridName: filteredSalesQuery[0].name,
        actualPrice: filteredSalesQuery[0].price,
        hybridType: filteredSalesQuery[0].hybrid,
        selectedHybrids: filteredSalesQuery
      }))
    } else {
      setReceiptContainer(prev => ({...prev, transId: 0}))
    }
    setFilteredSales(filteredSalesQuery);
  };

  const formatDate = (dateString) => {
    const options = {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', options);
    return formattedDate;
  };

  const handleExpandClick = () => {
    setDisplayCount((prev) => prev + 150);
  }

  useEffect(() => {
    filterSales();
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
      <div>
        {fieldInfo.fetching ? (<span className="loader"></span>) : null}
        <div className="field_message" ref={fieldMessageRef}>
        {fieldInfo.message}
        </div>
        <div className="field_warn" ref={fieldWarnRef}>
          {fieldInfo.warn}
        </div>
        <div className="field_is_successful" ref={fieldIsSuccessfulRef}>
          {fieldInfo.isSuccessful}
        </div>

        <div className="go-back">
          <Link to="/Purchase"><i className='bx bx-chevron-left' ></i></Link>
        </div>
        <div id='sales-record-container'>
          <h1>Sales Record</h1>
          <div className='search-form'>
            <input
              className='search-bar'
              type='number'
              name='search-bar'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Transaction ID'
            />
            <i className='bx bx-search search-icon' ></i>
          </div>
          <Receipt 
          trackReceipt={filteredSales} 
          searchQuery={searchQuery} 
          receiptContainer={receiptContainer} 
          setReceiptContainer={setReceiptContainer}
          fieldInfo={fieldInfo}
          setFieldInfo={setFieldInfo}
          setSearchQuery={setSearchQuery}
          />
          <table className='sales-table'
          style={{
            marginLeft: "auto",
            marginRight: "auto",
          }}>
          {fieldInfo.loading ? (<>
            <div style={{top: "100%"}} class="lds-ellipsis"><div></div><div></div><div></div></div>
            </>) : null
          }
            <thead className='table-column'>
              <tr className='sales-column'>
                <th>ID</th>
                <th>Trans ID</th>
                <th>Type</th>
                <th>Name</th>
                <th>Date Time Purchased</th>
                <th>Actual Price</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody className='table-rows' >
            {filteredSales.length > 0 ? filteredSales.slice(0, displayCount).map((sale) => (
                <tr className='sales-row' key={sale.salesId}>
                  <td>{sale.salesId}</td>
                  <td>{sale.transId}</td>
                  <td>{sale.hybrid}</td>
                  <td>{sale.name}</td>
                  <td>{formatDate(sale.dateTimePurchased)}</td>
                  <td>{sale.price}</td>
                  <td>{sale.hybrid === 'service' ? "N/A" : sale.quantity}</td>
                  <td>{sale.hybrid === 'service' ? sale.price : (sale.price * sale.quantity).toFixed(2)}</td>
                  <td onClick={() => handleRetriveReceipt(sale.transId)} className='view_receipt_bttn'>View</td>
                </tr>
            )) : sales.length > 0 ? sales.slice(0, displayCount).map((sale) => (
              <tr className='sales-row' key={sale.salesId}>
                <td>{sale.salesId}</td>
                <td>{sale.transId}</td>
                <td>{sale.hybrid}</td>
                <td>{sale.name}</td>
                <td>{formatDate(sale.dateTimePurchased)}</td>
                <td>{sale.price}</td>
                <td>{sale.hybrid === 'service' ? "N/A" : sale.quantity}</td>
                <td>{sale.hybrid === 'service' ? sale.price : (sale.price * sale.quantity).toFixed(2)}</td>
                <td onClick={() => handleRetriveReceipt(sale.transId)} className='view_receipt_bttn'>View</td>
              </tr>
            )) : null}
            {filteredSales.length >= displayCount ? (
              <tr>
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
        </div>
      </div>
    )
  } else {
    return (<div>
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
          minHeight: "110px",
          height: "auto",
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
  setSearchQuery
}) => {
  const componentRef = useRef(null);
  const { 
    transId,
    hybridType,
    actualPrice,
    hybridName,
    selectedHybrids
  } = receiptContainer;

  const {
    fName,
    lName,
    transDate,
    modeOfPayment,
    typeOfPayment,
    amount,
    changeAmount,
    cash,
    receiptNo,
    balance,
    storeName,
    contactNumber,
    birTin,
    branchName,
    address,
    email
  } = receiptContainer.container;

  const getRecords = async () => {
    try {
      setFieldInfo(prev => ({...prev, fetching: true}));
      const response = await axios.get(`${config.Configuration.database}/receipt/${transId}`); 
      if (response.data.isSuccessful) {
        setReceiptContainer((prev) => ({
          ...prev,
          container: response.data.result[0]
        }))
      } else {
        setFieldInfo(prev => ({...prev, warn: response.data.message}));
      }
    } catch (error) {
      if (error.response) {
        setFieldInfo(prev => ({...prev, warn: error.response.data.message}));
      } else if (error.request) {
        setFieldInfo(prev => ({...prev, warn: "Network issue. Please try again later."}));
      } else {
        setFieldInfo(prev => ({...prev, warn: error.message}));
      }
    } finally {
      setFieldInfo(prev => ({...prev, fetching: false}));
    }
  }

  const formatDate = (dateString) => {
    const options = {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    };
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString(undefined, options);
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

  useEffect(() => {
    if (transId) {
      getRecords();
    }
  }, [transId]);

  const isProduct = hybridType === "product" ? {display: "inline-block"}: null;

  return (
    <React.Fragment>
    <div className='react_to_print_sales'>
          {transId> 0 && 
          <>

          <div className='print_bttn_container'
          style={{
            top: "120px"
          }}>
            <button onClick={() => setSearchQuery("")} type="button">Remove</button>
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
                  -------------------------- {hybridType} --------------------------
                </div>
                <div style={stylesForReceipt.row1.hybridInfo.serviceBckgrnd.div2}>
                {selectedHybrids.map(item => (
                    <div key={item.name} style={{width: "100%"}}>
                    <p style={isProduct}>{isProduct ? item.qty: null}  <span style={{fontSize: ".92rem", fontWeight: 600}}>{item.name}</span></p>
                    <p style={{...isProduct, float: isProduct && "right", textAlign: isProduct && "right"}}>
                      <span style={{fontWeight: 600}}>
                      {hybridType === "service" ? "Price: " : "₱"}</span>  
                      {!isProduct && "₱"}
                      {item.price}
                    </p>
                    </div>
                  ))}
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
                      <td>{`${fName} ${lName}`}</td>
                      <td style={{fontWeight: 600}}>Mode of payment</td>
                      <td>{modeOfPayment}</td>
                    </tr>

                    <tr>
                      <td style={{fontWeight: 600}}>Date</td>
                      <td>{formatDate(transDate)}</td>
                      <td style={{fontWeight: 600}}>Type of payment</td>
                      <td>{typeOfPayment}</td>
                    </tr>

                    <tr>
                      <td style={{fontWeight: 600}}>Time</td>
                      <td>{formatTime(transDate)}</td>
                      <td style={{fontWeight: 600}}>Total</td>
                      <td>{amount}</td>
                    </tr>

                    <tr>
                      <td style={{fontWeight: 600}}>Receipt No</td>
                      <td style={{color: "#0204AB"}}>#{receiptNo}</td>
                      <td style={{fontWeight: 600}}>Amount paid</td>
                      <td>{cash}</td>
                    </tr>

                    <tr>
                      <td style={{fontWeight: 600}}>Trans ID</td>
                      <td style={{color: "#E30403"}}>#{transId}</td>
                      <td style={{fontWeight: 600}}>{typeOfPayment === "split" ? "Balance" : "Change"}</td>
                      <td>{typeOfPayment === "split" ? parseFloat(balance).toFixed(2) : changeAmount}</td> 
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
          
          </>
          }
        </div>
    </React.Fragment>
  )
}

export default SalesRecord;
