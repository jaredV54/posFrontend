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
    change: 0,
    cashAmount: 0,
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
          setHybrid={setHybrid}
          client={receipt.client[0]} 
          receipt={receipt}
          setReceipt={setReceipt}
          psyc = {psychologicalAssessment}
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

const SelectPsychologicalTest = ({psyc, setPsyc}) => {

}

const SelectedHybrid = ({selectedHybrid, client, setHybrid, receipt, setReceipt, psyc, setPsyc, setFieldInfo}) => {
  const handleHybridSelection = (id) => {
    setHybrid((hyb) => ({
      ...hyb,
      selectedHybrid: hyb.selectedHybrid.filter(item => item.id !== id),
      selectedHybridType: hyb.selectedHybrid.length < 2 ? "" : hyb.selectedHybridType
    }))
  }

  const getTests = async (id) => {
    try {
      const response = await axios.get(`${config.Configuration.database}/product/${id}`);
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

  return (
    <React.Fragment>
      <div id='select_client' className='client_info_container'>
        <Link className='link' to='/Customer'>
        <button type="button" className='select_client_bttn'>
          <p>Select</p> <i className='bx bxs-user-detail'></i>
        </button>
        </Link>
        <div className='client_name'>
          <span>Name: {`${client.lName}, ${client.fName} ${client.mName}`}</span>
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
            <p className='s_hybrid_price'>₱{list.price}</p>
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