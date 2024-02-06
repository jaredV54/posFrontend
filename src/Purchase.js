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
    isFetching: false,
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
      address: ''
    }],
    totalPrice: 0,
    discount: 0,
    discounted: 0,
    receiptNo: ''
  })

  const [transaction, setTransaction] = useState({
    modeOfPayment: "",
    typeOfPayment: "straight",
    platform: "Onsite",
    accNo: "",
    cash: 0,
    changeAmount: 0,
  })

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
  })
  
  const getHybrids = async () => {
    try {
      setFieldInfo((prev) => ({ ...prev, fetchingData: true }));
      const response = await axios.get(`${config.Configuration.database}/product`, {
        params: {
          hybrid: hybrid.currentView === "all" ? null : hybrid.currentView,
        },
      });
      setHybrid((prev) => ({ ...prev, receivedData: response.data }));
    } catch (error) {
      console.error('Error fetching hybrids:', error);
    } finally {
      setFieldInfo((prev) => ({ ...prev, fetchingData: false }));
    }
  };

  useEffect(() => {
    getHybrids();
  }, [])
  
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

  if (userType.userType !== undefined) {
  return (
    <React.Fragment>
      <main id='purchase_container' className='purchase_container_class'>
        <section id='hybrid_info'>
          <SelectPsychologicalTest
          psyc={psychologicalAssessment}
          setPsyc = {setPsychologicalAssessment}
          containerRef={containerRef} 
          setReceipt={setReceipt}
          />
          <FillTransaction/>
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
          />
        </section>
        <section id='hybrid_purchase'>
          <SelectedHybrid
          selectedHybrid = {hybrid.selectedHybrid}
          hyrbidType={hybrid.selectedHybridType}
          setHybrid={setHybrid}
          client={receipt.client[0]} 
          receipt={receipt}
          setReceipt={setReceipt}
          psyc={psychologicalAssessment}
          setPsyc = {setPsychologicalAssessment}
          setFieldInfo={setFieldInfo}
          />
        </section>
      </main>

      <FillTransaction/>
      <Receipt/>
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
  fieldInfo, setFieldInfo
}) => {

  const selectedHybrid = (hyb) => {
    const fieldAlreadyExist = hybrid.selectedHybrid.find((list) => list.id === hyb.id);
    if (!fieldAlreadyExist && (hyb.hybrid === hybrid.selectedHybridType || !hybrid.selectedHybridType)) {
      if (hybrid.selectedHybridType !== "service") {
        setHybrid((prev) => ({
          ...prev,
          selectedHybrid: [hyb, ...prev.selectedHybrid],
          selectedHybridType: hyb.hybrid
        }))
      } else {
        setFieldInfo((info) => ({
          ...info,
          message: "1 service a time"
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
        warn: `The current selected type is ${hybrid.selectedHybridType}. Please empty the field if you want to select other type (Product/Service).`
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
      discount: 0
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
          <ul className='ul_of_psycTests'>
            <li>
              <div className='psyc_test_column'>
                Psychological Test
              </div>
              <div className='stand_int_column'>
                Standard Rate
              </div>
              <div className='check_list_column'></div>
            </li>
            {psyc.psyTestSelection.map((list) => (
              <li key={list.id}>
                <div className='psyc_test_column' htmlFor={`psyTest${list.id}`}>
                  {list.psycTest}
                </div>
                <div className='stand_int_column'>
                  {list.standardRate}
                </div>
                <div className='check_list_column'>
                  <input
                    type="checkbox"
                    id={`psyTest${list.id}`}
                    value={list.id}
                    checked={psyc.selectedTest.some((selectedId) => selectedId.id === list.id)}
                    onChange={() => handleCheckboxChange(list)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </React.Fragment>
    );
  }

  return null;
};

const SelectedHybrid = ({selectedHybrid, client, hybridType, setHybrid, receipt, setReceipt, psyc, setPsyc, setFieldInfo}) => {
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
  }

  const handleCalculateTotalPrice = () => {
    if (psyc.selectedTest.length > 0) {
      setReceipt((prev) => ({
        ...prev,
        totalPrice: psyc.selectedTest.reduce((sum, total) => sum + parseFloat(total.standardRate), 0)
      }))
    }
  }

  useEffect(() => {
    handleCalculateTotalPrice();
  }, [psyc.selectedTest]);

  useEffect(() => {
    if (selectedHybrid.length > 0) {
      getTests(selectedHybrid[0].id)
    }
    
  }, [selectedHybrid])

  const getTests = async (id) => {
    try {
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
      setFieldInfo((prev) => ({
        ...prev,
        warn: error.message
      }))
    }
  }

  const handleDiscount = (e) => {
    const value = parseFloat(e.target.value);
    if (value <= receipt.discount) {
      setReceipt((prev) => ({
        ...prev, 
        discount: 0,
        discounted: 0
      }))
    } else if (value > receipt.totalPrice) {
      setReceipt((prev) => ({
        ...prev, 
        discount: prev.totalPrice,
        discounted: 0
      }))
    } else {
      setReceipt((prev) => ({
        ...prev, 
        discount: value,
        discounted: prev.totalPrice - value
      }))
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
            <h4 className='s_hybrid_name'>
              {list.name}
            </h4>
            <p className='s_hybrid_price'>Actual Price: ₱{list.price}</p>
            {psyc.selectedTest ? psyc.selectedTest.map((list) => (
              <div className="s_hybrid_psycList" key={list.id}>
              <p>{list.psycTest}</p> 
              <p>Standard Input: ₱{list.standardRate}</p> 
              </div>
            )): null}
            {receipt.totalPrice > 0 && psyc.selectedTest.length > 0 && (<>
              <div className='discount_conainer'>
              <label htmlFor="discount">Discount: </label>
              <input 
              style={{
                display: "block"
              }}
              type="number" 
              name="discount" 
              value={receipt.discount === 0 ? '' : receipt.discount}
              onChange={(e) => {
                e.preventDefault();
                handleDiscount(e);
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
            </>)}
            {list.hybrid === "product" ? (
              <div className='qty_bttn_wrapper'>
                <button type="button" className='cremental_bttn'><i class='bx bx-minus'></i></button>
                <span>{list.quantity}qty</span>
                <button type="button" className='cremental_bttn'><i className='bx bx-plus'></i></button>
              </div>
            ): <button type="button"
             className='psy_test_bttn'
             onClick={(e) => {
              getTests(list.id);
             }}>
              Psychological Tests
              </button>}
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
        <button type="button">
          Proceed Payment
        </button>
      </div>
    </React.Fragment>
  )
}

const FillTransaction = ({}) => {

}

const Receipt = ({}) => {

}

export default Purchase;