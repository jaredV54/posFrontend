import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from "./Config.json";

const Hybrid = () => {
  const userTypeJSON = JSON.parse(localStorage.getItem("currentUserType"));
  const userType = userTypeJSON.userType;
  if (userType !== 'user' && userType !== undefined) {
    return (
      <div>
        <div id='home-body' className='grid-home-container'>
          <Products/>
        </div>
      </div>
    );
  } else {
    return (<div>
      You don't have acces to this page.
    </div>)
  }
}

const Products = () => {
  const [hybrid, setHybrid] = useState({
    receivedData: [],
    selectedHybrid: "",
    currentView: localStorage.getItem("currentSelectedHybrid_")
  });

  if (!hybrid.currentView) {
    localStorage.setItem("currentSelectedHybrid_", "all")
  }

  const [hybridInfo, setHybridInfo] = useState({
    name: "",
    price: "",
    quantity: "",
    description: ""
  });

  const [psychologicalAssessment, setPsychologicalAssessment] = useState({
    psycTest: "",
    standardRate: "",
    branch: [],
    manageBy: "Add"
  })

  const [fieldInfo, setFieldInfo] = useState({
    searchQuery: "",
    option: "Add",
    currentIdToUpdate: 0,
    message: "",
    warn: "",
    isSuccessful: "",
    loading: false,
    fetchingData: false
  })

  const resetvalues = () => {
    setHybrid((prev) => ({
      ...prev,
      selectedHybrid: ''
    }))

    setFieldInfo((prev) => ({
      ...prev, 
      option: "Add",
      currentIdToUpdate: 0
    }))

    setPsychologicalAssessment((prev) => ({
      ...prev,
      psycTest: "",
      standardRate: "",
      branch: []
    }))

    setHybridInfo((prev) => ({
      ...prev,
      name: "",
      price: "",
      quantity: "",
      description: ""
    }))
  }

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
      console.error('Error fetching hybrids:', error);
        setFieldInfo(prev => ({
          ...prev,
          message: error.response.data.message
        }));
    } finally {
      setFieldInfo((prev) => ({ ...prev, fetchingData: false }));
    }
  };
  
  useEffect(() => {
    getHybrids();
  }, []);

  const cancelHybridSelection = (viewData, removeDiplayedTests) => {
    if (removeDiplayedTests) {
      resetvalues();
    }
    const removeHybridElement = document.getElementsByClassName('Add_new_hybrid')[0];
    const isService = document.getElementsByClassName('assessmet_field')[0];
    if (viewData) {
      isService.classList.remove("display_assessment_field")
    } else {
      removeHybridElement.classList.remove("new_bybrid_has_selected");
      isService.classList.remove("display_assessment_field");
    } 
  }

  const handleHybridSelection = (current) => {
    localStorage.setItem("currentSelectedHybrid_", current);
    setHybrid((prev) => ({
      ...prev, currentView: current
    }))
  }

  const addNewHybrid = (val, isProductUpdate = true) => {
    const addNewHybridElement = document.getElementsByClassName('Add_new_hybrid')[0];
    const isService = document.getElementsByClassName('assessmet_field')[0];
    if (val === "service" && isService) {
      isService.classList.add("display_assessment_field")
    }
    if (val) {
      addNewHybridElement.classList.add("new_bybrid_has_selected")
    }
    setHybrid((prev) => ({
        ...prev, selectedHybrid: val
    }));
    if (isProductUpdate) {
      setHybridInfo((prev) => ({
        ...prev, quantity: val === "service" ? "9999999" : ""
    }));
    }
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

  const handlePsycTest = () => {
    if (psychologicalAssessment.psycTest && psychologicalAssessment.standardRate) {
      const testExists = psychologicalAssessment.branch.some(
        (item) => item.psycTest === psychologicalAssessment.psycTest
      );
  
      if (!testExists) {
        setPsychologicalAssessment((prev) => ({
          ...prev,
          psycTest: "",
          standardRate: "",
          branch: [
            { psycTest: prev.psycTest, standardRate: prev.standardRate },
            ...prev.branch
          ],
          manageBy: "Add"
        }));
      } else {
        setFieldInfo((prev) => ({
          ...prev, 
          warn: "Test already exists"
        }))
      }
    }
  };

  const handleAddNewHybrid = async () => {
    const filledAllFields = Object.values(hybridInfo).every((list) => list !== '');
    if (filledAllFields) {
      if (psychologicalAssessment.branch.length > 0 || hybrid.selectedHybrid === "product") {
        setFieldInfo((prev) => ({
          ...prev,
          loading: true
        }))
        switch (fieldInfo.option) {
          case "Add": 
            try {
              const response = await axios.post(`${config.Configuration.database}/hybrid`, {
                ...hybridInfo,
                hybrid: hybrid.selectedHybrid,
                branch: psychologicalAssessment.branch
              })
              cancelHybridSelection(false, true);
              setFieldInfo((prev) => ({
                ...prev,
                isSuccessful: response.data
              }))
              getHybrids();
            } catch(err) {
              console.error(err)
            } finally {
              setFieldInfo((prev) => ({
                ...prev,
                loading: false
              }))
            }
          break;
        
          case "Update" :
            try {
              const response = await axios.post(`${config.Configuration.database}/hybrid/${fieldInfo.currentIdToUpdate}`, {
                  ...hybridInfo,
                  hybrid: hybrid.selectedHybrid,
                  branch: psychologicalAssessment.branch
                });

                if (response.data.message === 'Data updated successfully') {
                  setFieldInfo((prev) => ({
                    ...prev, 
                    isSuccessful: hybrid.selectedHybrid === "service" ? "Service Updated Successfully!" : "Product Updated Successfully!" 
                  }))
                } else {
                  setFieldInfo((prev) => ({
                    ...prev, 
                    isSuccessful: response.data.message
                  }))
                }
                cancelHybridSelection(false, true);
                getHybrids()
            } catch (error) {
              console.log(error.response.data.message)
                if (error.response) {
                  console.error('Server Error:', error.response.data);
                  setFieldInfo((prev) => ({
                    ...prev,
                    isSuccessful: `Error: ${error.response.data.message}`
                  }));
                } else if (error.request) {
                  console.error('Network Error:', error.request);
                  setFieldInfo((prev) => ({
                    ...prev,
                    isSuccessful: 'Network error. Please try again later.'
                  }));
                } else {
                  console.error('Error:', error.message);
                  setFieldInfo((prev) => ({
                    ...prev,
                    isSuccessful: `Error: ${error.message}`
                  }));
                }
                cancelHybridSelection(false, true);
              } finally {
                setFieldInfo((prev) => ({
                  ...prev,
                  loading: false
                }))
              }

            break;
    
          default: 
          break;
        }
      } else {
        setFieldInfo((prev) => ({
          ...prev,
          message: hybrid.selectedHybrid === "service" ? "Psychological Assessment is empty" : prev.message
        }));
      }
    } else {
      setFieldInfo((prev) => ({
        ...prev,
        message: "Please fill all the fields"
      }));
    }
  }

  const managePsycTable = (name, price, action) => {
    if (action === "edit") {
      setPsychologicalAssessment((prev) => ({
        ...prev,
        psycTest: name,
        standardRate: price,
        branch: prev.branch.filter((item) => item.psycTest !== name),
        manageBy: "Update"
      }));
    } else if (action === "delete") {
      setPsychologicalAssessment((prev) => ({
        ...prev,
        branch: prev.branch.filter((item) => item.psycTest !== name),
      }));
    }
  };

  const updateSelectedHybrid = async (selectedHybrid = false, manageHybridBy) => {
    if (selectedHybrid) {
      if (manageHybridBy === 'edit') {
        setFieldInfo((prev) => ({
          ...prev,
          option: "Update",
          currentIdToUpdate: selectedHybrid.id,
          loading: true
        }))
        try {
          const response = await axios.get(`${config.Configuration.database}/purchase/${selectedHybrid.id}`, {
            params: {
              hybrid: selectedHybrid.hybrid
            }
          });
    
          if (response.data.status === 'success') {
            if (selectedHybrid.hybrid === "service") {
              editService(selectedHybrid, response.data.data);
            } else {
              editProduct(selectedHybrid);
            }
          } else {
            console.error(response.data.message);
            setFieldInfo((prev) => ({
              ...prev,
              option: "Add"
            }))
          }
        } catch (error) {
          setFieldInfo((prev) => ({
            ...prev,
            option: "Add"
          }))
          console.error(error);
        } finally {
          setFieldInfo((prev) => ({
            ...prev,
            loading: false
          }))
        }
      } else {
        setHybrid((prev) => ({
          ...prev,
          selectedHybrid: selectedHybrid.hybrid
        }))
        if (!Object.values(hybridInfo).every((list) => list === '')) {
          cancelHybridSelection(false, true);
        }
        setFieldInfo((prev) => ({
          ...prev,
          loading: true
        }))
          try {  
            const response = await axios.delete(`${config.Configuration.database}/hybrid/${selectedHybrid.currentSelectedId}`, {
              hybrid: hybrid.selectedHybrid
            });
            getHybrids();
            setFieldInfo((prev) => ({
              ...prev, 
              isSuccessful: response.data.message
            }))
          } catch (error) {
            console.error(error)
          } finally {
            setFieldInfo((prev) => ({
              ...prev,
              loading: false
            }))
          }
      }
    } 
  };  

  const editService = (service, data) => {
  setPsychologicalAssessment((list) => ({
    ...list,
    branch: [...data]
  }))

  setHybridInfo((info) => ({
    ...info,
    name: service.name,
    price: service.price,
    quantity: service.quantity,
    description: service.description
  }))
  addNewHybrid("service");
  }

  const editProduct = (product) => {
    setHybridInfo((info) => ({
      ...info,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      description: product.description
    }))
    addNewHybrid("product", false);
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
    
    <div id='hybrid_container'>
      {fieldInfo.loading ? (<span className="loader"></span>) : null}
        <section className='grid_hybrid manage_hybrid'>
            <div className='Add_new_hybrid'>
                <div id='add_new_hybrid_selection'>
                <div 
                className='hybrid_icon_wrapper'
                onClick={(e) => {
                    e.preventDefault();
                    addNewHybrid("product")
                }}>
                    <i className='bx bxs-cube' ></i>
                    <p>New product</p>
                </div>
                <div 
                className='hybrid_icon_wrapper'
                onClick={(e) => {
                    e.preventDefault();
                    addNewHybrid("service")
                }}>
                    <i className='bx bxs-layer'></i>
                    <p>New service</p>
                </div>
                </div>
            </div>
            <div 
            id='deploy_new_hybrid'
            className='edit_selected_hybrid'
            >
              <h2>Create new {hybrid.selectedHybrid}</h2>
                <label htmlFor='hybrid-name label-first'>Name</label>
                <input
                  className='inp-product-name'
                  type='text'
                  name='hybrid-name'
                  value={hybridInfo.name}
                  onChange={(e) => {
                    e.preventDefault();
                    setHybridInfo((prev) => ({
                        ...prev, name: e.target.value
                    }))
                  }}
                  placeholder='---'
                />
                
                {hybrid.selectedHybrid === "product" ? (
                  <>
                  <label htmlFor='hybrid-price'>Price</label>
                  <input
                    className='inp-hybrid-price'
                    type='number'
                    name='hybrid-price'
                    value={hybridInfo.price}
                    onChange={(e) => {
                        e.preventDefault();
                        setHybridInfo((prev) => ({
                            ...prev, price: e.target.value
                        }))
                    }}
                    placeholder='###'
                  />
                  <label htmlFor='product-quantity'>Quantity</label>
                  <input
                    className='inp-product-quantity'
                    type='number'
                    name='product-quality'
                    value={hybridInfo.quantity}
                    onChange={(e) => {
                        e.preventDefault();
                        setHybridInfo((prev) => ({
                            ...prev, quantity: e.target.value
                        }))
                    }}
                    placeholder='---'
                  />
                  </>
                ): (
                    <>
                    <label htmlFor='hybrid-price'>Actual Price</label>
                    <input
                      className='inp-hybrid-price'
                      type='text'
                      name='hybrid-price'
                      value={hybridInfo.price}
                      onChange={(e) => {
                          e.preventDefault();
                          setHybridInfo((prev) => ({
                              ...prev, price: e.target.value
                          }))
                      }}
                      placeholder='###'
                    />
                    <button 
                    type="button"
                    onClick={() => {
                    const isService = document.getElementsByClassName('assessmet_field')[0];
                      if (isService) {
                        isService.classList.add("display_assessment_field")
                      }
                    }}>
                      <span>Psychological Assessment</span> <i className='bx bx-chevron-right'></i>
                    </button>
                    </>
                )}

                <label htmlFor="hybrid_description">Description</label>
                <textarea
                name='hybrid_description'
                placeholder='---' 
                value={hybridInfo.description}
                onChange={(e) => {
                  e.preventDefault();
                  setHybridInfo((prev) => ({
                    ...prev, description: e.target.value
                  }))
                }}
                />
                <div className='option_container'>
                <button type="button" style={{
                  backgroundColor: "#f7860e"
                }}
                onClick={(e) => {
                  e.preventDefault();
                  cancelHybridSelection(false, true)
                }}

                ><span>Cancel</span></button>
                <button 
                type="button"
                onClick={handleAddNewHybrid}
                >
                  <span>
                    {fieldInfo.option}
                  </span>
                </button>
                </div>
                <p style={{
                    textAlign: "center",
                    marginTop: 5,
                    fontSize: ".9rem",
                    fontWeight: "500"
                  }}
                  className='not-found'>{fieldInfo.message}</p>
            </div>
        </section>

        <section className='grid_hybrid display_hybrid_info'>
          {psychologicalTest(psychologicalAssessment, setPsychologicalAssessment, handlePsycTest, managePsycTable, psychologicalAssessment.manageBy, fieldInfo.warn, cancelHybridSelection)}

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
          <DisplayHybrids
            hybrid={hybrid}
            updateSelectedHybrid={updateSelectedHybrid}
            currentId={fieldInfo.currentIdToUpdate}
            loading={fieldInfo.fetchingData}
          />
        </section>
    </div>
    </React.Fragment>
  )
}

