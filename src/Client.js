import axios from "axios";
import React, {useState, useEffect} from "react"; 
import config from "./Config.json";

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
        remarks: '',
        sourceOfReferral: '',
        providers: '',
        caseNumber: ''
    };

    const [fieldInfo, setFieldInfo] = useState({
      loading: false
    })

    const [clientFilter, setClientFilter] = useState(initialClient);

    const [clientData, setClientData] = useState({
        client: [],
        currentId: 0,
        filteredClient: [],
        searchQuery: "",
        storedClientId: JSON.parse(localStorage.getItem('selectedCustomer')) || 0
    })

    const [inputs, confirmInputs] = useState({
        checkInput: '',
        option: 'Add',
    })

    const [displayCount, setDisplayCount] = useState(150);

    const handleExpandClick = () => {
      setDisplayCount((prev) => prev + 150);
    }

    const storedUserData = localStorage.getItem("currentUserType");
    const userType = storedUserData ? JSON.parse(storedUserData).userType : undefined;

    const getClients = async () => {
        try {
            setFieldInfo((prev) => ({...prev, loading: true }))
            const response = await axios.get(`${config.Configuration.database}/customer`);
            setClientData((d) => ({...d, client: response.data, filteredClient: response.data}));
        } catch (error) {
            console.error(error)
        } finally {
            setFieldInfo((prev) => ({...prev, loading: false }))
        }
    }

    useEffect(() => {
        getClients();
    }, []);

    const handleSearch = (value) => {
        setClientData((data) => ({...data, searchQuery: value}))
        if (value.trim() === '') {
            setClientData((data) => ({ ...data, filteredClient: data.client }));
        } else {
            const filtered = clientData.client.filter(
                (client) => 
                client.fName.toLowerCase().includes(value.trim()) ||
                client.lName.toLowerCase().includes(value.trim()) ||
                client.bDate.toLowerCase().includes(value.trim()) ||
                client.contactPersonName.toLowerCase().includes(value.trim()) ||
                client.company.toLowerCase().includes(value.trim()) ||
                client.email.toLowerCase().includes(value.trim()) 
            );
            setClientData((data) => ({...data, filteredClient: filtered}))
        }
    };

    const handleDeleteCustomer = async (client) => {
        const id = client.id;
        const { storedClientId } = clientData;
        try {
            await axios.put(`${config.Configuration.database}/deleteCustomer/${id}`, {
                isDeleted: true
            });
            if (storedClientId.id === id) {
                localStorage.setItem('selectedCustomer', JSON.stringify({}));
            }
    
            getClients();
        } catch (error) {
            console.error(error);
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
        const { email } = clientFilter;
        const { option } = inputs;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email) && email !== "N/A") {
          confirmInputs((prev) => ({
            ...prev,
            checkInput: "Invalid email"
          }));
          setTimeout(() => {
            confirmInputs((prev) => ({
                ...prev,
                checkInput: ""
              }))
          }, 2000);
          return;
        }

        const requiredFields = Object.values(clientFilter);
      
        if (requiredFields.every((field) => field.length > 0)) {
            confirmInputs((prev) => ({
                ...prev,
                checkInput: ""
            }))
          if (option === "Add") {
            try {
              await axios.post(`${config.Configuration.database}/customer`, clientFilter);
              getClients();
              handleReset();
              confirmInputs((prev) => ({
                ...prev,
                checkInput: "New Client Added!"
              }))
              setTimeout(() => {
                confirmInputs((prev) => ({
                    ...prev,
                    checkInput: ""
                  }))
              }, 2000);
            } catch (error) {
              console.error(error);
            }
          } else if (option === "Change") {
            try {
              await axios.put(`${config.Configuration.database}/customer/${currentId}`, clientFilter);
              getClients();
              handleReset();
              const button = document.getElementById("add-bttn");
              button.classList.add("add-bttn");
              confirmInputs((prev) => ({
                ...prev,
                option: "Add",
                checkInput: "Client Updated!"
              }))
              setTimeout(() => {
                confirmInputs((prev) => ({
                    ...prev,
                    checkInput: ""
                  }))
              }, 2000);
            } catch (error) {
              console.error(error);
            }
          }
        } else {
            confirmInputs((prev) => ({
                ...prev,
                checkInput: "Please fill the blanks"
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

    const handleSelectCustomer = (client, isSelected) => {
        if (isSelected) {
            return;
        }
        localStorage.setItem('selectedCustomer', JSON.stringify(client));
        window.location.assign("/Purchase");
    } 

    const handleClientFilter = (value, name) => {
        setClientFilter((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const clientFilterToRender = Object.keys(clientFilter);
    const labels = [
        "First Name: ",
        "Last Name: ",
        "Middle Name: ",
        "Address: ",
        "Contact No: ",
        "Email: ",
        "Birth Day: ",
        "Contact Person Name: ",
        "Contact Person No: ",
        "Remarks: ",
        "Source of Referral: ",
        "Providers: ",
        "Case Number: "
    ];
    const { filteredClient, storedClientId, searchQuery } = clientData;
    const { checkInput, option } = inputs;
    const clientKeys = [
        "Id",
        "Client_Name",
        "Address",
        "Contact_No",
        "Email",
        "Birth_Day",
        "Contact Person Name",
        "Contact Person No",
        "Remarks",
        "Source_of_Referral",
        "Providers",
        "Case_Number"
    ];

    if (userType !== undefined) {
        return (
            <div>
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
                
                <div id="deploy-customer" className="add-customer">
                {clientFilterToRender.map((key, index) => (
                    <div className="input-customer-info" key={key}>
                        <label htmlFor={key}>{labels[index]}</label>
                        {key === 'bDate' ? (
                            <input
                                type="date"
                                name={key}
                                value={clientFilter[key]}
                                onChange={(e) => handleClientFilter(e.target.value, e.target.name)}
                            />
                        ): key === 'remarks' ? (
                          <textarea
                          type="text"
                          name={key}
                          placeholder="---"
                          value={clientFilter[key]}
                          onChange={(e) => handleClientFilter(e.target.value, e.target.name)}
                          />
                        ) : (
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
                        <label htmlFor="submit" style={{color: '#fc8200', fontWeight: "700"}}>Deploy: <p className="check-input">{checkInput ?? checkInput}</p></label>
                        <div id="buttons">
                        <button 
                        id="add-bttn"
                        className="add-bttn"
                        type="button" 
                        name="submit" 
                        onClick={() => handleSubmit()}
                        >
                          {option === "Invalid email" ? "Add" : option }
                        </button>
                        {option === "Change" ? 
                        <button 
                        type="button"
                        name="submit"
                        className="cancel-bttn"
                        onClick={() => handleCancel()}
                        >
                          Cancel
                        </button>: null}
                        </div>
                      </div>
                </div>

                <table className='customer-table'>
                {fieldInfo.loading ? (<>
                  <div style={{top: "100%"}} class="lds-ellipsis"><div></div><div></div><div></div></div>
                  </>) : null
                }
                    <thead className='table-head'>
                    <tr className="customer-table">
                    <th style={{backgroundColor: '#1a1a1a'}}></th>
                    <th style={{backgroundColor: '#1a1a1a'}}></th>
                    <th style={{backgroundColor: '#1a1a1a'}}></th>
                    {clientKeys.map((key) => (
                        <th key={key}>{key}</th>
                    ))}
                    </tr>
                    </thead>
                    <tbody className='table-body'>
                        {filteredClient.slice(0, displayCount).map((cust) => {
                            if (cust.isDeleted) {
                                return null;
                            }
                    
                            return (
                                <tr className='customer-row' key={cust.id}>
                                <td className="edit-customer edit-button" 
                                onClick={() => handleEditCustomer(cust.id, cust.id === storedClientId.id)}>
                                Edit
                                </td>
    
                                <td className="edit-customer delete-button" 
                                onClick={() => handleDeleteCustomer(cust)}>
                                Delete
                                </td>
    
                                <td
                                  className="edit-customer select-button"
                                  onClick={() => {
                                    handleSelectCustomer(cust, cust.id === storedClientId.id);
                                  }}
                                >
                                {cust.id == storedClientId.id ? (
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
                                <td>{cust.email}</td>
                                <td>{cust.bDate.slice(0, 10)}</td>
                                <td>{cust.contactPersonName}</td>
                                <td>{cust.contactPersonNo}</td>
                                <td>{cust.remarks}</td>
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
                          <td id='expand' onClick={handleExpandClick}>Expand</td>
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

export default Client