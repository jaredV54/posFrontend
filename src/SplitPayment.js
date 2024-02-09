import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import config from "./Config.json";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import ReactToPrint from 'react-to-print';

function SplitPayment() {
    const initialValues = JSON.parse(localStorage.getItem('transId'));
    const [sales, setSales] = useState([]);
    const [cashValue, setCashValue] = useState(false);
    const [modeOfPayment, setModeOfPayment] = useState('Cash');
    const [accNo, setAccNo] = useState('N/A');
    const [checkAccNo, setCheckAccNo] = useState(false);
    const [checkChange, setCheckChange] = useState(false);
    const navigate = useNavigate();
    const [customer, setCustomer] = useState([]);
    const [balance, setChange] = useState();
    const [receiptNo, setReceiptNo] = useState();
    const [splitId, setSplitId] = useState('');
    const componentRef = React.createRef();
    const userTypeJSON = JSON.parse(localStorage.getItem("currentUserType"))
    const userType = userTypeJSON.userType;

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
    }) 

    const handlePurchase = async (e) => {
    const money = parseFloat(cashValue).toFixed(2);
    if (e && e.key === 'Enter') e.preventDefault();
    switch (true) {
      case accNo.toString().length <= 0:
        setCheckAccNo(true);
        break;
    
      case !cashValue:
        setCheckChange(true);
        break;
    
      default:
        setCheckChange(false);
        setCheckAccNo(false);
        try {
          const response = await axios.post(`${config.Configuration.database}/splitPayment`, {
              transId: initialValues.id,
              items: initialValues.items,
              amount: initialValues.balance,
              money: money,
              balance: balance,
              customerId: initialValues.customerId,
              modeOfPayment: modeOfPayment,
              accNo: accNo
            });

          const { success, id, message, receiptNo } = response.data;
          setSplitId(id)
          if (success) {
            setReceiptNo(receiptNo)
            showReceipt();
            localStorage.setItem('transId', JSON.stringify(
              {
              id: initialValues.id, 
              balance: balance, 
              customerId: initialValues.customerId, 
              items: initialValues.items
            }));
            alert("Payment Successful");
          } else {
            alert(message + ". Please insert unique numbers.");
          }
        } catch (error) {
          console.error(error);
        }
        break;
    }   
    };  

    const showReceipt = () => {
      const receipt = document.getElementById("receipt");
      if (receipt) {
        receipt.classList.add("show-receipt")
      }
    }
    
    useEffect(() => {
      getClient();
      getProductsById();
    }, [])

    const getClient = async () => {
      try {
        const response = await axios.get(`${config.Configuration.database}/customerId`, {
          params: { id: initialValues.customerId }
        });
        setCustomer(response.data[0]);
      } catch(error) {
        console.error(error);
      }
    };   

    const getProductsById = async () => {
      try {
        const response = await axios.get(`${config.Configuration.database}/salesRecord`, {
          params: { id: initialValues.id }
        });
        setSales(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    useEffect(() => {
        let timeoutId;
      
        if (checkChange || checkAccNo) {
          timeoutId = setTimeout(() => {
            setCheckChange(false);
            setCheckAccNo(false);
          }, 1500);
        }
      
        return () => {
          clearTimeout(timeoutId);
        };
      }, [modeOfPayment, checkChange, checkAccNo]);    

    const handleAccNo = (e) => {
        setAccNo(e.target.value);
    }

    const handleRemoveReceipt = () => {
      const removeReceipt = document.getElementById("receipt");
      removeReceipt.classList.remove("show-receipt");
      setSales([]);
      setCashValue();
      setChange();
      setAccNo('N/A')
      setReceiptNo();
      setModeOfPayment('Cash')
      navigate("/Transactions");
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
    
      const handleChoosePaymentMode = () => {
        const show = document.getElementById("show-mode-of-payment")
        if (show) {
          show.classList.toggle("show-mode-of-payment")
        }
      }

      const handleModeOfPayment = (mode) => {
        setModeOfPayment(mode);
        const cashMethod = document.getElementById("input-acc-no");
        
        if (mode === "Cash") {
          setAccNo("N/A");
          cashMethod.classList.add("cash");
        } else {
          setAccNo("");
          cashMethod.classList.remove("cash");
        }
        
        const showMode = document.getElementById("show-mode-of-payment")
        if (showMode) {
          showMode.classList.remove("show-mode-of-payment")
        }
      }

      const formatDate = (dateString) => {
        const options = { month: '2-digit', day: '2-digit', year: '2-digit', hour: 'numeric', minute: 'numeric' };
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString('en-US', options).replace(',', ' -');;
        return formattedDate;
      };

      function getDate() {
        const currentDate = new Date();
        return currentDate.toLocaleString();
      }

    if (userType !== undefined) {
    return (
        <React.Fragment>
          <div className="go-back" >
          <Link to="/Transactions"><i className='bx bx-chevron-left' ></i></Link>
          </div>
          
        <div id='receipt' className='split-receipt-container' style={{
          width: "calc(100vw - 220px)",
          height: "100vh",
          position: "absolute",
          zIndex: "120",
          backgroundColor: "#1a1a1a65"
        }}>
              <div className='receipt-table' ref={componentRef} style={{
                backgroundColor: "#e1e1e1",
                width: "530px",
                padding: "10px"
              }}>
              <h1 style={{
                fontWeight: "500",
                textAlign: "center"
              }}>Receipt</h1>
              <p style={{
                paddingTop: "5px"
              }}>Client: {customer.fName} {customer.lName}</p>
              <p>Receipt No#: {receiptNo}</p>
              <p>Date: {formatDate(getDate())}</p>
              <p style={{
                paddingBottom: "5px"
              }}>Split No#: {splitId}</p>
              <p style={{textAlign: "right"}} className='total-'>Total: <span style={{fontWeight: "500"}}>₱{initialValues.balance}</span></p>
              <p style={{textAlign: "right"}} >Cash: <span style={{fontWeight: "500"}}>₱{cashValue}</span></p>
              <p style={{textAlign: "right"}} className='change-'>Balance left: <span style={{fontWeight: "500"}}>₱{balance}</span></p>
          </div>
          <div className='bttn-container'>
          <ReactToPrint
              trigger={() => (
                <button onClick={() => handleRemoveReceipt()}>
                  Print
                </button>
              )}
              content={() => componentRef.current}
              documentTitle="Receipt"
            />
          <button onClick={() => handleRemoveReceipt()}>
            Proceed
          </button>
          </div>
          </div>
            
            <div className='split-payment-wrapper'>
            {checkChange && <p className='check-change'>Please insert amount</p>}
            {checkAccNo && <p className='check-change'>Please enter account number </p>}
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
                            }}>₱ {balance}</td>
                            </>
                        </tr>

                        <tr>
                          <td>Mode of Payment</td>
                          <td>
                            {modeOfPayment ?? modeOfPayment}
                          <button 
                          type="button"
                          className='drop-down'
                          onClick={() => handleChoosePaymentMode()}>
                            <i className='bx bxs-down-arrow'></i>
                          </button>
                          <div id='show-mode-of-payment' className='change-mode-of-payment'>
                          <div className='payment-button payment-cash'
                          onClick={() => handleModeOfPayment("Cash")}>
                          Cash
                          </div>
                          <div className='payment-button payment-credit-card'
                          onClick={() => handleModeOfPayment("Credit Card")}>
                            Credit Card
                          </div>
                          <div className='payment-button payment-debit-card'
                          onClick={() => handleModeOfPayment("Debit Card")}>
                            Debit Card
                          </div>
                          <div className='payment-button payment-gcash'
                          onClick={() => handleModeOfPayment("GCash")}>
                            GCash
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
                      onClick={() => handlePaymentMethod("cancel")}>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className='purchase-bttn'
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
        </React.Fragment>
    );
    } else {
      return (<div>
        You don't have acces to this page.
      </div>);
    }
}

export default SplitPayment;