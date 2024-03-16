import axios from "axios";
import React, {useState, useEffect, useRef} from "react"; 
import config from "./Config.json";
import decryptedUserDataFunc from './decrypt';
import CryptoJS from 'crypto-js';

const Client = () => {
    const initialClient = {
        fName: '',
        lName: '',
        mName: '',
        address: '',
        contactNo: '',
        email: '',
        bDate: '',
        contactPersonName: '',
        contactPersonNo: '',
        service: '',
        remarks: '',
        sourceOfReferral: '',
        providers: '',
        caseNumber: ''
    };

    const [fieldInfo, setFieldInfo] = useState({
      loading: false,
      delete: false,
      toBeDelete: null,
      message: "",
      warn: "",
      isSuccessful: "",
      fetchingData: true
    })

    const [clientFilter, setClientFilter] = useState(initialClient);

    const [clientData, setClientData] = useState({
        client: [],
        currentId: 0,
        filteredClient: [],
        searchQuery: "",
        storedClientId: 0
    })

    const [inputs, confirmInputs] = useState({
        checkInput: '',
        option: 'Add',
    })

    const [displayCount, setDisplayCount] = useState(250);

    const handleExpandClick = () => {
      setDisplayCount((prev) => prev + 250);
    }

    const [decryptedUserData, setDecryptUserData] = useState({});
    const {userType} = decryptedUserData;

    useEffect(() => {
      const userData = localStorage.getItem('encryptedData');
      const selectedClientData = localStorage.getItem('clientSelection');
    
      if (userData) {
        const decryptionKey = 'NxPPaUqg9d';
        const decrypted = JSON.parse(decryptedUserDataFunc(userData, decryptionKey));
        setDecryptUserData(decrypted);
      }
      if (selectedClientData) {
        const decryptionKey = 'hEv1ZSXzm1';
        const decrypted = JSON.parse(decryptedUserDataFunc(selectedClientData, decryptionKey));
        setClientData(prev => ({...prev, storedClientId: decrypted.id}));
      }
    }, []);  

    const getClients = async () => {
        try {
            setFieldInfo((prev) => ({...prev, fetchingData: true }))
            const response = await axios.get(`${config.Configuration.database}/customer`, {
              params: {
                displayCount: displayCount
              }
            });
            if (response.data.isSuccessful) {
              setClientData((d) => ({...d, client: response.data.result, filteredClient: response.data.result}));
            } else {
              setFieldInfo((prev) => ({...prev, warn: response.data.message}))
            }
        } catch (error) {
          if (error.response) {
            console.log(error.response.data.message)
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
            setFieldInfo((prev) => ({
              ...prev,
              warn: error.message
            }))
          }
        } finally {
            setFieldInfo((prev) => ({...prev, fetchingData: false }))
        }
    }

    useEffect(() => {
        getClients();
    }, [displayCount]);

    const handleSearch = (input) => {
      const value = input.toLowerCase();
        setClientData((data) => ({...data, searchQuery: value}))
        if (value.trim() === '') {
            setClientData((data) => ({ ...data, filteredClient: data.client }));
        } else {
            const filtered = clientData.client.filter(
                (client) => 
                client.fName.toLowerCase().includes(value.trim()) ||
                client.lName.toLowerCase().includes(value.trim()) ||
                client.id === parseFloat(value) ||
                client.email.toLowerCase().includes(value.trim()) 
            );
            setClientData((data) => ({...data, filteredClient: filtered}))
        }
    };

    const handleDeleteCustomer = async (client) => {
        const id = client.id;
        const { storedClientId } = clientData;
        try {
            setFieldInfo((prev) => ({...prev, loading: true }))
            const response = await axios.put(`${config.Configuration.database}/deleteCustomer/${id}`, {
                isDeleted: true
            });
            if (storedClientId.id === id) {
                localStorage.setItem('selectedCustomer', JSON.stringify({}));
            }
            if (response.data.isSuccessful) {
              handleReset()
              setFieldInfo((prev) => ({
                ...prev,
                delete: false,
                toBeDelete: null,
                isSuccessful: response.data.message
              }))
              getClients();
            }
        } catch (error) {
          if (error.response) {
            setFieldInfo(prev => ({
              ...prev,
              warn: error.response.data.message
            }));
          } else if (error.request) {
            setFieldInfo((prev) => ({
              ...prev,
              warn: "No response from server. Please check your internet."
            }))
          } else {
            setFieldInfo((prev) => ({
              ...prev,
              warn: error.message
            }))
          }
        } finally {
          setFieldInfo((prev) => ({...prev, loading: false }))
        }
    }
      
    const handleCancel = () => {
        confirmInputs((input) => ({...input, option: "Add"}))
        const button = document.getElementById("add-bttn");
        button.classList.add("add-bttn");
        handleReset();
    }

    const handleEditCustomer = (id, isAlreadySelected) => {
        const { client } = clientData;
        const selectedCustomer = client.find((c) => c.id === id);

        if (isAlreadySelected) {
          localStorage.setItem('selectedCustomer', JSON.stringify({}));
        } 

        if (selectedCustomer) {
          const { id, isDeleted, ...newObject } = selectedCustomer;
          const button = document.getElementById("add-bttn");
          button.classList.remove("add-bttn");
          
          setClientFilter((prev) => ({
            ...prev,
            ...newObject,
          }));
          
          confirmInputs((prev) => ({
            ...prev,
            option: 'Change'
          }));

          setClientData((prev) => ({
            ...prev,
            currentId: id,
            storedClientId: {}
          }));
        }
    }

    const handleSubmit = async () => {
        const { currentId } = clientData;
        const { option } = inputs;
        const { mName, email, contactPersonName, contactPersonNo, service, remarks, bDate, ...necessaryInfo } = clientFilter;
        const requiredFields = Object.values(necessaryInfo);
      
        if (requiredFields.every((field) => field !== "")) {
            confirmInputs((prev) => ({
                ...prev,
                checkInput: ""
            }));
          if (option === "Add") {
            try {
              setFieldInfo((prev) => ({...prev, loading: true}));
              const response = await axios.post(`${config.Configuration.database}/customer`, clientFilter);
              getClients();
              handleReset();
              if (response.data.isSuccessful) {
                setFieldInfo((prev) => ({...prev, isSuccessful: response.data.message}));
              }
            } catch (error) {
              if (error.response) {
                console.log(error.response.data.message)
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
                setFieldInfo((prev) => ({
                  ...prev,
                  warn: error.message
                }))
              }
            } finally {
              setFieldInfo((prev) => ({...prev, loading: false}));
            }
          } else if (option === "Change") {
            try {
              setFieldInfo((prev) => ({...prev, loading: true}));
              const response = await axios.put(`${config.Configuration.database}/customer/${currentId}`, clientFilter);
              getClients();
              handleReset();
              if (response.data.isSuccessful) {
                setFieldInfo((prev) => ({...prev, isSuccessful: "Client info changed successfully!"}));
              }
              confirmInputs((prev) => ({
                ...prev,
                option: "Add"
              }))
              const button = document.getElementById("add-bttn");
              button.classList.add("add-bttn");
            } catch (error) {
              if (error.response) {
                console.log(error.response.data.message)
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
                setFieldInfo((prev) => ({
                  ...prev,
                  warn: error.message
                }))
              }
            } finally {
              setFieldInfo((prev) => ({...prev, loading: false}));
            }
          }
        } else {
            confirmInputs((prev) => ({
                ...prev,
                checkInput: "Necessary info required"
            }));
            setTimeout(() => {
                confirmInputs((prev) => ({
                    ...prev,
                    checkInput: ""
                }));
            }, 2000);
        }
    }; 

    const handleReset = () => {
        setClientFilter(initialClient);
    }

    const handleSelectCustomer = (client) => {
      const clientData = JSON.stringify(client);
      const encryptionKey = 'hEv1ZSXzm1';
  
      const encrypted = encryptData(clientData, encryptionKey);
      localStorage.setItem('clientSelection', encrypted);
      window.location.assign("/Purchase");
    } 

    const encryptData = (data, key) => {
      return CryptoJS.AES.encrypt(data, key).toString();
    };

    const handleClientFilter = (value, name) => {
        setClientFilter((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const clientFilterToRender = Object.keys(clientFilter);
    const labels = [
        "First Name*",
        "Last Name*",
        "Middle Name",
        "Address*",
        "Contact No*",
        "Email",
        "Birth Day",
        "Contact Person Name",
        "Contact Person No",
        "Service",
        "Remarks",
        "Source of Referral*",
        "Providers*",
        "Case Number*"
    ];
    const { filteredClient, storedClientId, searchQuery } = clientData;
    const { checkInput, option } = inputs;
    const clientKeys = [
        "Id",
        "Client_Name",
        "Residential_Address",
        "Contact No",
        "Email",
        "Birth_Day",
        "Contact Person Name",
        "Contact Person No",
        "Service",
        "Remarks",
        "Source of Referral",
        "Providers",
        "Case_Number"
    ];

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
              {fieldInfo.loading ? (<span className="loader"></span>) : null}
              <div className="field_message" ref={fieldMessageRef}>
                {fieldInfo.message}
              </div>
              <div className="field_warn" ref={fieldWarnRef}>
                {fieldInfo.warn}
              </div>
              <div className="field_is_successful" ref={fieldIsSuccessfulRef}>
                {fieldInfo.isSuccessful}
              </div>
                <div id="customer-info" className="customer-info-container">
                <h1>Client</h1>
                <div className='search-form'>
                <input
                  className='search-bar'
                  type='text'
                  name='search-bar'
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder='Search...'
                />
                <i className='bx bx-search search-icon'></i>
                </div>

                {fieldInfo.delete && 
                <div className="delete_confirmation">
                  <p>Are you sure you want to delete <span>
                    {fieldInfo.toBeDelete.fName + " " + fieldInfo.toBeDelete.mName + " "  + fieldInfo.toBeDelete.lName}
                    </span></p>
                  <button type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setFieldInfo((prev) => ({
                      ...prev,
                      delete: false,
                      toBeDelete: null
                    }))
                  }}>
                    Cancel
                  </button>
                  <button type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteCustomer(fieldInfo.toBeDelete)
                  }}>
                    Delete
                  </button>
                </div>}
                
                <div id="deploy-customer" className="add-customer">
                {clientFilterToRender.map((key, index) => (
                    <div 
                    className="input-customer-info" 
                    key={key}>
                        <label 
                        htmlFor={key}>
                          {labels[index]}</label>
                        {key === 'bDate' ? (
                            <input
                              type="date"
                              name={key}
                              value={clientFilter[key]}
                              onChange={(e) => handleClientFilter(e.target.value, e.target.name)}
                            />
                        ): (
                            <input
                              type="text"
                              name={key}
                              value={clientFilter[key]}
                              placeholder="---"
                              onChange={(e) => handleClientFilter(e.target.value, e.target.name)}
                            />
                        )}
                    </div>
                ))}

                  <div className="input-customer-info">
                        <label htmlFor="submit" style={{color: '#fc8200', fontWeight: "700"}}>Action: <p className="check-input">{checkInput ?? checkInput}</p></label>
                        <div id="buttons">
                        <button 
                        id="add-bttn"
                        className="add-bttn"
                        type="button" 
                        name="submit" 
                        onClick={() => {
                          handleSubmit()
                          setClientData(prev => ({...prev, currentId: 0}))}}
                        >
                          {option === "Invalid email" ? "Add" : option }
                        </button>
                        {option === "Change" ? 
                        <button 
                        type="button"
                        name="submit"
                        className="cancel-bttn"
                        onClick={() => {
                          handleCancel();
                          setClientData(prev => ({...prev, currentId: 0}))
                        }}
                        >
                          Cancel
                        </button>: null}
                        </div>
                  </div>
                </div>

                <table className='customer-table'>
                {fieldInfo.fetchingData ? (<>
                  <div style={{top: "130px"}} class="lds-ellipsis"><div></div><div></div><div></div></div>
                  </>) : null
                }
                    <thead className='table-head'>
                    <tr className="customer-table">
                    <th style={{backgroundColor: '#1a1a1a00', zIndex: -1}}></th>
                    <th style={{backgroundColor: '#1a1a1a00', zIndex: -1}}></th>
                    <th style={{backgroundColor: '#1a1a1a00', zIndex: -1}}></th>
                    {clientKeys.map((key) => (
                        <th key={key}>{key}</th>
                    ))}
                    </tr>
                    </thead>

                    <tbody className='table-body'>
                        {filteredClient.slice(0, displayCount).map((cust) => {
                            return (
                                <tr className='customer-row' key={cust.id}>
                                <td className="edit-customer edit-button" 
                                style={clientData.currentId === cust.id ? {
                                  backgroundColor: "#6878e0"
                                }: null}
                                onClick={() => handleEditCustomer(cust.id, cust.id === storedClientId.id)}>
                                {clientData.currentId === cust.id ? "Editing" : "Edit"}
                                </td>
    
                                <td className="edit-customer delete-button" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setFieldInfo((prev) => ({
                                    ...prev,
                                    delete: true,
                                    toBeDelete: cust
                                  }))
                                }}>
                                Delete
                                </td>
    
                                <td
                                  className="edit-customer select-button"
                                  onClick={() => {
                                    handleSelectCustomer(cust);
                                  }}
                                >
                                {cust.id == storedClientId ? (
                                <div to="/Purchase" className="selected">
                                  Selected
                                </div>
                                ) : (
                                <div to="/Purchase" className="unselect">
                                  Select
                                </div>
                                )}
                                </td>
                                <td>{cust.id}</td>
                                <td>{cust.lName}, {cust.fName} {cust.mName}</td>
                                <td>{cust.address}</td>
                                <td>{cust.contactNo}</td>
                                <td>{cust.email ? cust.email : "N/A"}</td>
                                <td>{cust.bDate ? cust.bDate.slice(0, 10) : "N/A"}</td>
                                <td>{cust.contactPersonName ? cust.contactPersonName : "N/A"}</td>
                                <td>{cust.contactPersonNo ? cust.contactPersonNo : "N/A"}</td>
                                <td>{cust.service ? cust.service : "N/A"}</td>
                                <td>{cust.remarks? cust.remarks : "N/A"}</td>
                                <td>{cust.sourceOfReferral}</td>
                                <td>{cust.providers}</td>
                                <td>{cust.caseNumber}</td>
                              </tr>
                              )
                        })}
                        {filteredClient.length >= displayCount ? (
                          <tr>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td id='expand' onClick={handleExpandClick}
                          style={{padding: "5px"}}>Expand</td>
                        </tr>
                        ): null}
                    </tbody>
                </table>
                </div>
            </div>
        );
        } else {
          return (
          <div>
            You don't have acces to this page.
          </div>
          );
        } 
}

export default Client;