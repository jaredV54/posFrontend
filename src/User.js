import axios from "axios";
import React from "react"; 
import config from "./Config.json"

class User extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user: [],
            filteredUser: [],
            stores: [],
            searchQuery: '',
            name: '',
            email: '',
            password: '',
            currentUserType: JSON.parse(localStorage.getItem("currentUserType")).userType,
            userType: '',
            storeName: '',
            currentId: 0,
            checkEmail: '',
            checkinput: '',
            option: 'Add',
            currentStoreId: 0,
            displayCount: 150
        }
    }

    componentDidMount() {
        this.getUser();
        this.getStores();
        this.handleAdminClass();
    }

    handleExpandClick = () => {
      this.setState((prevState) => ({
        displayCount: prevState.displayCount + 150
      }));
    };  

    getUser = async () => {
        try {
            const response = await axios.get(`${config.Configuration.database}/user`);
            this.setState({user: response.data, filteredUser: response.data});
        } catch (error) {
            console.error(error)
        }
     }

    getStores = async () => {
      try {
          const response = await axios.get(`${config.Configuration.database}/store`);
          this.setState({stores: response.data, currentStoreId: response.data[0].id});
      } catch (error) {
          console.error(error)
      }
  }

  
  componentDidUpdate(prevProps, prevState) {
    if (this.state.userType !== prevState.userType) {
      this.handleAdminClass();
    }
  }
  /*
  handleAdminClass() {
    const { userType } = this.state;
    const storeNameElement = this.storeNameRef.current;

    if (userType === 'admin' && storeNameElement) {
      storeNameElement.classList.add('isAdmin');
      this.setState({ storeName: "" });
    } else if (storeNameElement) {
      storeNameElement.classList.remove('isAdmin');
    }
  }
  */

  handleAdminClass() {
    const { userType } = this.state;
    const storeNameElement = document.getElementById('store-name');

    if (userType === 'admin' && storeNameElement) {
      storeNameElement.classList.add('isAdmin');
      this.setState({ storeName: "" });
    } else if (storeNameElement) {
      storeNameElement.classList.remove('isAdmin');
    }
  }
      
    handleSearch = (searchQuery) => {
      this.setState({ searchQuery }, () => {
        const { user, searchQuery } = this.state;
        if (searchQuery.trim() === '') {
          this.setState({ filteredUser: user });
        } else {
          const filtered = user.filter(
            (user) =>
            user.name.toLowerCase().includes(searchQuery.trim()) ||
            user.email.toLowerCase().includes(searchQuery.trim()) ||
            user.userType.toLowerCase().includes(searchQuery.trim())
          );
          this.setState({ filteredUser: filtered });
        }
      });
    };

    handleDeleteUser = async (id) => {
      this.removeClass()
      try {
        await axios.delete(`${config.Configuration.database}/deleteUser/${id}`);
        this.getUser();
      } catch (error) {
        console.error(error);
      }
    }    

    handleCancel = () => {
      this.removeClass()
      this.setState({option: "Add"})
      const button = document.getElementById("add-bttn");
      button.classList.add("add-bttn");
      this.handleReset();
    }

    handleEditUser = (id) => {
      this.removeClass()
      const { user } = this.state;
      const selectedCustomer = user.find((user) => user.id === id);
      const isAdmin = user.find((user) => user.id === id && user.userType === 'admin');
    
      if (isAdmin) {
        this.setState({
          name: isAdmin.name,
          email: isAdmin.email,
          password: isAdmin.password,
          userType: isAdmin.userType,
          option: "Change",
          currentId: id,
          checkEmail: "",
          storeName: ""
        });
      } else if (selectedCustomer) {
        const {
          name,
          email,
          password,
          userType,
          storeName
        } = selectedCustomer;
    
        this.setState({
          name,
          email,
          password,
          userType,
          option: "Change",
          currentId: id,
          checkEmail: "",
          storeName
        });
    
        const button = document.getElementById("add-bttn");
        const scrollTo = document.getElementById("deploy-user");
    
        if (scrollTo) {
          scrollTo.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
    
        button.classList.remove("add-bttn");
      }
    };
        

    handleSubmit = async () => {
      const {
        name,
        email,
        password,
        userType,
        currentId,
        checkEmail,
        option,
        storeName,
        currentStoreId
      } = this.state;
    
      const id = currentId;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
      if (email.length === 0) {
        this.setState({ checkinput: "Please fill all fields" });
      } else if (!emailRegex.test(email)) {
        this.setState({ checkEmail: 'Invalid email' });
        return;
      }
    
      const requiredFields = [
        name,
        email,
        password,
        userType,
        ...(userType === 'admin' ? [] : [storeName])
      ];
      
      const allFieldsValid = requiredFields.every((field) => field && field.length > 0);
       
      if (allFieldsValid) {
        this.removeClass()
        this.setState({ checkinput: "" });
    
        if (option === "Add" && checkEmail === "") {
          try {
            await axios.post(`${config.Configuration.database}/user`, {
            name,
            email,
            password,
            userType,
            storeId: currentStoreId
            });
    
            this.getUser();
            this.handleReset();
            this.setState({ checkinput: "User Added!" });
            setTimeout(() => {
              this.setState({ checkinput: "" });
            }, 2000);
          } catch (error) {
            console.error(error);
          }
        } else if (option === "Change" && checkEmail === "") {
          try {
            await axios.put(`${config.Configuration.database}/user/${id}`, {
              name,
              email,
              password,
              userType,
              storeId: currentStoreId
            });
    
            this.getUser();
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
        this.setState({ checkinput: "Please fill all fields" });
        setTimeout(() => {
          this.setState({ checkinput: "" });
        }, 2000);
      }
    };    

    handleReset = () => {
      this.setState({ 
        name: "",
        email: "",
        password: "",
        userType: "admin"
       })
    }   

    removeClass = () => {
      const selectUser = document.getElementById('user-type-select');
      const selectStore = document.getElementById('store-name-select');
      if (selectUser || selectStore) {
        selectUser.classList.remove('option');
        selectStore.classList.remove('option');
      }
    }

    handleName = (value) => {
      this.setState({name: value})
    }
    handleEmail = (value) => {
      this.setState({email: value})
    }
    handlePassword = (value) => {
      this.setState({password: value})
    }
    handleUserType = (value) => {
      this.setState({userType: value})
    }
    handleStoreName = (strName, id) => {
      this.setState({storeName: strName, currentStoreId: id})
    }

    handleSelectUserType = () => {
      const select = document.getElementById('user-type-select');
      if (select) {
        select.classList.toggle('option');
      }
    }

    handleSelectStore = () => {
      const select = document.getElementById('store-name-select');
      if (select) {
        select.classList.toggle('option');
      }
    }

    render() {
        const {  filteredUser, searchQuery, name, email, password, currentUserType,userType, checkEmail, checkinput, option, stores,
        storeName, displayCount } = this.state;

        if (currentUserType === 'admin') {
        return (
            <div>
                <div id="customer-info" className="customer-info-container">
                    <h1>User</h1>
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

                    <div id="deploy-user" className="add-customer">
                      <div className="input-customer-info">
                        <label htmlFor="name">First name:</label>
                        <input 
                        type="text" 
                        name="name" 
                        value={name} 
                        placeholder="---"
                        onChange={(e) => this.handleName(e.target.value)}/>
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
                        <label htmlFor="password">Password: </label>
                        <input 
                        type="text" 
                        name="password" 
                        value={password} 
                        placeholder="---"
                        onChange={(e) => this.handlePassword(e.target.value)}/>
                      </div>
                      <div className="input-customer-info">
                        <label htmlFor="userType">User Type: </label>
                        <input 
                        name="userType" 
                        defaultValue={userType.charAt(0).toUpperCase() + userType.slice(1)} 
                        style={{pointerEvents: "none"}}/>
                        <i className='bx bx-chevron-down' onClick={() => this.handleSelectUserType()}></i>

                        <div id="user-type-select" className="option-close">
                          <span onClick={() => {
                            this.handleUserType('admin');
                            this.handleSelectUserType();
                          }}>Admin</span>
                          <span onClick={() => {
                            this.handleUserType('manager');
                            this.handleSelectUserType();
                          }}>Manager</span>
                          <span onClick={() => {
                            this.handleUserType('user');
                            this.handleSelectUserType();
                          }}>User</span>
                        </div>
                      </div>
                      <div className="input-customer-info">
                      <label htmlFor="storeName">Store: </label>
                      <input 
                      name="storeName" 
                      placeholder={userType === 'admin' ? 'N/A' : '---'}
                      defaultValue={storeName} 
                      style={{
                        pointerEvents: "none",
                        cursor: "pointer"
                      }}/>
                      <i 
                      ref={this.storeNameRef}
                      id="store-name"
                      className='bx bx-chevron-down' 
                      onClick={() => this.handleSelectStore()}></i>
                        <div id="store-name-select" className="option-close">
                          {stores.map((store) => {
                            return (
                              <span key={store.id} onClick={() => {
                                this.handleStoreName(store.storeName, store.id);
                                this.handleSelectStore();
                              }}>{store.storeName}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                      <div className="input-customer-info">
                        <label htmlFor="submit" style={{color: '#fc8200', fontWeight: "700"}}>
                          Deploy: <p className="check-input">{checkinput ?? checkinput}</p></label>
                        <div id="buttons">
                        <button 
                        id="add-bttn"
                        className="add-bttn"
                        type="button" 
                        name="submit" 
                        onClick={() => {
                          this.handleSubmit();
                        }}
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
                          <th>Email</th>
                          <th>Password</th>
                          <th>User Type</th>
                          <th>Store</th>
                          <th style={{backgroundColor: '#1a1a1a'}}></th>
                          <th style={{backgroundColor: '#1a1a1a'}}></th>
                        </tr>
                      </thead>
                      <tbody className='table-body'>
                        {filteredUser.slice(0, displayCount).map((cust) => {
      
                          if (cust.isDeleted) {
                            return null;
                          }

                          return (
                            <tr className='customer-row' key={cust.id}>
                            <td>{cust.id}</td>
                            <td>{cust.name}</td>
                            <td>{cust.email}</td>
                            <td>{cust.password}</td>
                            <td>{cust.userType}</td>
                            <td>{cust.userType === 'admin' ? "---": cust.storeName}</td>

                            <td className="edit-customer edit-button" 
                            onClick={() => this.handleEditUser(cust.id)}>
                            Edit
                            </td>

                            <td className="edit-customer delete-button" 
                            onClick={() => this.handleDeleteUser(cust.id)}>
                            Delete
                            </td>
                          </tr>
                          )
                        })}
                        {filteredUser.length >= displayCount ? (
                         <tr>
                         <td></td>
                         <td></td>
                         <td></td>
                         <td></td>
                         <td></td>
                         <td></td>
                         <td></td>
                         <td id='expand' onClick={this.handleExpandClick}>Expand</td>
                       </tr>
                       ): null}
                      </tbody>
                    </table>
                </div>
            </div>
        )
        } else {
          (<div style={{padding: 8}}>
            You are not allowed to access this page.
          </div>)
        }
    }
}

export default User;