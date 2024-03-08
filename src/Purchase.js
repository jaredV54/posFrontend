import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactToPrint from 'react-to-print';
import config from "./Config.json";
import OPIImage from './OIP.jpg';
import decryptedUserDataFunc from './decrypt';

const Purchase = () => {
  const [hybrid, setHybrid] = useState({
    receivedData: [],
    selectedHybrid: [],
    selectedHybridType: "",
    currentView: localStorage.getItem("currentSelectedHybrid_"),
  });

  const [decryptedUserData, setDecryptUserData] = useState({});
  const containerRef = useRef(null);
  const userType = decryptedUserData.userType;

  if (!hybrid.currentView) {
    localStorage.setItem("currentSelectedHybrid_", "all")
  }

  const [receipt, setReceipt] = useState({
    client: [{id: 0}],
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
  });  

  const [receiptContainer, setReceiptContainer] = useState ({
    showReceipt: false,
    totalPrice: 0
  })

  const [transaction, setTransaction] = useState({
    modeOfPayment: "cash",
    typeOfPayment: "straight",
    platform: "Onsite",
    accNo: "N/A",
    cash: "",
    opened: false,
    placeId: 0
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
    selectedTest: [],
    searchQuery: "",
    filterSelectedList: []
  });

  // Retrieve client and user data
  useEffect(() => {
    const userData = localStorage.getItem('encryptedData');
    const clientData = localStorage.getItem('clientSelection');
  
    if (userData) {
      const decryptionKey = 'NxPPaUqg9d';
      const decrypted = JSON.parse(decryptedUserDataFunc(userData, decryptionKey));
      setDecryptUserData(decrypted);
      setTransaction(prev => ({...prev, placeId: decrypted.storeId}))
    }
  
    if (clientData) {
      const decryptionKey = 'hEv1ZSXzm1';
      const decrypted = JSON.parse(decryptedUserDataFunc(clientData, decryptionKey));
      setReceipt(prevReceipt => ({...prevReceipt, client: [decrypted]}));
    }
  }, []);
  
  const getHybrids = async () => {
    try {
      setFieldInfo((prev) => ({ ...prev, fetchingData: true }));
      const response = await axios.get(`${config.Configuration.database}/hybridData`, {
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
      console.log(error.response)
        if (error.response) {
          setFieldInfo(prev => ({
            ...prev,
            message: error.response.data.message
          }));
        } else if (error.request) {
          setFieldInfo((prev) => ({
            ...prev,
            message: "No response from server. Please check your internet."
          }))
        } else {
          console.log("Error:", error.message);
        }
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
        warn: "Please select atleast 1 list first."
      }))
    }
  }

  useEffect(() => {
    getHybrids();
  }, [hybrid.currentView])

  const handleHybridSelection = (current) => {
    localStorage.setItem("currentSelectedHybrid_", current);
    setHybrid((prev) => ({
      ...prev, currentView: current
    }));
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

  const handleResetSelectionField = (isProduct) => {
    if (containerRef.current) {
      containerRef.current.classList.remove("psyc_list_fetched");
    }

    const showTransactionField = document.getElementById("fill_transaction");
    const togglePaymentBttn = document.getElementById("proceed_to_payment_bttn_toggle");

    if (showTransactionField && togglePaymentBttn) {
      showTransactionField.classList.remove("fill_trans_show");
      togglePaymentBttn.classList.remove("payment_cancel_bttn_show");
    }

    if (isProduct) {
      return;
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

    setReceiptContainer((prev) => ({
      ...prev,
      showReceipt: false,
      totalPrice: 0
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

  const content = (
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
          setFieldInfo={setFieldInfo}
          service={hybrid.selectedHybrid}
          />
          <FillTransaction
          receipt={receipt}
          setReceipt={setReceipt}
          transaction={transaction}
          setTransaction={setTransaction}
          setFieldInfo={setFieldInfo}
          hybrid={hybrid}
          handleResetSelectionField={handleResetSelectionField}
          setReceiptContainer={setReceiptContainer}
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
          listLabel={hybrid.selectedHybrid[0]?.listLabel}
          priceLabel={hybrid.selectedHybrid[0]?.priceLabel}
          />
        </section>
      </main>

      <Receipt 
      receiptContainer={receiptContainer}
      setReceiptContainer={setReceiptContainer}
      handleReset={handleResetSelectionField}
      setFieldInfo={setFieldInfo}
      />
    </React.Fragment>
  )

  const userLoggedIn = useMemo(() => {
    if (userType !== undefined) {
      return content
    } else {
      return null
    }
  })

  return userLoggedIn
}

const DisplayHybrids = ({
  hybrid, setHybrid,
  handleHybridSelection,
  setFieldInfo,
  setPsyc, loading,
  setReceipt
}) => {

  const selectedHybrid = (hyb) => {
    if (hyb.quantity < 1) {
      setFieldInfo(prev => ({
        ...prev,
        message: "Not enough items. Please update the product; 0 product quantity."
      }));
      return;
    };
    const fieldAlreadyExist = hybrid.selectedHybrid.find((list) => list.id === hyb.id);
    if (!fieldAlreadyExist && (hyb.hybrid === hybrid.selectedHybridType || !hybrid.selectedHybridType)) {
      setPsyc((prev) => ({
        ...prev,
        searchQuery: ""
      }))
      if (hybrid.selectedHybridType !== "service") {
        setHybrid((prev) => ({
          ...prev,
          selectedHybrid: [{ ...hyb, newPrice: hyb.price, prodQuantity: 1 }, ...prev.selectedHybrid],
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
          selectedTest: [],
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
        <div className="lds-ellipsis"><div></div><div></div><div></div></div>
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
                {prod.hybrid === 'product' ? (
                  <p> {prod.quantity}qty</p>
                ): null}
              </div>
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

const SelectPsychologicalTest = ({ psyc, setPsyc, containerRef, setReceipt, service}) => {
  const handleCheckboxChange = (list) => {
    setReceipt((prev) => ({
      ...prev, 
      discount: 0,
      professionalFee: 0
    }))
    setPsyc((prev) => {
      const isSelected = prev.selectedTest.some((selectedItem) => selectedItem.id === list.id);
      if (isSelected) {
        setReceipt((prev) => ({
          ...prev,
          totalPrice: 0
        }))
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

  const handleRemoveDisplayedList = () => {
    if (containerRef.current) {
      containerRef.current.classList.remove("psyc_list_fetched");
    }
  };

  useEffect(() => {
    if (psyc.psyTestSelection.length > 0 && containerRef.current) {
      containerRef.current.classList.add("psyc_list_fetched");
    }
  }, [psyc.psyTestSelection]);

  useEffect(() => {
    if (psyc.searchQuery.trim() === '') {
      setPsyc((prev) => ({
        ...prev,
        filterSelectedList: []
      }));
    } else {
      const trimmedQuery = psyc.searchQuery.trim().toLowerCase();
      const filteredList = psyc.psyTestSelection.filter((list) =>
        list.psycTest.toLowerCase().includes(trimmedQuery) ||
        list.standardRate.toLowerCase().includes(trimmedQuery) 
      );

      setPsyc((prev) => ({
        ...prev,
        filterSelectedList: filteredList
      }));
    }
  }, [psyc.searchQuery])

  if (psyc.psyTestSelection.length > 0) {
    return (
      <React.Fragment>
        <div ref={containerRef} id='psyc_list_container' className='psyc_list_container'>
            <div id='service_list_search_container'>
              <input 
              type="text" 
              name="searchField" 
              value={psyc.searchQuery}
              placeholder='Search...'
              onChange={(e) => {
                e.preventDefault();
                setPsyc((prev) => ({
                  ...prev,
                  searchQuery: e.target.value
                }))
              }} />
            </div>

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
              <th>{service[0].listLabel}</th>
              <th>{service[0].priceLabel}</th>
              <th>Select</th>
            </tr>
            </thead>
            <tbody>
            {psyc.filterSelectedList.length > 0 && psyc.psyTestSelection ?
              psyc.filterSelectedList
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
                )) : psyc.psyTestSelection && !(psyc.searchQuery.length > 0) ? 
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
                            onChange={() => {
                              handleCheckboxChange(list)
                            }}
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
  transaction, handleResetSelectionField,
  listLabel, priceLabel
}) => {
  const { profFee = false } = selectedHybrid[0] || {};

  const buildInProfFee = [
    ["Cancel", 0],
    ["1 test:", 1800],
    ["2 test:", 2300],
    ["3 test:", 2800],
    ["4 test:", 3300],
    ["5 test:", 3800],
    ["6 test:", 4300],
    ["7 test:", 4800],
    ["8 test:", 5000],
    ["9 test:", 5300],
    ["10 test:", 5700],
    ["11 test:", 6200],
  ]

  const handleHybridSelection = (id) => {
    setHybrid((hyb) => ({
      ...hyb,
      selectedHybrid: hyb.selectedHybrid.filter(item => item.id !== id),
      selectedHybridType: hyb.selectedHybrid.length < 2 ? "" : hyb.selectedHybridType
    }));

    setPsyc((prev) => ({
      ...prev,
      psyTestSelection: [],
      selectedTest: [],
      filterSelectedList: []
    }))

    if (selectedHybridType === 'service') {
      handleResetSelectionField(false);
    } else {
      handleResetSelectionField(true);
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
      if (selectedHybridTypeClass && selectedHybridType === "service") {
      getList(selectedHybrid[0].id);
      selectedHybridTypeClass.classList.add('overflow-scroll');
    } else {
      selectedHybridTypeClass.classList.remove('overflow-scroll');
    }
    }
    productTotalPrice();
    
  }, [selectedHybrid]);

  const getList = async (id) => {
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
      if (error.response) {
        setFieldInfo(prev => ({...prev, warn: error.response.data.message}));
        console.log(error.response.data.message)
      } else if (error.request) {
        setFieldInfo(prev => ({...prev, warn: "Network issue. Please try again later."}));
      } else {
        setFieldInfo(prev => ({...prev, warn: error.message}));
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

  // Checking for constant changes in Professional fee and Discount
  const [discountWithFee, setdiscountWithFee] = useState({
    prevDiscountWithFee: 0,
    currentDiscountWithFee: 0,
    condition: false
  })

  const handleDiscountAndProfFee = (e, type) => {
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
      const totalPrice = selectedHybrid.reduce(
        (sum, item) => sum + parseFloat(item.newPrice),
        0
      ).toFixed(2);
  
      setReceipt((prev) => ({
        ...prev,
        totalPrice: totalPrice
      }));
    }
  };  

  const showProfessionalfees = () => {
    const displayProfFee = document.querySelector(".prof_fee_container");
    if (displayProfFee) {
        displayProfFee.classList.toggle("prof_fee_container_show");
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
          <span>{client.id ? 
          `CID: ${client.id}` :
          "---"}</span>
          <span>{client.lName ? 
          `${client.lName}, ${client.fName} ${client.mName}` :
          "---"}</span>
        </div>
      </div>

      <div className='prof_fee_container'>
      <p>Professional fee</p>
      <div className='built_in_prof_fee'>
        {buildInProfFee.map(fees => (
          <button type='button' 
            key={fees[0]}
            value={fees[1]}
            onClick={(e) => {
              handleDiscountAndProfFee(e, "fee");
              showProfessionalfees()
            }}
          >
            {fees[0]} {fees[1] === 0 ? "" : fees[1]}
          </button>
        ))}
      </div>
      </div>

      <div id='display_selected'>
        {selectedHybridType === "service" &&
        <div className='list_length'>
          {psyc.selectedTest.length}
        </div>}
        {selectedHybridType === "product" && 
        <div className='list_length'>
          {selectedHybrid.length}
        </div>}

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
            <p className='s_hybrid_price'>
              <span>{selectedHybrid[0].hybrid === "product" ? `Price: ₱${list.newPrice}` : `Actual Price: ₱${list.price}`}</span>
              {list.hybrid === "product" && 
              <span className='prod_qty'>{list.quantity - list.prodQuantity} qty</span>}
            </p>
            
            {psyc.selectedTest ? psyc.selectedTest.map((list) => (
              <div className="s_hybrid_psycList" key={list.id}>
                <div className='selected_psyc_test'>
                <p>{listLabel}:</p> <div>{list.psycTest}</div>
              </div>
                <div className='selected_stdrd_int'>
                <p>{priceLabel}:</p> <div className='price_to_cap'>₱{list.standardRate}</div>
              </div>
              </div>
            )): null}
            {parseFloat(receipt.totalPrice) > 0 && psyc.selectedTest.length > 0 ? (<>
            {profFee === 1 && (<div className='discount_conainer'>
                <label htmlFor="professional_fee">Professional fee: </label>
                <button 
                type="button"
                className='select_prof_fee_bttn'
                onClick={() => showProfessionalfees()}
                style={{
                 display: "block"
                }}
                >
                 {receipt.professionalFee === 0 ? 'Select' : receipt.professionalFee}
                </button>
              </div>)}
              
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
                handleDiscountAndProfFee(e, "discount");
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
              </>
            ): (
              <button type="button"
                className='psy_test_bttn'
                onClick={(e) => {
                 getList(list.id);
                }}>
              List
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
  hybrid,
  setReceiptContainer
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
    const { cash, modeOfPayment, typeOfPayment, platform, accNo, placeId } = transaction;
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
      currentDate.toLocaleString('en-US');
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
        providers: client[0].providers,
        service: client[0].service,
        placeId: placeId
       });

       if (response.data.isSuccessful) {
        const isSplit = typeOfPayment === "split";
        setReceiptContainer((prev) => ({
          ...prev,
          showReceipt: true,
          totalPrice: discount > 0 ? discounted : totalPrice,
          hybridType: hybrid.selectedHybridType,
          clientName: `${client[0].fName} ${client[0].lName}`,
          name: hybrid.selectedHybrid[0].name,
          price: hybrid.selectedHybrid[0].price,
          receiptNo: receiptNo,
          dateTime: formattedDate,
          modeOfPayment: modeOfPayment,
          typeOfPayment: typeOfPayment,
          transId: response.data.transId,
          amountPaid: cash,
          change: !isSplit ? change : 0,
          balance: isSplit ? change : 0,
          placeId: placeId,
          place: {}
        }))
      } else {
        setFieldInfo((prev) => ({
          ...prev,
          warn: response.data.message
        }))
      }
    } catch (error) {
      console.error(error)
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
              <td>Place ID:</td>
              <td>{transaction.placeId}</td>
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
              onClick={() => {
                paymentTransation();
              }}>Pay</button></td>
            </tr>
            
          </tbody>
        </table>
      </div>
    </React.Fragment>
  )
  
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

const Receipt = ({receiptContainer, setReceiptContainer, handleReset, setFieldInfo, hybridData}) => {
  const componentRef = useRef(null);
  const { 
    hybridType, 
    clientName,
    totalPrice, 
    name, price,
    dateTime, 
    receiptNo, 
    typeOfPayment,
    amountPaid, 
    change, 
    balance, 
    transId, 
    place, 
    modeOfPayment, 
    placeId
  } = receiptContainer;

  const getPlace = async () => {
    const id = placeId;
    try {
      setFieldInfo((prev) => ({...prev, loading: true}));
      const response = await axios.get(`${config.Configuration.database}/place/${id}`);
      if (response.data.isSuccessful) {
        setReceiptContainer((prev) => ({...prev, showReceipt: true, place: response.data.result}));
        setFieldInfo((prev) => ({...prev, isSuccessful: "Payment successful!"}));
      } else {
        setFieldInfo((prev) => ({...prev, warn: response.data.message}));
      }
    } catch (error) {
      if (error.response) {
        setFieldInfo((prev) => ({...prev, warn: error.response.data.message}));
      } else if (error.request) {
        setFieldInfo((prev) => ({...prev, message: "Payment successful, but cannot view receipt right now due to a network issue."}));
      } else {
        setFieldInfo((prev) => ({...prev, warn: error.message}));
      }
    } finally {
      setFieldInfo((prev) => ({...prev, loading: false}));
    }
  }

  useEffect(() => {
    if (receiptContainer.totalPrice) {
      getPlace();
    }
  }, [receiptContainer.showReceipt]);

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

  if (receiptContainer.showReceipt) {
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
            onClick={() => handleReset()}>
              Proceed 
            </button>
          </div>
  
          <div ref={componentRef} id='receipt' style={stylesForReceipt.container}>
              <div id='hybrid_info' style={stylesForReceipt.row1.hybridInfo.container}>
                <div style={stylesForReceipt.row1.hybridInfo.divBorder}>
                <div id='service_bckgrnd' style={stylesForReceipt.row1.hybridInfo.serviceBckgrnd.container}>
                <div style={stylesForReceipt.row1.hybridInfo.serviceBckgrnd.div1}>
                  -------------------------- {hybridType} --------------------------
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
                      <td>{clientName}</td>
                      <td style={{fontWeight: 600}}>Mode of payment</td>
                      <td>{modeOfPayment}</td>
                    </tr>

                    <tr>
                      <td style={{fontWeight: 600}}>Date</td>
                      <td>{formatDate(dateTime)}</td>
                      <td style={{fontWeight: 600}}>Type of payment</td>
                      <td>{typeOfPayment}</td>
                    </tr>

                    <tr>
                      <td style={{fontWeight: 600}}>Time</td>
                      <td>{formatTime(dateTime)}</td>
                      <td style={{fontWeight: 600}}>Total</td>
                      <td>{totalPrice}</td>
                    </tr>

                    <tr>
                      <td style={{fontWeight: 600}}>Receipt No</td>
                      <td style={{color: "#0204AB"}}>#{receiptNo}</td>
                      <td style={{fontWeight: 600}}>Amount paid</td>
                      <td>{parseFloat(amountPaid).toFixed(2)}</td>
                    </tr>

                    <tr>
                      <td style={{fontWeight: 600}}>Trans ID</td>
                      <td style={{color: "#E30403"}}>#{transId}</td>
                      <td style={{fontWeight: 600}}>{typeOfPayment === "split" ? "Balance" : "Change"}</td>
                      <td>{typeOfPayment === "split" ? balance : change}</td> 
                    </tr>

                  </tbody>
                </table>
              </div>

              <div id='place_info' style={stylesForReceipt.row3.placeInfo.container}>
                <table style={stylesForReceipt.row3.placeInfo.table.container}>
                  <tbody>
                    <tr>
                      <td style={{fontWeight: 600}}>Place</td>
                      <td>{place.storeName}</td>
                    </tr>
                    <tr>
                      <td style={{fontWeight: 600}}>Address</td>
                      <td>{place.address}</td>
                    </tr>
                    <tr>
                      <td style={{fontWeight: 600}}>Contact Number</td>
                      <td>{place.contactNumber}</td>
                    </tr>
                    <tr>
                      <td style={{fontWeight: 600}}>Email</td>
                      <td>{place.email}</td>
                    </tr>
                    <tr>
                      <td style={{fontWeight: 600}}>BIR TIN</td>
                      <td>{place.birTin}</td>
                    </tr>
                    <tr>
                      <td style={{fontWeight: 600}}>Branch</td>
                      <td>{place.branchName}</td>
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

export default Purchase;