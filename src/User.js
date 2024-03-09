import axios from "axios";
import React from "react"; 
import decryptedUserDataFunc from './decrypt';
import config from "./Config.json";
import { encryptData } from "./decrypt";

export let userLenght = 0

class User extends React.Component {
    constructor(props) {
        super(props);
        this.fieldMessageRef = React.createRef();
        this.fieldWarnRef = React.createRef();
        this.fieldIsSuccessfulRef = React.createRef();
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
            warn: '',
            message: '',
            isSuccessful: '',
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
        this.userInfo();
        this.fieldInfoMessage();
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
            if (response.data.length > 0) {
              this.setState({user: response.data, filteredUser: response.data});
            }
        } catch (error) {
          if (error.response) {
            this.setState({
              warn: "Internal error: status 500"
            })
          } else if (error.request) {
            this.setState({
              warn: "Network issue. Please try again later."
            });
          } else {
            this.setState({
              warn: error.message
            })
          } 
        } finally {
          this.setState({loading: false})
        }
     }

    getStores = async () => {
      try {
          const response = await axios.get(`${config.Configuration.database}/store`);
          this.setState({stores: response.data.result, currentStoreId: response.data.result[0].id});
      } catch (error) {
        if (error.response) {
          this.setState({
            warn: error.response.data.message
          })
        } else if (error.request) {
          this.setState({
            warn: "Network issue. Please try again later."
          });
        } else {
          this.setState({
            warn: error.message
          })
        } 
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

    handleDeleteUser = async (id, name) => {
      this.removeClass()
      const adminMoreThanOne = this.state.user.filter(admin => admin.userType).length > 1;
      if (!adminMoreThanOne) {
        this.setState({
          warn: "1 admin should remain!"
        })
        return;
      }

      try {
        this.setState({deleteUser: false, toBeDelete: [], loading: true})
        const response = await axios.delete(`${config.Configuration.database}/deleteUser/${id}`);
        if (response.status === 200) {
          this.setState({isSuccessful: `User "${name}" deleted successfully`})
        }
        this.getUser();
      } catch (error) {
        if (error.response) {
          this.setState({
            warn: error.response.data
          })
        } else if (error.request) {
          this.setState({
            warn: "Network issue. Please try again later."
          });
        } else {
          this.setState({
            warn: error.message
          })
        } 
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

      const dataError = (error) => {
        if (error.response) {
          this.setState({
            warn: "Internal error: status 500"
          })
        } else if (error.request) {
          this.setState({
            warn: "Network issue. Please try again later."
          });
        } else {
          this.setState({
            warn: error.message
          })
        } 
      }
    
      const id = currentId;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
      if (!emailRegex.test(email)) {
        this.setState({ message: 'Invalid email', checkEmail: 'Invalid email' });
        return;
      }
      this.setState({checkEmail: "" });
    
      const requiredFields = [
        name,
        email,
        password,
        userType,
        storeName
      ];
      
      const allFieldsValid = requiredFields.every((field) => field && field.length > 0);
       
      if (allFieldsValid) {
        this.removeClass();
        this.setState({ loading: true });
    
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
            this.setState({ isSuccessful: "User Added!" });
          } catch (error) {
            dataError(error)
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
                const newData = JSON.stringify({
                userType: userType,
                storeId: currentStoreId,
                userId: currentUserId
                });
                const encryptionKey = 'NxPPaUqg9d';
                const encrypted = encryptData(newData, encryptionKey);
                localStorage.setItem('encryptedData', encrypted)
                this.userInfo()
            }
    
            this.getUser();
            this.handleReset();
            const button = document.getElementById("add-bttn");
            button.classList.add("add-bttn");
            this.setState({ option: "Add", isSuccessful: "Change Successful!" });
          } catch (error) {
            dataError(error)
          } finally {
            this.setState({loading: false})
          }
        }
      } else {
        this.setState({ message: "Please fill all fields" });
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

    componentDidUpdate(prevProps, prevState) {
      if (
        prevState.message !== this.state.message ||
        prevState.warn !== this.state.warn ||
        prevState.isSuccessful !== this.state.isSuccessful
      ) {
        this.fieldInfoMessage();
      }
    }

    fieldInfoMessage = () => {
      const { message, warn, isSuccessful } = this.state;
  
      if (message) {
        this.animateNotification(this.fieldMessageRef);
      } else if (warn) {
        this.animateNotification(this.fieldWarnRef);
      } else if (isSuccessful) {
        this.animateNotification(this.fieldIsSuccessfulRef);
      }
    };

    animateNotification = (elementRef) => {
      const element = elementRef.current;
      if (element) {
        element.classList.add("field_show");
        setTimeout(() => {
          element.classList.remove("field_show");
          this.setState({
            message: "",
            warn: "",
            isSuccessful: ""
          });
        }, 3000);
      }
    };

    render() {
        const {  filteredUser, searchQuery, name, email, password, currentUserType, userType, checkEmail, option, stores,
        storeName, displayCount, loading, deleteUser, toBeDelete, message, warn, isSuccessful } = this.state;

        const displayFieldInfo = 
          <>
          <div className="field_message" ref={this.fieldMessageRef}>
          {message}
          </div>
          <div className="field_warn" ref={this.fieldWarnRef}>
            {warn}
          </div>
          <div className="field_is_successful" ref={this.fieldIsSuccessfulRef}>
            {isSuccessful}
          </div>
          </>

        if (currentUserType === 'admin') {
        return (
            <div>
                {displayFieldInfo}

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
                    this.handleDeleteUser(toBeDelete.id, toBeDelete.name)
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
                          Deploy: 
                        </label>
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