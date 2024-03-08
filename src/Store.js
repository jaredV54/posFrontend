import React, { useRef } from 'react';
import axios from 'axios';
import decryptedUserDataFunc from './decrypt';
import { Link } from 'react-router-dom';
import config from "./Config.json";

class Place extends React.Component {
  constructor(props) {
    super(props);
    this.fieldMessageRef = React.createRef();
    this.fieldWarnRef = React.createRef();
    this.fieldIsSuccessfulRef = React.createRef();
    this.state = {
      store: [],
      searchQuery: '',
      filteredStore: [],
      storeName: '',
      address: '',
      contactNo: '',
      email: '',
      birTin: '',
      branch: '',
      option: 'Add',
      currentId: 0,
      userType: 0,
      loading: false,
      fetchingData: false,
      message: "",
      warn: "",
      isSuccessful: ""
    };
  }

  componentDidMount() {
    this.getStore();
    this.showNotification();
    this.userInfo()
  }

  userInfo = () => {
    const userData = localStorage.getItem('encryptedData');
    
    if (userData) {
      const decryptionKey = 'NxPPaUqg9d';
      const decrypted = JSON.parse(decryptedUserDataFunc(userData, decryptionKey));
      this.setState({userType: decrypted.userType})
    }
  }

  getStore = async () => {
    try {
      this.setState({ loading: true });
      const response = await axios.get(`${config.Configuration.database}/store`);
      if (response.data.isSuccessful) this.setState({ store: response.data.result, filteredStore: response.data.result });
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
    } finally {
      this.setState({ loading: false });
    }
  };

  handleSearch = (searchQuery) => {
    this.setState({ searchQuery }, () => {
      const { store, searchQuery } = this.state;
      if (searchQuery.trim() === '') {
        this.setState({ filteredStore: store });
      } else {
        const filtered = store.filter(
          (store) =>
            store.storeName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            store.address.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            store.contactNumber.toString().includes(searchQuery) || 
            store.birTin.toString().includes(searchQuery)
        );
        this.setState({ filteredStore: filtered });
      }
    });
  };

  handleStoreName = (value) => {
    this.setState({ storeName: value, checkinput: "" });
  };

  handleAddress = (value) => {
    this.setState({ address: value, checkinput: ""  });
  };

  handleContactNo = (value) => {
    this.setState({ contactNo: value, checkinput: ""  });
  };

  handleEmail = (value) => {
    this.setState({ email: value, checkinput: "", checkEmail: "" });
  };

  handleBirTin = (value) => {
    this.setState({ birTin: value, checkinput: ""  });
  };

  handleBranchName = (value) => {
    this.setState({ branch: value, checkinput: ""  });
  };

  handleCancel = () => {
    this.setState({option: "Add"})
    this.handleReset();
  }

  editStore = async () => {
    const {storeName, address, contactNo, email, birTin, branch, option, currentId} = this.state;
    const id = currentId;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.length <= 0) {
    this.setState({message: "Please don't leave blanks"})
    } else if (!emailRegex.test(email)) {
      this.setState({ 
        message: "Invalid email"
      });
      return;
    }

    const filedInfo = [storeName, address, contactNo, email, birTin, branch]

