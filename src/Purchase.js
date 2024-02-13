import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactToPrint from 'react-to-print';
import config from "./Config.json";

const Purchase = () => {
  const [hybrid, setHybrid] = useState({
    receivedData: [],
    selectedHybrid: [],
    selectedHybridType: "",
    currentView: localStorage.getItem("currentSelectedHybrid_"),
  });
  if (!hybrid.currentView) {
    localStorage.setItem("currentSelectedHybrid_", "all")
  }
  const containerRef = useRef(null);
  const userType = JSON.parse(localStorage.getItem("currentUserType")) || "none";
  const clientJSON = JSON.parse(localStorage.getItem('selectedCustomer')) || {id: 0};
  const [receipt, setReceipt] = useState({
    client: clientJSON.id > 0 ?
    [JSON.parse(localStorage.getItem('selectedCustomer'))] : [{
      id: 0,
      fName: '',
      lName: '',
      mName: '',
      email: '',
      contactNo: '',
      address: '',
      remarks: '',
      providers: ''
    }],
    quantity: 1,
    currentPrice: 0,
    totalPrice: 0,
    discount: 0,
    discounted: 0,
    change: 0,
    receiptNo: "",
    professionalFee: 0,
    withProfessionalFee: 0,
    profFeeForDiscount: 0
  })

  const [transaction, setTransaction] = useState({
    modeOfPayment: "cash",
    typeOfPayment: "straight",
    platform: "Onsite",
    accNo: "N/A",
    cash: "",
    opened: false
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
  
  const [psychologicalAssessment, setPsychologicalAssessment] = useState({
    psyTestSelection: [],
    selectedTest: []
  });
  
  const getHybrids = async () => {
    try {
      setFieldInfo((prev) => ({ ...prev, fetchingData: true }));
      const response = await axios.get(`${config.Configuration.database}/product`, {
        params: {
          hybrid: hybrid.currentView === "all" ? null : hybrid.currentView,
        },
      });
      if (response.data.isSuccessful) {
        setHybrid((prev) => ({ ...prev, receivedData: response.data.result }));
      } else {
        setFieldInfo((prev) => ({
          ...prev,
          message: response.data.message
        }))
      }
    } catch (error) {
        setFieldInfo(prev => ({
          ...prev,
          message: error.response.data.message
        }));
    } finally {
      setFieldInfo((prev) => ({ ...prev, fetchingData: false }));
    }
  };

  const handleShowFillTrans = (val) => {
    const showTransactionField = document.getElementById("fill_transaction");
    const togglePaymentBttn = document.getElementById("proceed_to_payment_bttn_toggle");
    if (showTransactionField && togglePaymentBttn && receipt.totalPrice > 0) {
      showTransactionField.classList.toggle("fill_trans_show");
      togglePaymentBttn.classList.toggle("payment_cancel_bttn_show");
      setTransaction((prev) => ({
        ...prev,
        opened: !prev.opened
      }))
    }
    if (!(receipt.totalPrice > 0) && hybrid.selectedHybridType === "service") {
      setFieldInfo((prev) => ({
        ...prev,
        warn: "Please select Psychological Test first."
      }))
    }
  }

  useEffect(() => {
    getHybrids();
  }, [])

  useEffect(() => {
    if (!(hybrid.selectedHybrid.length > 0)) {
      handleShowFillTrans();
    }
  }, [hybrid.selectedHybrid]);
  
  const handleHybridSelection = (current) => {
    localStorage.setItem("currentSelectedHybrid_", current);
    setHybrid((prev) => ({
      ...prev, currentView: current
    }))
  }

  useEffect(() => {
    searchQuery();
  }, [fieldInfo.searchQuery]);
  
  const searchQuery = () => {
    if (fieldInfo.searchQuery.trim() === '') {
      getHybrids();
    } else {
      const trimmedQuery = fieldInfo.searchQuery.trim().toLowerCase();
      const filteredProducts = hybrid.receivedData.filter((product) =>
        product.name.toLowerCase().includes(trimmedQuery)
      );
      setHybrid((prev) => ({
        ...prev,
        receivedData: filteredProducts
      }));
    }
  }

  const handleResetSelectionField = () => {
    if (containerRef.current) {
      containerRef.current.classList.remove("psyc_list_fetched");
    }

    const showTransactionField = document.getElementById("fill_transaction");
    const togglePaymentBttn = document.getElementById("proceed_to_payment_bttn_toggle");

    if (showTransactionField && togglePaymentBttn) {
      showTransactionField.classList.remove("fill_trans_show");
      togglePaymentBttn.classList.remove("payment_cancel_bttn_show");
      setTransaction((prev) => ({
        ...prev,
        opened: !prev.opened
      }))
    }

    setTransaction(prev => ({
      ...prev,
      modeOfPayment: "cash",
      typeOfPayment: "straight",
      platform: "Onsite",
      accNo: "N/A",
      cash: "",
      opened: false
    }))

    setReceipt((prev) => ({
      ...prev,
      quantity: 1,
      totalPrice: 0,
      discount: 0,
      discounted: 0,
      change: 0,
      receiptNo: ""
    }));

    setHybrid((prev) => ({
      ...prev,
      selectedHybrid: [],
      selectedHybridType: ""
    }))

    setPsychologicalAssessment((prev) => ({
      ...prev,
      psyTestSelection: [],
      selectedTest: []
    }))
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
  
  if (userType.userType !== undefined) {
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

      <main id='purchase_container' className='purchase_container_class'>
      {fieldInfo.loading ? (<span className="loader"></span>) : null}
        <section id='hybrid_info'>
          <SelectPsychologicalTest
          psyc={psychologicalAssessment}
          setPsyc = {setPsychologicalAssessment}
          containerRef={containerRef} 
          setReceipt={setReceipt}
          hybrid={hybrid}
          />
          <FillTransaction
          receipt={receipt}
          setReceipt={setReceipt}
          transaction={transaction}
          setTransaction={setTransaction}
          setFieldInfo={setFieldInfo}
          hybrid={hybrid}
          handleResetSelectionField={handleResetSelectionField}
          />
        <div className='search_bar_container'>
          <input 
          type="text"
          name="searchQuery"
          className='search_bar'
          value={fieldInfo.searchQuery}
          placeholder='Search...'
          onChange={(e) => {
            e.preventDefault();
            setFieldInfo((prev) => ({
              ...prev, searchQuery: e.target.value
            }))
          }}
          />
          <i className='bx bx-search search-icon' ></i>
        </div>
          <DisplayHybrids 
          hybrid = {hybrid} 
          setHybrid = {setHybrid} 
          handleHybridSelection = {handleHybridSelection}
          fieldInfo = {fieldInfo}
          setFieldInfo = {setFieldInfo}
          setPsyc={setPsychologicalAssessment}
          loading={fieldInfo.fetchingData}
          setReceipt={setReceipt}
          />
        </section>
        <section id='hybrid_purchase'>
          <SelectedHybrid
          handleResetSelectionField={handleResetSelectionField}
          selectedHybrid = {hybrid.selectedHybrid}
          hyrbidType={hybrid.selectedHybridType}
          setHybrid={setHybrid}
          client={receipt.client[0]} 
          receipt={receipt}
          setReceipt={setReceipt}
          psyc={psychologicalAssessment}
          setPsyc = {setPsychologicalAssessment}
          setFieldInfo={setFieldInfo}
          handleShowFillTrans={handleShowFillTrans}
          transaction={transaction}
          selectedHybridType={hybrid.selectedHybridType}
          />
        </section>
      </main>

      <Receipt 
      hybrid={hybrid}
      />
    </React.Fragment>
  ) 
  } else {
    return (<div
    style={{
      color: "#f7860e"
    }}>
      Log in to access the page
    </div>);
  }
}

const DisplayHybrids = ({
  hybrid, setHybrid,
  handleHybridSelection,
  setFieldInfo,
  setPsyc, loading,
  setReceipt
}) => {

  const selectedHybrid = (hyb) => {
    const fieldAlreadyExist = hybrid.selectedHybrid.find((list) => list.id === hyb.id);
    if (!fieldAlreadyExist && (hyb.hybrid === hybrid.selectedHybridType || !hybrid.selectedHybridType)) {
      if (hybrid.selectedHybridType !== "service") {
        setHybrid((prev) => ({
          ...prev,
          selectedHybrid: [{...hyb, newPrice: hyb.price, prodQuantity: 1}, ...prev.selectedHybrid],
          selectedHybridType: hyb.hybrid
        }))
      } else {
        setHybrid((prev) => ({
          ...prev,
          selectedHybrid: [hyb],
          selectedHybridType: hyb.hybrid
        }))
        setPsyc((prev) => ({
          ...prev,
          selectedTest: []
        }))
        setReceipt((prev) => ({
          ...prev,
          discount: 0,
          discounted: 0,
          professionalFee: 0,
          withProfessionalFee: 0,
          profFeeForDiscount: 0
        }))
      }
    } else if (fieldAlreadyExist) {
      setFieldInfo((info) => ({
        ...info,
        message: "You've already selected this item."
      }))
    } else {
      setFieldInfo((info) => ({
        ...info,
        warn: `The current selected type is ${hybrid.selectedHybridType}.`
      }))
    }
  }
  return (<React.Fragment>
    <ul id='hybrid_selection'>
    <li className={hybrid.currentView === "all" ? "selectedHybrid" : ""} data-hybrid="all" onClick={(e) => handleHybridSelection(e.currentTarget.dataset.hybrid)}>All</li>
    <li className={hybrid.currentView === "service" ? "selectedHybrid" : ""} data-hybrid="service" onClick={(e) => handleHybridSelection(e.currentTarget.dataset.hybrid)}>Services</li>
    <li className={hybrid.currentView === "product" ? "selectedHybrid" : ""} data-hybrid="product" onClick={(e) => handleHybridSelection(e.currentTarget.dataset.hybrid)}>Products</li>
    <div
    style={{
      position: "absolute",
      bottom: "-10px",
      left: hybrid.currentView === "all" ? "35px" : hybrid.currentView === "service" ? "145px" : "255px"
    }}
      className='hybrid_selection_bar'
    ></div>
    </ul>

    <div id='display_hybrids'>
      {loading ? (<>
        <div class="lds-ellipsis"><div></div><div></div><div></div></div>
        </>) : null
      }
      {hybrid.receivedData ? 
      hybrid.receivedData.map((prod) => {
        if (hybrid.currentView === "all" || hybrid.currentView === prod.hybrid) {
          return (
            <div key={prod.id}
            className='hybrid_info_displayed'
            onClick={(e) => {
              e.preventDefault();
              selectedHybrid(prod);
            }}
            >
              <div 
              className='hybrid_name'>
                {prod.name.slice(0, 95)}
                {prod.name.length > 95 ? "..." : ""}
              </div>
              <div 
              className='hybrid_price_range'>
                ₱{prod.price}
              </div>
              {prod.hybrid === 'product' ? (
                <div 
                className='hybrid_quantity'>
                  <p>Quantity:</p> {prod.quantity}
                </div>
              ): null}
              <div 
              className='hybrid_type'>
                {prod.hybrid}
              </div>
            </div>
          )
        }
      }): hybrid.receivedData === null ? (<p className='not-found'>You haven't add new product/service yet</p>) : null}
    </div>
  </React.Fragment>)
}

const SelectPsychologicalTest = ({ psyc, setPsyc, containerRef, setReceipt }) => {
  const handleRemoveDisplayedList = () => {
    if (containerRef.current) {
      containerRef.current.classList.remove("psyc_list_fetched");
    }
  };

  const handleCheckboxChange = (list) => {
    setReceipt((prev) => ({
      ...prev, 
      discount: 0,
      professionalFee: 0
    }))
    setPsyc((prev) => {
      const isSelected = prev.selectedTest.some((selectedItem) => selectedItem.id === list.id);
      if (isSelected) {
        return {
          ...prev,
          selectedTest: prev.selectedTest.filter((selectedId) => selectedId.id !== list.id),
        };
      } else {
        return {
          ...prev,
          selectedTest: [...prev.selectedTest, list],
        };
      }
    });
  };

  useEffect(() => {
    if (psyc.psyTestSelection.length > 0 && containerRef.current) {
      containerRef.current.classList.add("psyc_list_fetched");
    }
  }, [psyc.psyTestSelection]);

  if (psyc.psyTestSelection.length > 0) {
    return (
      <React.Fragment>
        <div ref={containerRef} id='psyc_list_container' className='psyc_list_container'>
          <div className='view_first_section'
            onClick={(e) => {
              e.preventDefault();
              handleRemoveDisplayedList();
            }}
          >
            <i className='bx bx-chevron-right'></i>
          </div>
          <div className='psyc_test_select_container'>
          <table>
            <thead id='select_psyc_test_table'>
            <tr>
              <th>Psychological Test</th>
              <th>Standard Input</th>
              <th>Select</th>
            </tr>
            </thead>
            <tbody>
            {psyc.psyTestSelection ?
              psyc.psyTestSelection
                .sort((a, b) => a.psycTest.localeCompare(b.psycTest))
                .map((list) => (
                  <tr key={list.id}>
                    <td>{list.psycTest}</td>
                    <td><span>₱</span>{list.standardRate}</td>
                    <td>
                      <div className='check_list_column'>
                        <label className="checkBox">
                          <input 
                            type="checkbox" 
                            id={`psyTest${list.id}`}
                            value={list.id}
                            checked={psyc.selectedTest.some((selectedId) => selectedId.id === list.id)}
                            onChange={() => handleCheckboxChange(list)}
                          />
                          <div className="transition"></div>
                        </label>
                      </div>
                    </td>
                  </tr>
                )) : null
            }
            </tbody>
          </table>
          </div>
        </div>
      </React.Fragment>
    );
  }

  return null;
};

const SelectedHybrid = ({
  selectedHybrid, client, 
  setHybrid, selectedHybridType,
  receipt, setReceipt,
  psyc, setPsyc, 
  setFieldInfo, handleShowFillTrans,
  transaction, handleResetSelectionField
}) => {

  const handleHybridSelection = (id) => {
    setHybrid((hyb) => ({
      ...hyb,
      selectedHybrid: hyb.selectedHybrid.filter(item => item.id !== id),
      selectedHybridType: hyb.selectedHybrid.length < 2 ? "" : hyb.selectedHybridType
    }))
    setPsyc((prev) => ({
      ...prev,
      psyTestSelection: [],
      selectedTest: []
    }))
    if (selectedHybridType === 'service') {
    handleResetSelectionField();
    }
  }

  useEffect(() => {
    const {discounted, withProfessionalFee, professionalFee, profFeeForDiscount} = receipt
    if ((parseFloat(professionalFee) || parseFloat(isNaN(professionalFee))) || parseFloat(professionalFee) === 0) {
      setReceipt((prev) => ({
        ...prev,
        totalPrice: !isNaN(withProfessionalFee) ? prev.withProfessionalFee : prev.currentPrice
      }));
    }
  }, [receipt.professionalFee]);

  useEffect(() => {
    const selectedHybridTypeClass = document.querySelector('.selected_hybrid');
    if (selectedHybrid.length > 0) {
      getTests(selectedHybrid[0].id);
      if (selectedHybridTypeClass && selectedHybrid[0].hybrid === "service") {
      selectedHybridTypeClass.classList.add('overflow-scroll');
    } else {
      selectedHybridTypeClass.classList.remove('overflow-scroll');
    }
    }
    productTotalPrice();
    
  }, [selectedHybrid]);

  const getTests = async (id) => {
    try {
      if (selectedHybridType === 'service') {
        setFieldInfo((prev) => ({...prev, loading: true}));
      }
      const response = await axios.get(`${config.Configuration.database}/psycTest/${id}`);

      if (response.data.status === "success") {
        setPsyc((prev) => ({
          ...prev,
          psyTestSelection: response.data.data
        }))
      } else {
        setFieldInfo((prev) => ({
          ...prev,
          message: response.data.message
        }))
      }

    } catch (error) {
      if (selectedHybridType === 'service') {
        setFieldInfo((prev) => ({
          ...prev,
          warn: error.message
        }))
      }
    } finally {
      setFieldInfo((prev) => ({...prev, loading: false}))
    }
  }

  const handleCalculateTotalPrice = () => {
    if (psyc.selectedTest.length > 0) {
      const totalPrice = psyc.selectedTest.reduce((sum, total) => sum + parseFloat(total.standardRate), 0).toFixed(2);
      setReceipt((prev) => ({
          ...prev,
          currentPrice: parseFloat(totalPrice).toFixed(2),
          totalPrice: parseFloat(totalPrice).toFixed(2),
          discount: 0,
          discounted: 0,
          professionalFee: 0,
          withProfessionalFee: 0,
          profFeeForDiscount: 0
      }));
    }  
  }

  useEffect(() => {
    handleCalculateTotalPrice();
  }, [psyc.selectedTest]);

  // Checking for changes in Professional fee and Discount
  const [discountWithFee, setdiscountWithFee] = useState({
    prevDiscountWithFee: 0,
    currentDiscountWithFee: 0,
    condition: false
  })

  const handleDiscount = (e, type) => {
    const value = !isNaN(parseFloat(e.target.value)) ? parseFloat(e.target.value) : 0;
    
    if (type === "discount") {
      if (value > receipt.totalPrice) {
        setReceipt((prev) => ({
          ...prev, 
          discount: prev.totalPrice,
          discounted: 0,
          profFeeForDiscount: 0,
        }))
      } else {
        let currentDiscountWithFee = parseFloat(receipt.withProfessionalFee) > 0 ? parseFloat(parseFloat(receipt.withProfessionalFee) - value).toFixed(2) : parseFloat(parseFloat(receipt.totalPrice - value)).toFixed(2);

        setdiscountWithFee((prev) => ({
          ...prev,
          currentDiscountWithFee: currentDiscountWithFee,
          condition: value > 0 ? currentDiscountWithFee >= prev.prevDiscountWithFee && prev.prevDiscountWithFee > 0 : false,
        }))

        setReceipt((prev) => ({
          ...prev, 
          discount: value,
          discounted: currentDiscountWithFee,
          profFeeForDiscount: currentDiscountWithFee
        }));
      }
    } else if (type === "fee") {
      if (parseFloat(receipt.discounted) > 0) {
        let prevDiscountWithFee = (parseFloat(receipt.profFeeForDiscount) + value).toFixed(2);
        setReceipt((prev) => ({
          ...prev, 
          professionalFee: value,
          discounted: discountWithFee.condition ? ((parseFloat(prev.profFeeForDiscount) + value) - parseFloat(prev.discount)).toFixed(2) : (parseFloat(prev.profFeeForDiscount) + value).toFixed(2),
          withProfessionalFee: (parseFloat(prev.currentPrice) + value).toFixed(2)
        }));
        setdiscountWithFee((prev) => ({
          ...prev,
          prevDiscountWithFee: prevDiscountWithFee,
          currentDiscountWithFee: value > 0 ? prevDiscountWithFee : 0
        }))
      } else {
        setReceipt((prev) => ({
          ...prev, 
          professionalFee: value,
          withProfessionalFee: (parseFloat(prev.currentPrice) + value).toFixed(2)
        }));
        setdiscountWithFee((prev) => ({
          ...prev,
          condition: false,
          prevDiscountWithFee: 0,
          currentDiscountWithFee: 0
        }))
      }
    }
  }

  // For handling product quantity * price
  const handleProductQuantity = (operator, id) => {
    setHybrid((prev) => ({
      ...prev,
      selectedHybrid: prev.selectedHybrid.map(item => {
        const checkLimit = (operator === "+" ? item.prodQuantity + 1 : item.prodQuantity - 1);
        const updateProdQty = checkLimit === 0 ? 1 : checkLimit > item.quantity ? item.quantity: checkLimit;
        const newPrice = parseFloat(item.price) * updateProdQty;
        if (item.id === id) {
          return {
            ...item,
            newPrice: newPrice.toFixed(2),
            prodQuantity: updateProdQty
          };
        }
        return item;
      })
    }));
    productTotalPrice();
  };  

  const productTotalPrice = () => {
    if (selectedHybridType === "product") {
      setReceipt((prev) => ({
        ...prev,
        totalPrice: selectedHybrid.reduce((sum, item) => sum + parseFloat(item.newPrice).toFixed(2), 0)
      }));   
    } 
  }

  return (
    <React.Fragment>
      <div id='select_client' className='client_info_container'>
        <Link className='link' to='/Customer'>
        <button type="button" className='select_client_bttn'>
          <p>Select</p> <i className='bx bxs-user-detail'></i>
        </button>
        </Link>
        <div className='client_name'>
          <span>Name: {client.lName && `${client.lName}, ${client.fName} ${client.mName}`}</span>
          <span>Email: {`${client.email}`}</span>
        </div>
      </div>

      <div id='display_selected'>
      {selectedHybrid ? 
      selectedHybrid.map((list) => {
        return (
          <div 
          key={list.id}
          className='selected_hybrid'
          >
            <div className='s_hybrid_name'>
              {list.name}
            </div>
            <p className='s_hybrid_price'>{selectedHybrid[0].hybrid === "product" ? "Price:" : "Actual Price:"} ₱{list.newPrice !== list.price ? list.newPrice : list.price}</p>
            {psyc.selectedTest ? psyc.selectedTest.map((list) => (
              <div className="s_hybrid_psycList" key={list.id}>
                <div className='selected_psyc_test'>
                <p>Psychological Test:</p> <div>{list.psycTest}</div>
              </div>
                <div className='selected_stdrd_int'>
                <p>Standard Input:</p> <div className='price_to_cap'>₱{list.standardRate}</div>
              </div>
              </div>
            )): null}
            {parseFloat(receipt.totalPrice) > 0 && psyc.selectedTest.length > 0 ? (<>
              <div className='discount_conainer'>
                <label htmlFor="professional_fee">Professional fee: </label>
                <input 
                style={{
                  display: "block"
                }}
                type="number" 
                placeholder='₱ ###'
                name="professional_fee" 
                value={receipt.professionalFee === 0 ? '' : receipt.professionalFee}
                onChange={(e) => {
                  e.preventDefault();
                  handleDiscount(e, "fee");
                }}
              />
              </div>
              <div className='discount_conainer'>
                <label htmlFor="discount">Discount: </label>
                <input 
                style={{
                  display: "block"
                }}
                type="number" 
                placeholder='₱ ###'
                name="discount" 
                value={receipt.discount === 0 ? '' : receipt.discount}
                onChange={(e) => {
                  e.preventDefault();
                  handleDiscount(e, "discount");
                }}
              />
              </div>
              <p className='s_hybrid_price'>Total Price: 
              <span style={{color: "#f7860e", marginLeft: receipt.discount > 0 ? 4 : 0}}>{receipt.discount > 0 && `₱${receipt.discounted}`} </span>
              <span style={{
                textDecoration: receipt.discount > 0 ? "line-through" : "none",
                textDecorationThickness:  receipt.discount > 0 ? "2px": "none",
                textDecorationColor: receipt.discount > 0 ? "#6878e0" : "none",
                color: receipt.discount > 0 ? "#ededed" : "#f7860e"
              }}> ₱{receipt.totalPrice} 
              </span>
              
              </p>
            </>) : null}
            {list.hybrid === "product" ? (
              <>
              <div className='qty_bttn_wrapper'>
                <button type="button" className='cremental_bttn' onClick={(e) => {e.preventDefault(); handleProductQuantity("-", list.id)}}><i class='bx bx-minus'></i></button>
                <span>{list.prodQuantity} qty</span>
                <button type="button" className='cremental_bttn' onClick={(e) => {e.preventDefault(); handleProductQuantity("+", list.id)}}><i className='bx bx-plus'></i></button>
              </div>
              <div className='currentProductQuantity'>
              {list.quantity} qty
              </div>
              </>
            ): (
              <button type="button"
                className='psy_test_bttn'
                onClick={(e) => {
                 getTests(list.id);
                }}>
              Psychological Tests
              </button>
              )}
            <button 
            type="button" 
            className='psy_test_bttn'
            onClick={(e) => {
              e.preventDefault();
              handleHybridSelection(list.id);
            }}>Cancel</button>
          </div>
        )
      }): null}
      </div>

      <div id='proceed_to_payment' className='paymeny_bttn_container'>
        <button 
        id='proceed_to_payment_bttn_toggle'
        type="button"
        className='payment_cancel_bttn_hidden'
        onClick={(e) => {
          e.preventDefault();
          handleShowFillTrans();
        }}>
          {transaction.opened ? "Cancel Payment" : "Proceed to Payment"}
        </button>
      </div>
    </React.Fragment>
  )
}

const FillTransaction = ({
  transaction, setTransaction,
  receipt, setReceipt,
  setFieldInfo,
  hybrid, handleResetSelectionField
}) => {
  
  const [transFieldInfo, setTransFieldInfo] = useState({
    selectingModeOfPayment: false,
    selectingTypeOfPayment: false,
    selectingPlatform: false,
  })

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

  const handleToggleTypeOfpayment = () => {
    const element = document.querySelector('.type_of_pay_bttn_selection_hidden');
    if (element) {
      element.classList.toggle('type_of_pay_bttn_selection_show');
      setTransFieldInfo((prev) => ({
        ...prev,
        selectingTypeOfPayment: !prev.selectingTypeOfPayment
      }))
    }
  }

  const handleTogglePlatform = () => {
    const element = document.querySelector('.platform_bttn_selection_hidden');
    if (element) {
      element.classList.toggle('type_of_pay_bttn_selection_show');
      setTransFieldInfo((prev) => ({
        ...prev,
        selectingPlatform: !prev.selectingPlatform
      }))
    }
  }

  const changeModeOfPayment = (mode) => {
    setTransaction((prev) => ({
      ...prev,
      modeOfPayment: mode,
      accNo: mode === "cash" ? "N/A" : ""
    }))
    handleToggleModeOfpayment();
  }

  const changeTypeOfPayment = (type) => {
    setTransaction((prev) => ({
      ...prev,
      typeOfPayment: type,
      cash: ""
    }))
    handleToggleTypeOfpayment();
  }

  const changePlatform = (platform) => {
    setTransaction((prev) => ({
      ...prev,
      platform: platform
    }))
    handleTogglePlatform();
  }

  useEffect(() => {
    const currentChange = transaction.cash - (receipt.discount > 0 ? receipt.discounted : receipt.totalPrice);
    const currentBalance = (receipt.discount > 0 ? receipt.discounted : receipt.totalPrice) - transaction.cash;
    if (parseFloat(receipt.totalPrice) < parseFloat(transaction.cash) && transaction.typeOfPayment === "split") {
      setTransaction((prev) => ({
        ...prev,
        cash: (receipt.discount > 0 ? receipt.discounted : receipt.totalPrice),
        typeOfPayment: "straight"
      }));
      setReceipt((prev) => ({
        ...prev,
        change: currentChange.toFixed(2)
      }))
    } else if (transaction.cash < 0) {
      setTransaction((prev) => ({
        ...prev,
        cash: ""
      }));
    } else if (transaction.typeOfPayment === "split") {
      setReceipt(prev => ({
        ...prev,
        change: currentBalance.toFixed(2)
      }))
    } else if (transaction.typeOfPayment === "straight") {
      setReceipt((prev) => ({
        ...prev,
        change: currentChange.toFixed(2)
      }))
    }
  }, [transaction.cash, transaction.typeOfPayment, receipt.totalPrice]);
  
  const paymentTransation = async () => {
    const { cash, modeOfPayment, typeOfPayment, platform, accNo } = transaction;
    const { quantity, totalPrice, change, client, discount, discounted, receiptNo } = receipt;
    const everyFieldRequired = [cash, accNo, receiptNo];
    // Check the field requirements
    if (!everyFieldRequired.every(prev => prev.length > 0)) {
      setFieldInfo((prev) => ({
        ...prev,
        warn: cash.length < 1 ? "Cash amount required!" : accNo.length < 1 ? "Account number required!" : "Receipt number required!"
      }));
      return;
    }

    if (!(client[0].id > 0)) {
      setFieldInfo(prev => ({
        ...prev,
        warn: "Please select your client/customer first."
      }));
      return;
    }

    // Check change of straight type of payment
    if (change < 0 && typeOfPayment === "straight") {
      setFieldInfo((prev) => ({
        ...prev,
        warn: "Insufficient cash amount!"
      }));
      return;
    }

    try {
      const currentDate = new Date();
      currentDate.toLocaleString('en-US', { timeZone: 'Asia/Manila' });
      const formattedDate = currentDate.toISOString();

      setFieldInfo((prev) => ({...prev, loading: true}));
      const response = await axios.post(`${config.Configuration.database}/recordTransactions`, { 
        items: quantity, 
        total: discount > 0 ? discounted : totalPrice, 
        cash: cash, 
        changeAmount: change, 
        clientId: client[0].id, 
        modeOfPayment: modeOfPayment, 
        accNo: accNo, 
        typeOfPayment: typeOfPayment, 
        platform: platform,
        discount: discount,
        hybridData: hybrid.selectedHybrid,
        currentDate: formattedDate,
        receiptNo: receiptNo,
        remarks: client[0].remarks,
        providers: client[0].providers
       });

       if (response.data.isSuccessful) {
        setFieldInfo((prev) => ({
          ...prev,
          isSuccessful: response.data.message
        }))
        handleResetSelectionField();
      } else {
        setFieldInfo((prev) => ({
          ...prev,
          warn: response.data.message
        }))
      }
    } catch (error) {
      if (error) {
        setFieldInfo((prev) => ({
          ...prev,
          warn: error.response.data.message
        }))
      }
    } finally {
      setFieldInfo((prev) => ({...prev, loading: false}));
    }
  }

  return (
    <React.Fragment>
      <div id='fill_transaction' className='fill_trans_hidden'>
        <table>
          <thead>
            <tr>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Client Name:</td>
              <td>{receipt.client[0].id > 0 && `${receipt.client[0].fName}, ${receipt.client[0].lName} ${receipt.client[0].mName}`}</td>
            </tr>

            <tr>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <td>Mode of Payment:</td>
              <td>
              <button type="button" className='mode_of_pay_bttn' 
                onClick={(e) => {
                  e.preventDefault(); 
                  handleToggleModeOfpayment();
                }}
                style={{
                  backgroundColor: transFieldInfo.selectingModeOfPayment ? "#373737": null,
                }}>
                {transFieldInfo.selectingModeOfPayment ? (<i  style={{fontSize: "1.2rem"}} className='bx bx-x'></i>): transaction.modeOfPayment}</button>
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
              <td>Type of Payment:</td>
              <td>
              <button type="button" className='type_of_pay_bttn' 
                onClick={(e) => {
                  e.preventDefault(); 
                  handleToggleTypeOfpayment();
                }}
                style={{
                  backgroundColor: transFieldInfo.selectingTypeOfPayment ? "#373737": null,
                }}>
                {transFieldInfo.selectingTypeOfPayment ? (<i  style={{fontSize: "1.2rem"}} className='bx bx-x'></i>): transaction.typeOfPayment}</button>
              <div className='type_of_pay_bttn_selection_hidden'>
                <div
                onClick={(e) => {
                  e.preventDefault();
                  changeTypeOfPayment("straight");
                }}>
                  Straight
                </div>
                <div
                onClick={(e) => {
                  e.preventDefault();
                  changeTypeOfPayment("split");
                }}>
                  Split
                </div>
              </div>
              </td>
            </tr>

            <tr>
              <td>Platform:</td>
              <td>
              <button type="button" className='platform_bttn' 
                onClick={(e) => {
                  e.preventDefault(); 
                  handleTogglePlatform();
                }}
                style={{
                  backgroundColor: transFieldInfo.selectingPlatform ? "#373737": null,
                }}>
                {transFieldInfo.selectingPlatform ? (<i  style={{fontSize: "1.2rem"}} className='bx bx-x'></i>): transaction.platform}</button>
              <div className='platform_bttn_selection_hidden'>
                <div
                onClick={(e) => {
                  e.preventDefault();
                  changePlatform("onsite");
                }}>
                  Onsite
                </div>
                <div
                onClick={(e) => {
                  e.preventDefault();
                  changePlatform("online");
                }}>
                  Online
                </div>
              </div>
              </td>
            </tr>

            <tr>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <td>Account Number:</td>
              <td>
                {transaction.modeOfPayment === "cash" ? (
                  "N/A"
                ): (
                <input type="number" placeholder="###" name="acc_no" value={transaction.accNo} 
                required
                onChange={e => {
                  e.preventDefault();
                  setTransaction((prev) => ({
                    ...prev,
                    accNo: e.target.value
                  }))
                }}/>
                )}
              </td>
            </tr>

            <tr>
              <td>Cash:</td>
              <td><input type="number" placeholder="###" name="cash_amount" value={transaction.cash}
              required
              onChange={e => {
                e.preventDefault();
                setTransaction((prev) => ({
                  ...prev,
                  cash: e.target.value
                }))
              }}/></td>
            </tr>

            <tr>
              <td>Receipt #:</td>
              <td><input type="number" placeholder="###" name="cash_amount" value={receipt.receiptNo}
              required
              onChange={e => {
                e.preventDefault();
                setReceipt((prev) => ({
                  ...prev,
                  receiptNo: e.target.value
                }))
              }}/></td>
            </tr>

            <tr>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <td>Discount:</td>
              <td>₱{receipt.discount}</td>
            </tr>

            <tr>
              <td>Total:</td>
              <td style={{color: "#f7860e"}}>₱{receipt.discount > 0 ? receipt.discounted : receipt.totalPrice}</td>
            </tr>

            <tr>
              <td>{transaction.typeOfPayment === "split" ? "Balance:" : "Change: "}</td>
              <td style={{color: "#6878e0"}}>₱{receipt.change}</td>
            </tr>

            <tr>
              <td></td>
              <td></td>
            </tr>

            <tr>
              <td></td>
              <td><button type="button" className='pay_bttn'
              onClick={e => {
                e.preventDefault();
                paymentTransation();
              }}>Pay</button></td>
            </tr>
            
          </tbody>
        </table>
      </div>
    </React.Fragment>
  )
  
}

const Receipt = ({}) => {
  return (
    <React.Fragment>

    </React.Fragment>
  )
}

export default Purchase;