import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactToPrint from 'react-to-print';
import config from "./Config.json";

function Purchase() {
  const currentSelectedHybrid__ = localStorage.getItem("currentSelectedHybrid__");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const customerJSON = JSON.parse(localStorage.getItem('selectedCustomer')) || {id: 0};
  const customer = customerJSON.id > 0 ?
  [JSON.parse(localStorage.getItem('selectedCustomer'))] : [{
    id: 0,
    fName: '',
    lName: '',
    mName: '',
    email: '',
    contactNo: '',
    address: ''
  }]
  const [searchQuery, setSearchQuery] = useState('');
  const [newServicePrice, setNewServicePrice] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [change, setChange] = useState();
  const [checkChange, setCheckChange] = useState(false);
  const [checkCustomer, setCheckCustomer] = useState(false);
  const [cashValue, setCashValue] = useState();
  const [transId, setTransId] = useState();
  const [accNo, setAccNo] = useState('N/A');
  const [platform, setPlatform] = useState('Onsite');
  const [receiptNo, setReceiptNo] = useState('');
  const [checkReceiptNo, setCheckReceiptNo] = useState({
    check: false,
    message: ""
  });
  const [checkAccNo, setCheckAccNo] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [modeOfPayment, setModeOfPayment] = useState('Cash');
  const [typeOfPayment, setTypeOfPayment] = useState('straight');
  const componentRef = useRef(null);
  const userType = JSON.parse(localStorage.getItem("currentUserType")) || "none";

  if (!currentSelectedHybrid__) {
    localStorage.setItem("currentSelectedHybrid__", "all");
  }

  useEffect(() => {
    getProducts();
  }, [currentSelectedHybrid__]);
  
  const handleCash = (e) => {
    const { value } = e.target;
    let parsedValue = parseFloat(value) || '';
  
    if (parsedValue <= 0) parsedValue = "";
    if (totalPrice - parsedValue <= 0) setTypeOfPayment('straight');
    
    setCashValue(parsedValue);
  };  

  useEffect(() => {
    if (typeOfPayment === 'straight') {
      setChange(parseFloat(cashValue) >= totalPrice ? (cashValue - totalPrice).toFixed(2) : "-");
    } else {
      setChange(Math.abs(cashValue - totalPrice));
    }
  }, [cashValue, totalPrice, typeOfPayment])

  const addDisplayPurchase = (product) => {
    const selectedProductsCount = selectedProduct.length;
    const productsToApplyClass = selectedProduct.slice(0, selectedProductsCount);
    
    productsToApplyClass.forEach((product) => {
      const productId = document.getElementById(`productId-${product.id}`);
      const expand = document.getElementById(`expand-${product.id}`);
      if (productId) {
        productId.classList.add("select-another");
      }
      if (expand && product.hybrid === "product") {
        expand.classList.remove("expand-bttn")
      }
    });
    
    const isProductSelected = selectedProduct.some((selected) => selected.id === product.id);
    const productId = document.getElementById(`productId-${product.id}`);
    const expand = document.getElementById(`expand-${product.id}`);
    if (!isProductSelected && product.quantity > 0) {
      setSelectedProduct([...selectedProduct, { ...product, amount: 1 }]);
      setTimeout(() => {
        if (selectedProduct.length > 0) {
          const newlyAddedProduct = selectedProduct[selectedProduct.length - 1];
          productScrollTo(newlyAddedProduct);
        }
      }, 10);
    } else if (product.hybrid === "product") {
      productId.classList.remove('select-another');
      expand.classList.add('expand-bttn');
    }
  };

  const removeSelectedProduct = (id) => {
    setSelectedProduct(selectedProduct.filter((product) => product.id !== id));
  };

  const handleAmount = (action, id) => {
    setSelectedProduct((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === id) {
          if (product.amount <= (0 || "") && action === 'decrement') {
            return {...product, amount: 1}
          }
          return {
            ...product, amount: product.amount + (action === 'increment' && product.amount < product.quantity ? 1 :
              action === 'decrement' && product.amount > 1 ? -1 : 0)
          };
        }
        return product;
      })
    );
  };
  
  const handleAmountChange = (e, id) => {
    const { value } = e.target;
    let parsedValue = parseInt(value);

    if (parsedValue <= 0 || isNaN(parsedValue)) {
      parsedValue = 1;
    } else if (Number.isInteger(parsedValue)) {
      parsedValue = parsedValue.toString();
    }
    
    setSelectedProduct((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === id && parsedValue <= product.quantity) {
          return { ...product, amount: parsedValue };
        } else if (product.id === id && parsedValue >= product.quantity) {
          return { ...product, amount: product.quantity }
        } else {
          return { ...product, amount: ""};
        }
      })
    );
  };  

  const handleAddClass = () => {
    const selectedProductsCount = selectedProduct.length;
    const productsToApplyClass = selectedProduct.slice(0, selectedProductsCount);
    
    productsToApplyClass.forEach((product) => {
      const expand = document.getElementById(`expand-${product.id}`);
      const productId = document.getElementById(`productId-${product.id}`);
      if (productId) {
        productId.classList.add("select-another");
      }
      if (expand) {
        expand.classList.remove("expand-bttn")
      }
    });
  };  

  const handlePurchase = async (e) => {
    if (e && e.key === 'Enter') {
      e.preventDefault();
      return;
    }

    if (parseFloat(change) >= 0 && receiptNo > 0 && accNo.toString().length > 0 && customer[0].id > 0) {
      setCheckChange(false);
      setCheckReceiptNo((rec) => ({...rec, check: false}));
      setCheckAccNo(false);
      setCheckCustomer(false);
    } else if (accNo.toString().length <= 0) {
      setCheckAccNo(true);
    } else if (receiptNo.length === 0) {
      setCheckReceiptNo((rec) => ({...rec, check: true}));
    } else if (change < 0 || change === "-") {
      setCheckChange(true);
    } else if (customer.length > 0) {
      setCheckCustomer(true);
    }

if ((parseFloat(change) >= 0 && receiptNo > 0 && accNo.toString().length > 0 && customer[0].id > 0)) {
  try {
    const response = await axios.post(`${config.Configuration.database}/transactions`, {
      items: selectedProduct.reduce((sum, product) => sum + product.amount, 0),
      amount: totalPrice,
      money: cashValue,
      change: change,
      customerId: customer[0].id,
      receiptNo: receiptNo,
      modeOfPayment: modeOfPayment,
      accNo: accNo,
      typeOfPayment: typeOfPayment,
      platform: platform,
    });
    const { success, id, message } = response.data;
    
    if (success) {
      setTransId(id);
      handleTransaction(id);
    } else {
      console.error("Transaction error");
      alert(message + ". Please insert unique numbers.")
    }
  } catch (error) {
    console.error(error);
  }
}
  };   

  const handleTransaction = async (transId) => {
    const promises = selectedProduct.map((prod) => {
      return axios.put(`${config.Configuration.database}/purchase`, {
        id: prod.id,
        name: prod.name,
        description: prod.description,
        price: (prod.price * (prod.amount <= 0 ? 1: prod.amount)).toFixed(2),
        quantity: prod.amount,
        transId: transId
      });
    });

    try {
      await Promise.all(promises);
      handleReceipt();
    } catch (error) {
      console.error(error);
    }
  };  
  
  const handleReceipt = () => {
    const showReceipt = document.getElementById("receipt");
    showReceipt.classList.add("show-receipt");
    if (showReceipt.classList.contains("show-receipt")) {
      alert("Payment Successful!")
    }
  }

  const handleRemoveReceipt = () => {
    const removeReceipt = document.getElementById("receipt");
    removeReceipt.classList.remove("show-receipt");
    setSelectedProduct([]);
    setCashValue();
    setChange();
    setReceiptNo('');
    setAccNo('N/A');
    setModeOfPayment('Cash');
    setTypeOfPayment('straight')
  }

  const productScrollTo = (prod) => {
    const productIdDiv = document.getElementById(`productId-${prod.id}`);
    if (productIdDiv) {
      productIdDiv.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  const getProducts = async () => {
    try {
      const response = await axios.get(`${config.Configuration.database}/product`, {
        params: {
          hybrid: currentSelectedHybrid__ === "all" ? null : currentSelectedHybrid__
        }
      });
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error(error);
    }
  };  

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) => {
        const nameIncludesQuery = product.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
        const priceIncludesQuery = product.price.toString().includes(searchQuery);
        
        return nameIncludesQuery || priceIncludesQuery;
      });
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);
  

  useEffect(() => {
    const totalPrice = selectedProduct.reduce((total, prod) => {
      const matchingService = newServicePrice.find(prevPrice => prevPrice.id === prod.id);
      const productPrice = matchingService ? matchingService.price : prod.price;
  
      total += productPrice * (prod.amount === 0 ? 1 : prod.amount);
      return total;
    }, 0);
  
    setTotalPrice(totalPrice.toFixed(2));
  }, [selectedProduct, newServicePrice]);
   

  function getDate() {
    const currentDate = new Date();
    return currentDate.toLocaleString();
  }

  const removeClassList = (id, isService) => {
    let productId = document.getElementById(`productId-${id}`);
    let expand = document.getElementById(`expand-${id}`);
    productId.classList.add('select-another');
    if (expand && isService === "product") {
      expand.classList.remove("expand-bttn")
    }
  }

  const addClassList = (id, isService) => {
    let productId = document.getElementById(`productId-${id}`)
    let expand = document.getElementById(`expand-${id}`)
    productId.classList.remove('select-another');
    if (expand && isService === "product") {
      expand.classList.add("expand-bttn")
    }
  }

  const handleReceiptNo = (e) => {
    setReceiptNo(e.target.value)
  }

  const handleAccNo = (e) => {
    setAccNo(e.target.value);
  }

  const handlePaymentMethod = (option) => {
    const showPaymentMethod = document.getElementById("payment-method");
    
    if (option === "cancel" && showPaymentMethod) {
      showPaymentMethod.classList.remove("proceed-payment");
    } else if (option === "pay" && showPaymentMethod) {
      showPaymentMethod.classList.add("proceed-payment");
    }
  };  

  const handleChoosePaymentMode = () => {
    const show = document.getElementById("show-mode-of-payment")
    if (show) {
      show.classList.toggle("show-mode-of-payment")
    }
  }

  const handleChoosePaymentType = () => {
    const show = document.getElementById("show-type-of-payment")
    if (show) {
      show.classList.toggle("show-mode-of-payment")
    }
  }

  useEffect(() => {
    let timeoutId;
  
    if (checkChange || checkCustomer || checkAccNo || checkReceiptNo) {
      timeoutId = setTimeout(() => {
        setCheckChange(false);
        setCheckCustomer(false);
        setCheckAccNo(false);
        setCheckReceiptNo((rec) => ({...rec, check: false}));
      }, 1500);
    }
  
    return () => {
      clearTimeout(timeoutId);
    };
  }, [customer, modeOfPayment, checkChange, checkCustomer, checkAccNo, checkReceiptNo]);
  
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

  const handleTypeOfPayment = (type) => {
    setTypeOfPayment(type);
    setCashValue("");
  
    const showMode = document.getElementById("show-type-of-payment")
    if (showMode) {
      showMode.classList.remove("show-mode-of-payment")
    }
  }

  const handleplatform = (plat) => {
    setPlatform(plat);
    const showMode = document.getElementById("show-platform")
    if (showMode) {
      showMode.classList.remove("show-mode-of-payment")
    }
  }

  const handleChoosePlatform = () => {
    const show = document.getElementById("show-platform")
    if (show) {
      show.classList.toggle("show-mode-of-payment")
    }
  }

  useEffect(() => {
    function handleOnlineStatus() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  });

  const formatDate = (dateString) => {
    const options = { month: '2-digit', day: '2-digit', year: '2-digit', hour: 'numeric', minute: 'numeric' };
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', options).replace(',', ' -');
    return formattedDate;
  };

  const handleHybridSelection = (name) => {
    localStorage.setItem("currentSelectedHybrid__", name);
  }

  const handleServicePriceChange = (e, serviceId) => {
    const newPrice = e.target.value;
    const existingService = newServicePrice.find(prev => prev.id === serviceId);
  
    if (!existingService) {
      setNewServicePrice(prev => ([
        ...prev,
        { id: serviceId, price: newPrice }
      ]));
    } else {
      setNewServicePrice(prev => (
        prev.map(item =>
          item.id === serviceId ? { ...item, price: newPrice } : item
        )
      ));
    }
  };

  if (userType.userType !== undefined) {
  return (
    <div>
      <div className='purchase-product-container'>
        <div id='receipt' className='receipt-container'>
        <div ref={componentRef} className='receipt-closed'
        style={{
        margin: "30px auto",
        padding: "20px",
        width: '600px',
        height: "auto",
        padding: "10px",
        backgroundColor: "#eeeeee",
        color: "#1a1a1a",
        position: "relative"
        }}>
        <h1 style={{
           color: '#1a1a1a',
           fontSize: "1.9rem",
           fontFamily: "'Raleway', sans-serif",
           fontWeight: 600,
           marginBottom: "10px",
           textAlign: "center"
        }}>Receipt</h1>
        <div>
        {
          customer.map(cust => (
            cust ? (
              <div className='client-info' key={cust.id}>
                <p style={{marginBottom: "5px"}} className='date'>Client: {cust.fName} {cust.lName}</p>
              </div>
            ) : null
          ))
        }
        <p style={{marginBottom: "5px"}} className='date'>Receipt No#: {receiptNo}</p>
        <p style={{marginBottom: "5px"}} className='date'>Date: {formatDate(getDate())}</p>
        <p style={{marginBottom: "5px"}} className='date'>Trans No#: {transId}</p>
        </div>
          <table>
          <thead
          style={{
            backgroundColor: "#cecece",
            color: "#1a1a1a"
          }}>
          <tr>
            <th style={{padding: "5px 10px"}}>QTY</th>
            <th style={{padding: "5px 10px"}}>Product</th>
            <th style={{padding: "5px 10px"}}>Price</th>
            <th style={{padding: "5px 10px"}}>Amount</th>
          </tr>
          </thead>     
        {selectedProduct.map((prod) => (
                <tbody key={prod.id} 
                style={{
                  backgroundColor: "#d6d6d6",
                  color: "#1a1a1a"
                }}>
                  <tr>
                    <td style={{padding: "5px 10px"}}>{prod.amount}</td>
                    <td style={{padding: "5px 10px"}}>
                      <span style={{fontWeight: "600"}}>{prod.name}</span> - {prod.description.slice(0, 30)}...
                    </td>
                    <td style={{padding: "5px 10px"}}>₱{prod.price}</td>
                    <td style={{padding: "5px 10px"}}>₱{(prod.price * prod.amount).toFixed(2)}</td>
                  </tr>
                </tbody>
          ))}
          </table>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "end",
            width: "100%",
            marginTop: "10px"
          }} className='show-payment' >
          <p className='total-'>Total: <span>₱{totalPrice}</span></p>
          <p>Cash: <span>₱{cashValue}</span></p>
          <p className='change-'>{typeOfPayment === "split" ? "Balance:" : "Change:"} <span>₱{change}</span></p>
          
          </div>
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
      
      <section className='display-product-section'>
      {selectedProduct.length > 0 && 
      <div id='payment-method' className='purchasing-product-wrapper'>
              <h1>Payment Method</h1>
              <table className='payment'>
                <thead>
                  <tr>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>

                    <tr>
                    <td>Type of Payment</td>
                    <td>
                      {typeOfPayment.charAt(0).toUpperCase() + typeOfPayment.slice(1)}
                    <button 
                    type="button"
                    className='drop-down'
                    onClick={() => handleChoosePaymentType()}>
                      <i className='bx bxs-down-arrow'></i>
                    </button>
                    <div id='show-type-of-payment' className='change-mode-of-payment'>
                    <div className='payment-button payment-cash'
                    onClick={() => handleTypeOfPayment("straight")}>
                    Straight
                    </div>
                    <div className='payment-button payment-credit-card'
                    onClick={() => handleTypeOfPayment("split")}>
                    Split
                    </div>
                    </div>
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
                      onClick={() => handleAddClass()} 
                      /> 
                    </td>
                  </tr>

                  <tr>
                    <td>Total</td>
                    <td>₱ {totalPrice}</td>
                  </tr>

                  <tr>
                    <td>{typeOfPayment === 'split' ? "Balance" : "Change"}</td>
                    <td>₱ {change}</td>
                  </tr>

                  <tr>
                    <td>Receipt No#</td>
                    <td><input
                    type="text"
                    name="receipt-no"
                    value={receiptNo}
                    placeholder='###'
                    onClick={() => handleAddClass()}
                    onChange={(e) => handleReceiptNo(e)}
                  /></td>
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
                  onClick={() => handleAddClass()}
                  onChange={(e) => handleAccNo(e)}
                  />
                    </td>
                  </tr>

                  <tr>
                    <td>Platform</td>
                    <td>
                      {platform === "" ? "select" : platform}
                    <button 
                    type="button"
                    className='drop-down'
                    onClick={() => handleChoosePlatform()}>
                      <i className='bx bxs-down-arrow'></i>
                    </button>
                    
                    <div id='show-platform' className='change-mode-of-payment'>
                    <div className='payment-button payment-cash'
                    onClick={() => handleplatform("Online")}>
                    Online
                    </div>
                    <div className='payment-button payment-cash'
                    onClick={() => handleplatform("Onsite")}>
                    Onsite
                    </div>
                    </div>

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
          </div>}
          <div className='search-form'>
              <input
                className='search-bar'
                type='text'
                name='search-bar'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search...'
              />
              <i className='bx bx-search search-icon' ></i>
          </div>
          
          <ul id='hybrid_selection'>
          <li className={currentSelectedHybrid__ === "all" ? "selectedHybrid" : ""} data-hybrid="all" onClick={(e) => handleHybridSelection(e.currentTarget.dataset.hybrid)}>All</li>
          <li className={currentSelectedHybrid__ === "service" ? "selectedHybrid" : ""} data-hybrid="service" onClick={(e) => handleHybridSelection(e.currentTarget.dataset.hybrid)}>Services</li>
          <li className={currentSelectedHybrid__ === "product" ? "selectedHybrid" : ""} data-hybrid="product" onClick={(e) => handleHybridSelection(e.currentTarget.dataset.hybrid)}>Products</li>
          <div
          style={{
            position: "absolute",
            bottom: "-10px",
            left: currentSelectedHybrid__ === "all" ? "35px" : currentSelectedHybrid__ === "service" ? "145px" : "255px"
          }}
            className='hybrid_selection_bar'
          ></div>
          </ul>

          <div className='overflow-product-description'>
          {filteredProducts.length === 0 && <p className='not-found'>None</p>}
          {filteredProducts
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((product) => {

            return (
              <div
              key={product.id}
              className={`product-info`}
              onClick={() => {
                addDisplayPurchase(product);
                productScrollTo(product);
              }}
            >
              {filterHybrid(isOnline, product)}
            </div>
            )
            
           })}
          </div>
      </section>

        {checkChange && <p className='check-change'>Please insert right amount</p>}
        {checkCustomer && <p className='check-change'>Please select client</p>}
        {checkAccNo && <p className='check-change'>Please enter account number</p>}
        {checkReceiptNo.check && <p className='check-change'>Please enter receipt number</p>}

        {/* purchase--> */}
        <section className='purchase-product-section'>
          <h2 className='purchase-label'>Customize</h2>
          <div id='client-to-fill'>
          <div className='selected-client'>
            <Link className='link' to='/Customer'>
              <div className='select-client-bttn'>
                <p>Select</p>
                <i className='bx bxs-user-detail'></i>
              </div>
            </Link>
            {
              customer.map(cust => (
                cust ? (
                  <div key={cust.id}>
                    <div>Client ID: <span>{cust.id > 0 ? cust.id : ''}</span></div>
                    <div>Client Name: <span>{cust.fName + " " + cust.lName}</span></div>
                  </div>
                ) : null
              ))
            }
          </div>
          </div>
          <div className='display-purchase'>
            {selectedProduct.length === 0 ? (
              <p className='not-found'>Empty</p>
            ) : (
              selectedProduct
                .map((product) => {
                  return (
                  <div id={`productId-${product.id}`} className={`unselect selected ${
                    product.hybrid === "service" ? "select-another" : ''
                  }`} key={product.id}>
                    
                    {isOnline ? (
                      <>
                        {product.imageHover ? (
                          <>
                            <img src={product.imageHover} alt={product.name} />
                            <div className='shadow' style={{ background: "linear-gradient(90deg, #0f0f0f, #2c2c2c00)" }}>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className='no-image-selected'></div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div className='no-image-selected'><i className='bx bxs-layer'></i></div>
                      </>
                    )}
                    <button
                      title='Cancel'
                      className='remove-selected-product'
                      onClick={() => removeSelectedProduct(product.id)}
                    >
                      <i className='bx bx-x'></i>
                    </button>
                    <button
                      title='Minimize'
                      className='edit-selected-product'
                      onClick={() => removeClassList(product.id, product.hybrid)}
                    >
                      <i className='bx bx-collapse' ></i>
                    </button>
                    <button
                      title='Expand'
                      id={`expand-${product.id}`}
                      className='edit-selected-product expand-bttn'
                      onClick={() => addClassList(product.id, product.hybrid)}
                    >
                      <i className='bx bx-expand' ></i>
                    </button>
                    <p className='product-name'>{product.name}</p>
                    {product.hybrid === "product" ? (
                      <>
                      <div className='product-price'>₱{(product.price * (product.amount <= 0 ? 1: product.amount)).toFixed(2)}</div>
                      <div className='product-quantity'>Available quantity: 
                      <span>{product.quantity}</span>
                      </div>
                      <div className='quantity-button'>
                      <div className='manage-quantity'>
                        <div className='select-amnt'>
                          Select quantity: 
                        </div>
                        <button
                          type='button'
                          onClick={() => handleAmount('increment', product.id)}
                          className='action-amount-bttn increment'
                        >
                          <i className='bx bx-layer-plus' ></i>
                        </button>

                        <input
                          type="number"
                          name="input-amount"
                          placeholder='1'
                          value={product.amount}
                          onChange={(e) => handleAmountChange(e, product.id)}
                          className='input-amount'
                        />
                        <label title='change quantity?' htmlFor="input-amount" onClick={() => removeClassList(product.id)}>qty</label> 
                        <button
                          type='button'
                          onClick={() => handleAmount('decrement', product.id)}
                          className='action-amount-bttn decrement'
                        >
                          <i className='bx bx-layer-minus' ></i>
                        </button>
                      </div>
                    </div>
                      </>
                    ) : (
                      <>
                      <input
                        className='product-price'
                        placeholder='---'
                        value={
                          newServicePrice.some(service => service.id === product.id)
                            ? newServicePrice.find(service => service.id === product.id).price
                            : product.price
                        }
                        onChange={(e) => handleServicePriceChange(e, product.id)}
                      />
                     </>
                    )}
                  </div>)
              })
            )}
            
          </div>
          <button 
            type="button"
            className='proceed-payment-bttn'
            onClick={() => handlePaymentMethod("pay")}>
              Proceed to payment
          </button>
        </section>
        {/* <--purchase */}
      </div>
    </div>
  );
  } else {
    return (<div>
      Log in to access the page
    </div>);
  }
}

const filterHybrid = (isOnline, product) => {
      return (
        <>
          {isOnline ? (
            <>
              {product.image && product.imageHover ? (
                <>
                  <div className="img-hover" style={{ backgroundImage: `url(${product.imageHover})` }}></div>
                  <img src={`${product.image}`} alt="none" className='image' />
                </>
              ) : (
                <>
                  <div className='no-img-hover'></div>
                  <div className='no-image'><i className='bx bxs-layer'></i></div>
                </>
              )}
            </>
          ) : (
            <>
              <div className='no-image-selected'><i className='bx bxs-layer'></i></div>
            </>
          )}
          
          <div className='text-container'>
          <p className='product-name-text'>{product.name}</p>
          <div className='product-price-text'>₱{product.price}</div>
          <p className='product-description-text'>{product.description}</p>
          {product.hybrid === "product" ? (
            <span className='product-quantity-text'>{product.quantity} qty</span>
          ): null}
          </div>
          </>
        )
}


export default Purchase;