const psychologicalTest = (psychologicalAssessment, setPsychologicalAssessment, handlePsycTest, managePsycTable, option, warn, cancelHybridSelection) => {
  return (
  <>
  <div id='assessmet_field' className='assessmet_field'>
    <div className='exit_adding_test'
    onClick={(e) => {
      e.preventDefault();
      cancelHybridSelection(true);
    }}>
    <i className='bx bx-chevron-right'></i>
    </div>
    <div className='wrap_center'>
    <div id='psychological_test'>
      <label htmlFor="psycTest">Psychological Test <span style={{color: "#f7860e"}}>{warn}</span></label>
      <input 
      type="text" 
      name='psycTest'
      placeholder='---'
      value={psychologicalAssessment.psycTest}
      onChange={(e) => {
        e.preventDefault();
        setPsychologicalAssessment((prev) => ({
          ...prev, psycTest: e.target.value
        }))
      }}
      />
    </div>
    <div id='standard_input'>
      <label htmlFor="standardRate">Standard Rate</label>
      <input 
      type="number" 
      name='standardRate'
      placeholder='---'
      value={psychologicalAssessment.standardRate}
      onChange={(e) => {
        e.preventDefault();
        setPsychologicalAssessment((prev) => ({
          ...prev, standardRate: e.target.value
        }))
      }}
      />
    </div>
    <button 
       type="button"
       onClick={(e) => {
        e.preventDefault();
        handlePsycTest()}
      }
       >
        {option}
    </button>

    <div className='added_test_wrapper'>
    {psychologicalAssessment.branch && psychologicalAssessment.branch.length > 0 ? (
      <>
        <table>
          <thead>
            <tr>
              <th>Psychological Test</th>
              <th>Standard Rate</th>
              <th style={{backgroundColor: "#00000000"}}></th>
              <th style={{backgroundColor: "#00000000"}}></th>
            </tr>
          </thead>
          <tbody>
            {psychologicalAssessment.branch.map((list) => (
              <tr key={list.psycTest}>
                <td>{list.psycTest}</td>
                <td>{list.standardRate}</td>
                <td className='edit_test_bttn' onClick={() => managePsycTable(list.psycTest, list.standardRate, "edit")}>Edit</td>
                <td className="delete_test_bttn" onClick={() => managePsycTable(list.psycTest, list.standardRate, "delete")}>Delete</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    ): (
      <div style={{
        textAlign: "center",
        margin: "30% 0",
        width: "100%",
        color: "#f7860e",
        fontSize: "1.1rem",
        fontWeight: 500
      }}>
        Empty
      </div>
    )}
    </div>
    </div>
  </div>
  </>
  )
}

const DisplayHybrids = ({hybrid, updateSelectedHybrid, currentId, loading}) => {
  const [displayedHybridInfo, setDisplayedHybridInfo] = useState({
    deleteConfirmation: false,
    currentSelectedId: 0,
    hybridName: '',
    hybrid: ''
  })
  const deleteHybrid = (id, name, type) => {
    setDisplayedHybridInfo((prev) => ({
      ...prev,
      deleteConfirmation: true,
      currentSelectedId: id,
      hybridName: name,
      hybrid: type
    }))
  }

  return (
    <>
    <div id='display_hybrids'>
      {loading ? (<>
        <div class="lds-ellipsis"><div></div><div></div><div></div></div>
        </>) : null
      }
      {displayedHybridInfo.deleteConfirmation ? (<>
      <div className='delete_confirmation'>
        <p>Are you sure you want to delete <span>{displayedHybridInfo.hybridName}</span>?</p>
        <button type="button"
        onClick={(e) => {
          e.preventDefault();
          setDisplayedHybridInfo((i) => ({
            ...i,
            deleteConfirmation: false,
            currentSelectedId: 0
          }))
        }}>Cancel</button>
        <button type="button"
        onClick={(e) => {
          e.preventDefault();
          updateSelectedHybrid(displayedHybridInfo, "delete");
          setDisplayedHybridInfo((i) => ({
            ...i,
            deleteConfirmation: false,
            currentSelectedId: 0
          }))
        }}>Delete</button>
      </div>
      </>) : null}

      {hybrid.receivedData ? 
      hybrid.receivedData.map((prod) => {
        
        if (prod.isDeleted) {
          return;
        }
        if (hybrid.currentView === "all" || hybrid.currentView === prod.hybrid) {
          return (
            <div key={prod.id}
            className='hybrid_info'>
              <div 
              className='hybrid_name'>
                {(prod.name.slice(0, 72))}
                {prod.name.length > 72 ? "..." : ""}
              </div>
              <div 
              className='hybrid_price_range'>
                <p>Price:</p> ₱{prod.price}
              </div>
              {prod.hybrid === 'product' ? (
                <div 
                className='hybrid_quantity'>
                  <p>Quantity:</p> {prod.quantity}
                </div>
              ): null}
              <div className='make_hybrid_changes'>
                <button 
                style={{
                  backgroundColor: currentId === prod.id ? "#35418b": "",
                  color: currentId === prod.id ? "#ebebeb": "",
                  pointerEvents: currentId === prod.id ? "none": ""
                }}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  updateSelectedHybrid(prod, "edit");
                }}
                >
                  {currentId === prod.id ? "Editing..." : "Edit"}
                </button>
                <button 
                style={{
                  pointerEvents: currentId ? "none" : null,
                  backgroundColor: currentId ? "#c96800": null
                }}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  deleteHybrid(prod.id, prod.name, prod.hybrid);
                }}
                >Delete</button>
              </div>
            </div>
          )
        }
      }): !hybrid.receivedData ? (<p className='not-found'>You haven't add new product/service yet</p>) : null}
    </div>
    </>
  )
}

export default Hybrid;