    if (filedInfo.every((req) => req.length > 0)) {
      if (option === "Add") {

        try {
          this.setState({ fetchingData: true });
          const response = await axios.post(`${config.Configuration.database}/store`, {
            storeName,
            address,
            contactNo,
            email,
            birTin,
            branch
          });

          if (response.data.isSuccessful) {
            this.setState({
              isSuccessful: response.data.message
            });
            this.getStore();
            this.handleReset();
          } else {
            this.setState({
              message: response.data.message
            })
          }
        } catch (error) {
          this.setState({
            warn: error.response.data.message
          })
        } finally {
          this.setState({ fetchingData: false });
        }

      } else if (option === "Change") {
        try {
          this.setState({ fetchingData: true });
          const response = await axios.put(`${config.Configuration.database}/store/${id}`, {
            storeName,
            address,
            contactNo,
            email,
            birTin,
            branch
          });

          if (response.data.isSuccessful) {
            this.getStore();
            this.handleReset();
            this.setState({
              option: "Add",
              isSuccessful: response.data.message
            });
          } else {
            this.setState({
              option: "Add",
              warn: response.data.message
            });
            this.getStore();
            this.handleReset();
          }

        } catch (error) {
          this.setState({
            warn: error.response.data.message
          });
        } finally {
          this.setState({ fetchingData: false });
        }
      }

  } else {
    this.setState({message: "Please don't leave blanks."})
  }
  };

  handleReset = () => {
    this.setState({ 
      storeName: '',
      address: '',
      contactNo: '',
      email: '',
      birTin: '',
      branch: ''
     })
  }

  updateStore = async (id) => {
    const {store} = this.state;
    store.map((selectedStore) => {
      if (selectedStore.id === id)
      this.setState({ 
        storeName: selectedStore.storeName,
        address: selectedStore.address,
        contactNo: selectedStore.contactNumber,
        email: selectedStore.email,
        birTin: selectedStore.birTin,
        branch: selectedStore.branchName
       })
    })
    this.setState({option: "Change", currentId: id, checkEmail: ""})
  };

  deleteStore = async (id) => {
    try {
      this.setState({ fetchingData: true });
      const response = await axios.delete(`${config.Configuration.database}/store/${id}`);
      if (response.data.isSuccessful) {
        this.getStore();
        this.setState({
          isSuccessful: response.data.message
        })
      } else {
        this.setState({
          warn: response.data.message
        })
        this.getStore();
      }
    } catch (error) {
      this.setState({
        warn: error.response.data.message
      })
    } finally {
      this.setState({ fetchingData: false });
    }
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.message !== this.state.message ||
      prevState.warn !== this.state.warn ||
      prevState.isSuccessful !== this.state.isSuccessful
    ) {
      this.showNotification();
    }
  }

  showNotification = () => {
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
    const { filteredStore, userType, searchQuery, storeName, address, fetchingData,
    contactNo, email, birTin, branch, option, checkEmail, loading,
    message, warn, isSuccessful } = this.state;
    
    if (userType === 'admin') {
      return (
        <div>
          <div className="field_message" ref={this.fieldMessageRef}>
          {message}
          </div>
          <div className="field_warn" ref={this.fieldWarnRef}>
            {warn}
          </div>
          <div className="field_is_successful" ref={this.fieldIsSuccessfulRef}>
            {isSuccessful}
          </div>

          <div className="go-back">
          <Link to="/Purchase"><i className='bx bx-chevron-left' ></i></Link>
          </div>
          <div id='page-container'>
          {fetchingData ? (<span className="loader"></span>) : null}
          <div className='grid-store add-store-wrapper'>
            <h2 className='prod-label'>Add Place</h2>
            <label htmlFor='store-name label-first'>Place name: </label>
            <input
              className='inp-store-name'
              type='text'
              name='store-name'
              value={storeName}
              onChange={(e) => this.handleStoreName(e.target.value)}
              placeholder='---'
            />
            <label htmlFor='store-address'>Address: </label>
            <input
              className='inp-store-address'
              type='text'
              name='store-address'
              value={address}
              onChange={(e) => this.handleAddress(e.target.value)}
              placeholder='---'
            />
            <label htmlFor='store-contactNo'>Contact Number: </label>
            <input
              className='inp-store-contactNo'
              type='text'
              name='store-contactNo'
              value={contactNo}
              onChange={(e) => this.handleContactNo(e.target.value)}
              placeholder='---'
            />
            <label htmlFor='store-email'>Email: 
            <p className='check-input'>
              {checkEmail ?? checkEmail}
            </p>
            </label>
            <input
              className='inp-store-email'
              type='email'
              name='store-email'
              value={email}
              onChange={(e) => this.handleEmail(e.target.value)}
              placeholder='---'
            />
            <label htmlFor='store-birTin'>Bir/Tin: </label>
            <input
              className='inp-store-birTin'
              type='text'
              name='store-birTin'
              value={birTin}
              onChange={(e) => this.handleBirTin(e.target.value)}
              placeholder='---'
            />
            <label htmlFor='store-branch'>Branch: </label>
            <input
              className='inp-store-branch'
              type='text'
              name='store-branch'
              value={branch}
              onChange={(e) => this.handleBranchName(e.target.value)}
              placeholder='---'
            />
            <div id='add-bttn'>
              {option === "Change" ? 
              <button 
              type="button"
              name="submit"
              style={{pointerEvents: fetchingData ? "none" : null}}
              className="cancel-bttn"
              onClick={() => this.handleCancel()}
              >
                Cancel
              </button>: null}
              <button 
              className='create-store-bttn add-bttn' 
              onClick={this.editStore}
              style={{pointerEvents: fetchingData ? "none" : null}}
              >
              {option === "Invalid email" ? "Add" : option }
              </button>
            </div>
          </div>
  
          <div className='grid-store stores-wrapper'>
            <h2 className='prod-label'>Places</h2>
            <div className='search-form'>
              <input
                className='search-bar'
                type='text'
                name='search-bar'
                value={searchQuery}
                onChange={(e) => this.handleSearch(e.target.value)}
                placeholder='Search the store'
              />
              <i className='bx bx-search search-icon'></i>
            </div>
            {loading ? (<>
            <div class="lds-ellipsis"><div></div><div></div><div></div></div>
            </>) : null
            }
            <div className='overflow-store-description'>
              {filteredStore.length === 0 && <p 
              style={{position: "absolute",
              left: '50%',
              top: "50%",
              transform: "translate(-50%, -50%)"}}
              className='not-found'>None</p>}
              {filteredStore
                .sort((a, b) => a.storeName.localeCompare(b.storeName))
                .map((store) => (
                  <div className={`store-info`} key={store.id}>
                    <p className='store-name-text'>{store.storeName}</p>
                    <p className='store-description-text'><span className='desc-label'>Address:</span><span className='desc'>{store.address}</span></p>
                    <p className='store-description-text'><span className='desc-label'>Contact#:</span><span className='desc'>{store.contactNumber}</span></p>
                    <p className='store-description-text'><span className='desc-label'>Email:</span><span className='desc'><a href="#" target="_blank">{store.email}</a></span></p>
                    <p className='birtin'><span className='desc-label'>Bir/Tin:</span><span className='desc'> {store.birTin}</span></p>
                    <p className='birtin' style={{top: "30px"}}><span className='desc-label'>Place ID:</span><span className='desc'> {store.id}</span></p>
                    <p className='store-description-text'><span className='desc-label'>Branch:</span><span className='desc'>{store.branchName}</span></p>
                    <div className='buttons-container'>
                      <button className='update-store-bttn' onClick={() => this.updateStore(store.id)}>
                        <div>Change</div>
                        <i className='bx bx-message-alt-detail mess-detail'></i>
                      </button>
                      <button className='delete-store-bttn' onClick={() => this.deleteStore(store.id)}>
                        <div>Delete</div>
                        <i className='bx bx-message-alt-minus mess-minus'></i>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
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

export default Place;
