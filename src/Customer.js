import axios from "axios";
import React from "react"; 
import config from "./Config.json";
//uuu
class Customer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            customer: [],
            customerId: JSON.parse(localStorage.getItem('selectedCustomer')) || 0,
            filteredCustomer: [],
            searchQuery: '',
            fName: '',
            lName: '',
            mName: '',
            address: '',
            contactNo: '',
            email: '',
            bDate: '',
            contactPersonName: '',
            contactPersonNo: '',
            company: '',
            companyContactNo: '',
            currentId: 0,
            checkEmail: '',
            checkinput: '',
            option: 'Add',
            userType: JSON.parse(localStorage.getItem("currentUserType")).userType
        }
    }

    componentDidMount() {
        this.getCustomer();
    }

    getCustomer = async () => {
        try {
            const response = await axios.get(`${config.Configuration.database}/customer`);
            this.setState({customer: response.data, filteredCustomer: response.data});
        } catch (error) {
            console.error(error)
        }
    }
      
    handleSearch = (searchQuery) => {
      this.setState({ searchQuery }, () => {
        const { customer, searchQuery } = this.state;
        if (searchQuery.trim() === '') {
          this.setState({ filteredCustomer: customer });
        } else {
          const filtered = customer.filter(
            (cust) =>
            cust.fName.includes(searchQuery.trim()) ||
            cust.lName.includes(searchQuery.trim()) ||
            cust.bDate.includes(searchQuery.trim()) ||
            cust.contactPersonName.includes(searchQuery.trim()) ||
            cust.company.includes(searchQuery.trim()) ||
            cust.email.includes(searchQuery.trim()) 
          );
          this.setState({ filteredCustomer: filtered });
        }
      });
    };

    handleDeleteCustomer = async (cust) => {
      const id = cust.id;
      const currentId = JSON.parse(localStorage.getItem('selectedCustomer')).id;
      console.log(id)
      console.log(currentId)
      try {
        await axios.put(`${config.Configuration.database}/deleteCustomer/${id}`, {
          ...cust,
          isDeleted: true
        });
        if (currentId == id) {
          localStorage.setItem('selectedCustomer', JSON.stringify({}));
        }
        this.getCustomer();
      } catch (error) {
        console.error(error);
      }
    }    

    handleCancel = () => {
      this.setState({option: "Add"})
      const button = document.getElementById("add-bttn");
      button.classList.add("add-bttn");
      this.handleReset();
    }

    handleEditCustomer = (id) => {
      const { customer } = this.state;
      
      const selectedCustomer = customer.find((customer) => customer.id === id);
      
      if (selectedCustomer) {
        const {
          fName,
          lName,
          mName,
          email,
          contactNo,
          address,
          bDate,
          contactPersonName,
          contactPersonNo,
          company,
          companyContactNo,
        } = selectedCustomer;
        
        const button = document.getElementById("add-bttn");
        const scrollTo = document.getElementById("deploy-customer");
    
        if (scrollTo) {
          scrollTo.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
        
        button.classList.remove("add-bttn");
        
        this.setState({
          fName,
          lName,
          mName,
          email,
          contactNo,
          address,
          bDate,
          contactPersonName,
          contactPersonNo,
          company,
          companyContactNo,
          option: "Change",
          currentId: id,
          checkEmail: "",
        });
      }
    };    

    handleSubmit = async () => {
      const {
        fName,
        lName,
        mName,
        email,
        contactNo,
        address,
        bDate,
        contactPersonName,
        contactPersonNo,
        company,
        companyContactNo,
        currentId,
        checkEmail,
        option
      } = this.state;
    
      const id = currentId;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
      if (email.length === 0) {
        this.setState({ checkinput: "Please don't leave blanks" });
      } else if (!emailRegex.test(email)) {
        this.setState({ checkEmail: 'Invalid email' });
        return;
      }
    
      const requiredFields = [
        address,
        contactNo,
        email,
        fName,
        lName,
        mName,
        bDate,
        contactPersonName,
        contactPersonNo,
        companyContactNo,
        company
      ];
    
      if (requiredFields.every((field) => field.length > 0)) {
        this.setState({ checkinput: "" });
    
        if (option === "Add" && checkEmail === "") {
          try {
            await axios.post(`${config.Configuration.database}/customer`, {
              fName,
              lName,
              mName,
              email,
              contactNo,
              address,
              bDate,
              contactPersonName,
              contactPersonNo,
              company,
              companyContactNo
            });
    
            this.getCustomer();
            this.handleReset();
            this.setState({ checkinput: "Client Added!" });
            setTimeout(() => {
              this.setState({ checkinput: "" });
            }, 2000);
          } catch (error) {
            console.error(error);
          }
        } else if (option === "Change" && checkEmail === "") {
          try {
            await axios.put(`${config.Configuration.database}/customer/${id}`, {
              fName,
              lName,
              mName,
              email,
              contactNo,
              address,
              bDate,
              contactPersonName,
              contactPersonNo,
              company,
              companyContactNo
            });
    
            this.getCustomer();
            this.handleReset();
            const button = document.getElementById("add-bttn");
            button.classList.add("add-bttn");
            this.setState({ option: "Add", checkinput: "Change Successful!" });
            setTimeout(() => {
              this.setState({ checkinput: "" });
            }, 2000);
          } catch (error) {
            console.error(error);
          }
        }
      } else {
        this.setState({ checkinput: "Please don't leave blanks" });
        setTimeout(() => {
          this.setState({ checkinput: "" });
        }, 2000);
      }
    };    

    handleReset = () => {
      this.setState({ 
        fName: '', 
        lName: '', 
        mName: '', 
        email: '', 
        contactNo: '', 
        address: '', 
        bDate: '', 
        contactPersonName: '', 
        contactPersonNo: '', 
        company: '', 
        companyContactNo: ''
       })
    }

    handleSelectCustomer = (cust) => {
      const id = cust.id;
      localStorage.setItem('selectedCustomer', JSON.stringify(cust));
      window.location.assign("/Purchase");
    }    

    handleFName = (value) => {
      this.setState({fName: value})
    }
    handleLName = (value) => {
      this.setState({lName: value})
    }
    handleMName = (value) => {
      this.setState({mName: value})
    }
    handleAddress = (value) => {
      this.setState({address: value})
    }
    handleContactNo = (value) => {
      this.setState({contactNo: value})
    }
    handleEmail = (value) => {
      this.setState({ email: value, checkinput: "", checkEmail: "" });
    }
    handleBDate = (value) => {
      this.setState({bDate: value})
    }
    handleCompany = (value) => {
      this.setState({company: value})
    }
    handleCompanyContactNo = (value) => {
      this.setState({companyContactNo: value})
    }
    handleContactPersonName = (value) => {
      this.setState({contactPersonName: value})
    }
    handleContactPersonNo = (value) => {
      this.setState({contactPersonNo: value})
    }

    render() {
        const { filteredCustomer, searchQuery, customerId, fName, lName, mName, address, email, contactNo, company, bDate,
        companyContactNo, contactPersonName, contactPersonNo, checkEmail, checkinput, option, userType} = this.state;

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
                      onChange={(e) => this.handleSearch(e.target.value)}
                      placeholder='Search...'
                    />
                    <i className='bx bx-search search-icon'></i>
                    </div>

                    <div id="deploy-customer" className="add-customer">
                      <div className="input-customer-info">
                        <label htmlFor="fName">First name:</label>
                        <input 
                        type="text" 
                        name="fName" 
                        value={fName} 
                        placeholder="---"
                        onChange={(e) => this.handleFName(e.target.value)}/>
                      </div>
                      <div className="input-customer-info">
                        <label htmlFor="lName">Last name:</label>
                        <input 
                        type="text" 
                        name="lName" 
                        value={lName} 
                        placeholder="---"
                        onChange={(e) => this.handleLName(e.target.value)}/>
                      </div>
                      <div className="input-customer-info">
                        <label htmlFor="mName">Middle name:</label>
                        <input 
                        type="text" 
                        name="mName" 
                        value={mName} 
                        placeholder="---"
                        onChange={(e) => this.handleMName(e.target.value)}/>
                      </div>
                      <div className="input-customer-info input-address">
                        <label htmlFor="address">Address:</label>
                        <input 
                        type="text" 
                        name="address" 
                        value={address} 
                        placeholder="---"
                        onChange={(e) => this.handleAddress(e.target.value)}/>
                      </div>
                      <div className="input-customer-info">
                        <label htmlFor="contactNo">Contact No#:</label>
                        <input 
                        type="text" 
                        name="contactNo" 
                        value={contactNo} 
                        placeholder="###"
                        onChange={(e) => this.handleContactNo(e.target.value)}/>
                      </div>
                      <div className="input-customer-info">
                        <label htmlFor="email">Email: <p className="check-input" style={{color: "#f7860e"}}>{checkEmail ?? checkEmail}</p></label>
                        <input 
                        type="text" 
                        name="email" 
                        value={email} 
                        placeholder="---"
                        onChange={(e) => this.handleEmail(e.target.value)}/>
                      </div>
                      <div className="input-customer-info">
                        <label htmlFor="bDate">Birth Date:</label>
                        <input 
                        type="date" 
                        name="bDate" 
                        value={bDate} 
                        onChange={(e) => this.handleBDate(e.target.value)}/>
                      </div>
                      <div className="input-customer-info">
                        <label htmlFor="contactPersonName">Contact Person Name:</label>
                        <input 
                        type="text" 
                        name="contactPersonName" 
                        value={contactPersonName}
                        placeholder="---"
                        onChange={(e) => this.handleContactPersonName(e.target.value)}/>
                      </div>
                      <div className="input-customer-info">
                        <label htmlFor="contactPersonNo">Contact Person No#:</label>
                        <input 
                        type="text" 
                        name="contactPersonNo" 
                        value={contactPersonNo} 
                        placeholder="###"
                        onChange={(e) => this.handleContactPersonNo(e.target.value)}/>
                      </div>
                      <div className="input-customer-info">
                        <label htmlFor="company">Company:</label>
                        <input 
                        type="text" 
                        name="company" 
                        value={company} 
                        placeholder="---"
                        onChange={(e) => this.handleCompany(e.target.value)}/>
                      </div>
                      <div className="input-customer-info">
                        <label htmlFor="companyContactNo">Company No#:</label>
                        <input 
                        type="text" 
                        name="companyContactNo" 
                        value={companyContactNo} 
                        placeholder="###"
                        onChange={(e) => this.handleCompanyContactNo(e.target.value)}/>
                      </div>
                      <div className="input-customer-info">
                        <label htmlFor="submit" style={{color: '#fc8200', fontWeight: "700"}}>Deploy: <p className="check-input">{checkinput ?? checkinput}</p></label>
                        <div id="buttons">
                        <button 
                        id="add-bttn"
                        className="add-bttn"
                        type="button" 
                        name="submit" 
                        onClick={() => this.handleSubmit()}
                        >
                          {option === "Invalid email" ? "Add" : option }
                        </button>
                        {option === "Change" ? 
                        <button 
                        type="button"
                        name="submit"
                        className="cancel-bttn"
                        onClick={() => this.handleCancel()}
                        >
                          Cancel
                        </button>: null}
                        </div>
                      </div>
                    </div>

                    <table className='customer-table'>
                      <thead className='table-head'>
                        <tr className='customer-column'>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Address</th>
                          <th>Contact Number</th>
                          <th>Email</th>
                          <th>Birth Date</th>
                          <th>Contact Person Name</th>
                          <th>Contact Person No#</th>
                          <th>Company</th>
                          <th>Company Contact No#</th>
                          <th style={{backgroundColor: '#1a1a1a'}}></th>
                          <th style={{backgroundColor: '#1a1a1a'}}></th>
                          <th style={{backgroundColor: '#1a1a1a'}}></th>
                        </tr>
                      </thead>
                      <tbody className='table-body'>
                        {filteredCustomer.map((cust) => {
      
                          if (cust.isDeleted) {
                            return null;
                          }

                          return (
                            <tr className='customer-row' key={cust.id}>
                            <td>{cust.id}</td>
                            <td>{cust.lName}, {cust.fName} {cust.mName}</td>
                            <td>{cust.address}</td>
                            <td>{cust.contactNo}</td>
                            <td>{cust.email}</td>
                            <td>{cust.bDate.slice(0, 10)}</td>
                            <td>{cust.contactPersonName}</td>
                            <td>{cust.contactPersonNo}</td>
                            <td>{cust.company}</td>
                            <td>{cust.companyContactNo}</td>

                            <td className="edit-customer edit-button" 
                            onClick={() => this.handleEditCustomer(cust.id)}>
                            Edit
                            </td>

                            <td className="edit-customer delete-button" 
                            onClick={() => this.handleDeleteCustomer(cust)}>
                            Delete
                            </td>

                            <td
                              className="edit-customer select-button"
                              onClick={() => {
                                this.handleSelectCustomer(cust);
                              }}
                            >
                            {cust.id == customerId.id ? (
                            <div to="/Purchase" className="selected">
                              Selected
                            </div>
                            ) : (
                            <div to="/Purchase" className="unselect">
                              Select
                            </div>
                            )}
                            </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                </div>
            </div>
        );
        } else {
          return (<div>
            You don't have acces to this page.
          </div>);
        } 
    }
}

export default Customer;