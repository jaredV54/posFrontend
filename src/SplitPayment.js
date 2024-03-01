import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import config from "./Config.json";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import ReactToPrint from 'react-to-print';
import decryptedUserDataFunc from './decrypt';
import CryptoJS from 'crypto-js';
import OPIImage from './OIP.jpg';

function SplitPayment() {
    const [cashValue, setCashValue] = useState(false);
    const [modeOfPayment, setModeOfPayment] = useState('Cash');
    const [accNo, setAccNo] = useState('N/A');
    const navigate = useNavigate();
    const [customer, setCustomer] = useState({
      fName: "",
      lName: ""
    });
    const [receiptNo, setReceiptNo] = useState('');
    const [balance, setChange] = useState();
    const [transFieldInfo, setTransFieldInfo] = useState({
      selectingModeOfPayment: false,
      selectingPlatform: false,
    });

    const [fieldInfo, setFieldInfo] = useState({
      currentIdToUpdate: 0,
      message: "",
      warn: "",
      isSuccessful: "",
      loading: false,
      fetchingData: false
    })
    const [decryptedUserData, setDecryptUserData] = useState({});
    const [initialValues, setInitialValues] = useState({});
    const userType = decryptedUserData.userType;
    const clientId = initialValues.customerId;
    const placeId = decryptedUserData.storeId;
    useEffect(() => {
      const userData = localStorage.getItem('encryptedData');
      const splitData = localStorage.getItem('TID');
    
      if (userData) {
        const decryptionKey = 'NxPPaUqg9d';
        const decrypted = JSON.parse(decryptedUserDataFunc(userData, decryptionKey));
        setDecryptUserData(decrypted);
      }

      if (splitData) {
        const decryptionKey = 'Dr988U3DDD';
        const decrypted = JSON.parse(decryptedUserDataFunc(splitData, decryptionKey));
        setInitialValues(decrypted)
      }
    }, []);  

    const [receiptContainer, setReceiptContainer] = useState ({
      splitId: 0,
      container: {}
    })

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
  
    useEffect(() => {
      window.onpopstate = (event) => {
        const shouldNavigate = window.location.search.includes('refresh=true');
  
        if (shouldNavigate) {
          navigate('/Transactions');
        }
      };
    }, []);

    useEffect(() => {
    if (initialValues.balance - cashValue < 0) {
    setChange('0.00');
    } else {
    setChange((initialValues.balance - cashValue).toFixed(2));
    }
    }, [cashValue]) 

    
    const handleSaveSplitTrans = (data) => {
      const splitData = JSON.stringify(data);
      const encryptionKey = 'Dr988U3DDD';
      
      const encrypted = CryptoJS.AES.encrypt(splitData, encryptionKey).toString();
      localStorage.setItem('TID', encrypted);
    }
    

    const handlePurchase = async (e) => {
    const money = parseFloat(cashValue).toFixed(2);
    if (e && e.key === 'Enter') e.preventDefault();
    switch (true) {
      case accNo.toString().length <= 0:
        setFieldInfo((prev) => ({...prev, message: "Account number required!"}));
        break;
    
      case !cashValue:
        setFieldInfo((prev) => ({...prev, message: "Please insert cash amount."}));
        break;
    
      case receiptNo.length === 0:
        setFieldInfo((prev) => ({...prev, message: "Please enter receipt number!"}));
        break;
    
      default:
        
        try {
          setFieldInfo((prev) => ({...prev, loading: true}));
          const response = await axios.post(`${config.Configuration.database}/splitPayment`, {
              transId: initialValues.id,
              items: initialValues.items,
              amount: initialValues.balance,
              money: money,
              balance: balance,
              receiptNo: receiptNo,
              customerId: initialValues.customerId,
              modeOfPayment: modeOfPayment,
              accNo: accNo,
              placeId: placeId
            });

          const { success, id, message } = response.data;
          if (success) {
            handleSaveSplitTrans({
              id: initialValues.id, 
              balance: balance, 
              customerId: initialValues.customerId, 
              items: initialValues.items
            })
            setReceiptContainer(prev => ({
              ...prev, 
              splitId: id,
              client: `${customer.fName} ${customer.lName}`
            }));
            setFieldInfo((prev) => ({
              ...prev,
              isSuccessful: message
            }));
          } else {
            setFieldInfo((prev) => ({
              ...prev,
              warn: message
            }))
          }
        } catch (error) {
          if (error.response) {
            setFieldInfo(prev => ({...prev, warn: error.response.data.message}));
            console.log(error.response.data.message)
          } else if (error.request) {
            setFieldInfo(prev => ({...prev, warn: "Network issue. Please try again later."}));
          } else {
            setFieldInfo(prev => ({...prev, warn: error.message}));
          }
        } finally {
          setFieldInfo((prev) => ({...prev, loading: false}));
        }
        break;
    }   
    };  

    const getClient = async () => {
      try {
        console.log(clientId)
        setFieldInfo((prev) => ({...prev, loading: true}));
        const response = await axios.get(`${config.Configuration.database}/customerId`, {
          params: { id: clientId }
        });
        if (response.data.isSuccessful) {
          setCustomer(response.data.result[0]);
        } 
      } catch(error) {
        if (error.response) {
          setFieldInfo(prev => ({...prev, warn: error.response.data.message}));
        } else if (error.request) {
          setFieldInfo(prev => ({...prev, warn: "Network issue. Please try again later."}));
        } else {
          setFieldInfo(prev => ({...prev, warn: error.message}));
        }
      } finally {
        setFieldInfo((prev) => ({...prev, loading: false}));
      }
    };   

    useEffect(() => {
      getClient();
    }, [clientId])

    const handleAccNo = (e) => {
        setAccNo(e.target.value);
    }

    const handleReceiptNo = (e) => {
      setReceiptNo(e.target.value)
    }

    const handleCash = (e) => {
      const { value } = e.target;
      let parsedValue = parseFloat(value) || '';
      if (parsedValue <= 0 || isNaN(parsedValue)) {
        parsedValue = '';
      } else if (Number.isInteger(parsedValue)) {
        parsedValue = parsedValue.toString();
      } else {
        parsedValue = parsedValue.toFixed(2); 
      }
      if (initialValues.balance - value < 0) {
        setCashValue(initialValues.balance);
      } else {
        setCashValue(parsedValue);
      }
    };

    const handlePaymentMethod = (option) => {
      const showPaymentMethod = document.getElementById("payment-method");
      
      if (option === "cancel" && showPaymentMethod) {
        showPaymentMethod.classList.remove("proceed-payment");
      } else if (option === "pay" && showPaymentMethod) {
        showPaymentMethod.classList.add("proceed-payment");
      }
      navigate("/Transactions")
    };  

    const handleToggleModeOfpayment = () => {
      const element = document.querySelector('.mode_of_pay_bttn_selection_hidden');
      if (element) {
        element.classList.toggle('mode_of_pay_bttn_selection_show');
        setTransFieldInfo((prev) => ({
          ...prev,
          selectingModeOfPayment: !prev.selectingModeOfPayment
        }))
      }
    }

    const changeModeOfPayment = (mode) => {
      setModeOfPayment(mode);
      setAccNo(mode === "cash" ? "N/A" : "")
      handleToggleModeOfpayment();
    }

    if (userType !== undefined) {
    return (
        <React.Fragment>
          {fieldInfo.fetchingData ? (<span className="loader"></span>) : null}
          <div className="field_message" ref={fieldMessageRef}>
            {fieldInfo.message}
          </div>
          <div className="field_warn" ref={fieldWarnRef}>
            {fieldInfo.warn}
          </div>
          <div className="field_is_successful" ref={fieldIsSuccessfulRef}>
            {fieldInfo.isSuccessful}
          </div>
          <div className="go-back" >
          <Link to="/Transactions"><i className='bx bx-chevron-left' ></i></Link>
          </div>
            
            <div className='split-payment-wrapper'>
            {fieldInfo.loading ? (<span className="loader"></span>) : null}
                <div className='split-payment-container'>
                    <h1>Split Payment</h1>
                    <table className='payment'>
                        <thead>
                        <tr>
                            <th></th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>

                        <tr>
                          <td>Name</td>
                          <td>{customer ? `${customer.fName} ${customer.lName}` : ""}
                          </td>
                        </tr>

                        <tr>
                          <td>Amount</td>
                          <td>
                            <input type="number"
                            name="input-cash"
                            placeholder='₱---'
                            value={cashValue}
                            onChange={(e) => handleCash(e)} 
                            /> 
                          </td>
                        </tr>

                        <tr>
                          <td>Total</td>
                          <td>₱ {initialValues.balance}</td>
                        </tr>

                        <tr>
                            <>
                            <td style={{
                              fontWeight: 500,
                              color: "#ff8502"
                            }}>Balance</td>
                            <td style={{
                              fontWeight: "500",
                              color: "#ff8502"
                            }}>{isNaN(balance) ? `₱ ${initialValues.balance}` : `₱ ${balance}`}</td>
                            </>
                        </tr>

                        <tr>
                          <td>Receipt No#</td>
                          <td><input
                          type="text"
                          name="receipt-no"
                          value={receiptNo}
                          placeholder='###'
                          onChange={(e) => handleReceiptNo(e)}
                        /></td>
                        </tr>

                        <tr>
                          <td>Mode of Payment</td>
                          
                          <td>
                            <button type="button" className='mode_of_pay_bttn' 
                              onClick={(e) => {
                                e.preventDefault(); 
                                handleToggleModeOfpayment();
                              }}
                              style={{
                                backgroundColor: transFieldInfo.selectingModeOfPayment ? "#373737": null,
                              }}>
                              {transFieldInfo.selectingModeOfPayment ? (<i  style={{fontSize: "1.2rem"}} className='bx bx-x'></i>): modeOfPayment}</button>
                            <div className='mode_of_pay_bttn_selection_hidden'>
                              <div
                              onClick={(e) => {
                                e.preventDefault();
                                changeModeOfPayment("cash");
                              }}>
                                Cash
                              </div>
                              <div
                              onClick={(e) => {
                                e.preventDefault();
                                changeModeOfPayment("gcash");
                              }}>
                                Gcash
                              </div>
                              <div
                              onClick={(e) => {
                                e.preventDefault();
                                changeModeOfPayment("credit card");
                              }}>
                                Credit Card
                              </div>
                              <div
                              onClick={(e) => {
                                e.preventDefault();
                                changeModeOfPayment("debit card");
                              }}>
                                Debit Card
                              </div>
                            </div>
                          </td>
                        </tr>

                        <tr>
                        <td>Account No#</td>
                        <td>
                        <input
                        id='input-acc-no'
                        className='cash'
                        type="text"
                        name="acc-no"
                        value={accNo}
                        placeholder='###'
                        onChange={(e) => handleAccNo(e)}
                        />
                          </td>
                        </tr>

                        </tbody>
                    </table>

                    <div className='payment-container'>
                    <form onSubmit={(e) => e.preventDefault()}>
                      <button 
                      className='cancel-payment-bttn'
                      type="button"
                      disabled = {fieldInfo.isSuccessful ? true : false}
                      style={{
                        pointerEvents: fieldInfo.isSuccessful ? "none" : null
                      }}
                      onClick={() => handlePaymentMethod("cancel")}>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className='purchase-bttn'
                        disabled = {fieldInfo.isSuccessful ? true : false}
                        style={{
                          pointerEvents: fieldInfo.isSuccessful ? "none" : null
                        }}
                        onClick={() => handlePurchase()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className='linear-gradient'>
                          <p>Pay</p>
                        </div>
                      </button>
                    </form>
                    </div>
                </div>
            </div>
          <Receipt
          receiptContainer={receiptContainer}
          setReceiptContainer={setReceiptContainer}
          setFieldInfo={setFieldInfo}
          navigate={navigate}
          />
        </React.Fragment>
    );
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
    position: "absolute",
    top: "130px",
    left: "50%",
    transform: "translate(-50%, 0)",
    zIndex: 120,
    backgroundColor: "#fefefe",
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

const Receipt = ({receiptContainer, setReceiptContainer, setFieldInfo, navigate}) => {
  const componentRef = useRef(null);
  const {
    splitId,
    client
  } = receiptContainer;

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
    hybrid
  } = receiptContainer.container

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
    if (splitId) {
      console.log("Okay")
      getReceipt()
    }
  }, [splitId])

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

  if (splitId > 0) {
    return (
      <React.Fragment>
        <div className='react_to_print'>
          <div className='print_bttn_container'
          style={{
            display: "inline-block"
          }}>
            <ReactToPrint
              trigger={() => (
                <button className="print-sales-bttn" >
                  Print Receipt
                </button>
              )}
              content={() => componentRef.current}
              documentTitle="Total Sales"
            />
            <button 
            type="button"
            onClick={() => {
              navigate("/Transactions")
              }}>
              Proceed 
            </button>
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

export default SplitPayment;