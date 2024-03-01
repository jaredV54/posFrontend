import axios from "axios";
import React from "react"; 
import decryptedUserDataFunc from './decrypt';
import config from "./Config.json";

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
            currentUserType: '',
            currentUserPlaceId: 0,
            currentUserId: 0,
            userType: '',
            storeName: '',
            currentId: 0,
            checkEmail: '',
            checkinput: '',
            option: 'Add',
            currentStoreId: 0,
            displayCount: 150,
            loading: false,
            deleteUser: false,
            toBeDelete: [],
            processing: false
        }
    }

    componentDidMount() {
        this.getUser();
        this.getStores();
        this.userInfo()
    }
    
    userInfo = () => {
      const userData = localStorage.getItem('encryptedData');
      
      if (userData) {
        const decryptionKey = 'NxPPaUqg9d';
        const decrypted = JSON.parse(decryptedUserDataFunc(userData, decryptionKey));
        this.setState({
          userType: decrypted.userType,
          currentUserType: decrypted.userType,
          currentUserPlaceId: decrypted.storeId,
          currentUserId: decrypted.userId
        })
      }
    }

    handleExpandClick = () => {
      this.setState((prevState) => ({
        displayCount: prevState.displayCount + 150
      }));
    };  

    getUser = async () => {
        try {
          this.setState({loading: true})
            const response = await axios.get(`${config.Configuration.database}/user`);
            this.setState({user: response.data, filteredUser: response.data});
        } catch (error) {
            console.error(error)
        } finally {
          this.setState({loading: false})
        }
     }

    getStores = async () => {
      try {
          const response = await axios.get(`${config.Configuration.database}/store`);
          this.setState({stores: response.data.result, currentStoreId: response.data.result[0].id});
      } catch (error) {
          console.error(error)
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
        this.setState({deleteUser: false, toBeDelete: [], loading: true})
        await axios.delete(`${config.Configuration.database}/deleteUser/${id}`);
        this.getUser();
      } catch (error) {
        console.error(error);
      } finally {
        this.setState({loading: false})
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
    
      if (selectedCustomer) {
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
        currentStoreId,
        currentUserId
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
        storeName
      ];
      
      const allFieldsValid = requiredFields.every((field) => field && field.length > 0);
       
      if (allFieldsValid) {
        this.removeClass()
        this.setState({ checkinput: "" });
        this.setState({loading: true})
    
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
          } finally {
            this.setState({loading: false})
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

            if (currentUserId === id) {
              localStorage.setItem("currentUserType", JSON.stringify({
                userType: userType,
                storeId: currentStoreId,
                userId: currentUserId
              }));
            }
    
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
          } finally {
            this.setState({loading: false})
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
        userType: "",
        storeName: ""
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
        storeName, displayCount, loading, deleteUser, toBeDelete } = this.state;

        if (currentUserType === 'admin') {
        return (
            <div>
                <div id="customer-info" className="customer-info-container">
                {deleteUser && 
                <div className="delete_confirmation">
                  <p>Are you sure you want to delete user <span>
                    {toBeDelete.name}
                    </span></p>
                  <button type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    this.setState({deleteUser: false, toBeDelete: []})
                  }}>
                    Cancel
                  </button>
                  <button type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    this.handleDeleteUser(toBeDelete.id)
                  }}>
                    Delete
                  </button>
                </div>}

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
                        placeholder="---"
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
                      <label htmlFor="storeName">Place: </label>
                      <input 
                      name="storeName" 
                      placeholder={'---'}
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

                    <table className='customer-table' style={{width: "100%"}}>
                    {loading ? (<>
                    <div style={{top: "100%"}} class="lds-ellipsis"><div></div><div></div><div></div></div>
                    </>) : null
                    }
                      <thead className='table-head'>
                        <tr className='customer-column'>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Password</th>
                          <th>User Type</th>
                          <th>Place</th>
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
                            <td>{cust.storeName}</td>

                            <td className="edit-customer edit-button" 
                            onClick={() => this.handleEditUser(cust.id)}>
                            Edit
                            </td>

                            <td className="edit-customer delete-button" 
                            onClick={(e) => {
                              e.preventDefault();
                             this.setState({deleteUser: true, toBeDelete: cust})
                            }}>
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