import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import config from "./Config.json";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

function SplitPayment() {
    const initialValues = JSON.parse(localStorage.getItem('transId'));
    const [cashValue, setCashValue] = useState(false);
    const [modeOfPayment, setModeOfPayment] = useState('Cash');
    const [accNo, setAccNo] = useState('N/A');
    const navigate = useNavigate();
    const [customer, setCustomer] = useState([]);
    const [receiptNo, setReceiptNo] = useState('');
    const [balance, setChange] = useState();
    const [splitId, setSplitId] = useState('');
    const componentRef = React.createRef();
    const userTypeJSON = JSON.parse(localStorage.getItem("currentUserType"))
    const userType = userTypeJSON.userType;
    const [transFieldInfo, setTransFieldInfo] = useState({
      selectingModeOfPayment: false,
      selectingPlatform: false,
    });

    const [fieldInfo, setFieldInfo] = useState({
      searchQuery: "",
      currentIdToUpdate: 0,
      message: "",
      warn: "",
      isSuccessful: "",
      loading: false,
      fetchingData: false
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
    }) 

    const handlePurchase = async (e) => {
    const money = parseFloat(cashValue).toFixed(2);
    if (e && e.key === 'Enter') e.preventDefault();
    switch (true) {
      case accNo.toString().length <= 0:
        setFieldInfo((prev) => ({...prev, warn: "Account number required!"}));
        break;
    
      case !cashValue:
        setFieldInfo((prev) => ({...prev, message: "Please insert cash amount."}));
        break;
    
      case receiptNo.length === 0:
        setFieldInfo((prev) => ({...prev, warn: "Please enter receipt number!"}));
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
              accNo: accNo
            });

          const { success, id, message } = response.data;
          setSplitId(id)
          if (success) {
            localStorage.setItem('transId', JSON.stringify(
              {
              id: initialValues.id, 
              balance: balance, 
              customerId: initialValues.customerId, 
              items: initialValues.items
            }));
            setFieldInfo((prev) => ({
              ...prev,
              isSuccessful: message
            }));
            setTimeout(() => {
              navigate("/Transactions");
            }, 3000);
          } else {
            setFieldInfo((prev) => ({
              ...prev,
              warn: message
            }))
          }
        } catch (error) {
          console.error(error);
          setFieldInfo((prev) => ({
            ...prev,
            warn: error.response.data.message
          }))
        } finally {
          setFieldInfo((prev) => ({...prev, loading: false}));
        }
        break;
    }   
    };  
    
    useEffect(() => {
      getClient();
    }, [])

    const getClient = async () => {
      try {
        setFieldInfo((prev) => ({...prev, loading: true}));
        const response = await axios.get(`${config.Configuration.database}/customerId`, {
          params: { id: initialValues.customerId }
        });
        if (response.data.result) {
          setCustomer(response.data.result[0]);
        }
      } catch(error) {
        console.error(error);
        setFieldInfo((prev) => ({...prev, warn: error.response.data.message}));
      } finally {
        setFieldInfo((prev) => ({...prev, loading: false}));
      }
    };   

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
        </React.Fragment>
    );
    } else {
      return (<div>
        You don't have acces to this page.
      </div>);
    }
}

export default SplitPayment;