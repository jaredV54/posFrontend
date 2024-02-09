import React from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import config from "./Config.json";

class Store extends React.Component {
  constructor(props) {
    super(props);
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
      checkinput: '',
      option: 'Add',
      currentId: 0,
      checkEmail: '',
      userType: JSON.parse(localStorage.getItem("currentUserType")).userType,
      loading: false
    };
  }

  componentDidMount() {
    this.getStore();
  }

  getStore = async () => {
    try {
      this.setState({ loading: true });
      const response = await axios.get(`${config.Configuration.database}/store`);
      this.setState({ store: response.data, filteredStore: response.data });
    } catch (error) {
      console.error(error);
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
    const {storeName, address, contactNo, email, birTin, branch, option, currentId, checkEmail} = this.state;
    const id = currentId;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.length <= 0) {
    this.setState({checkinput: "Please don't leave blanks"})
    } else if (!emailRegex.test(email)) {
      this.setState({ checkEmail: 'Invalid email' });
      return;
    }

    if (storeName.length > 0 && address.length > 0 && contactNo.length > 0 && email.length > 0 && birTin.length > 0 && branch.length > 0) {
      this.setState({checkinput: ""})
      if (option === "Add" && checkEmail === "") {
        try {
          await axios.post(`${config.Configuration.database}/store`, {
            storeName,
            address,
            contactNo,
            email,
            birTin,
            branch
          });
          this.getStore();
          this.handleReset();
        this.setState({checkinput: "Store Added!"})
        setTimeout(() => {
        this.setState({checkinput: ""})
        }, 2000)
        } catch (error) {
          console.error(error);
        }
      } else if (option === "Change" && checkEmail === "") {
        try {
          await axios.put(`${config.Configuration.database}/store/${id}`, {
            storeName,
            address,
            contactNo,
            email,
            birTin,
            branch
          });
          this.getStore();
          this.handleReset();
        this.setState({option: "Add", checkinput: "Change Successful!"})
        setTimeout(() => {
          this.setState({checkinput: ""})
        }, 2000)
        } catch (error) {
          console.error(error);
        }
      }
  } else {
    this.setState({checkinput: "Please don't leave blanks"})
    setTimeout(() => {
      this.setState({checkinput: ""})
    }, 2000)
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
      await axios.delete(`${config.Configuration.database}/store/${id}`);
      this.getStore();
    } catch (error) {
      console.error(error);
    }
  };

  render() {
    const { filteredStore, userType, searchQuery, storeName, address, contactNo, email, birTin, branch, checkinput, option, checkEmail, loading } = this.state;
    
    if (userType === 'admin') {
      return (
        <div>
          <div className="go-back">
          <Link to="/Purchase"><i className='bx bx-chevron-left' ></i></Link>
          </div>
          <div id='page-container'>
          <div className='grid-store add-store-wrapper'>
            <h2 className='prod-label'>Add Place</h2>
            <label htmlFor='store-name label-first'>Place name: </label>
            <input
              className='inp-store-name'
              type='text'
              name='store-name'
              value={storeName}
              onChange={(e) => this.handleStoreName(e.target.value)}
              placeholder='Enter name'
            />
            <label htmlFor='store-address'>Address: </label>
            <input
              className='inp-store-address'
              type='text'
              name='store-address'
              value={address}
              onChange={(e) => this.handleAddress(e.target.value)}
              placeholder='Enter address'
            />
            <label htmlFor='store-contactNo'>Contact Number: </label>
            <input
              className='inp-store-contactNo'
              type='text'
              name='store-contactNo'
              value={contactNo}
              onChange={(e) => this.handleContactNo(e.target.value)}
              placeholder='Enter #'
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
              placeholder='Enter email'
            />
            <label htmlFor='store-birTin'>Bir/Tin: </label>
            <input
              className='inp-store-birTin'
              type='text'
              name='store-birTin'
              value={birTin}
              onChange={(e) => this.handleBirTin(e.target.value)}
              placeholder='Enter bir tin'
            />
            <label htmlFor='store-branch'>Branch: </label>
            <input
              className='inp-store-branch'
              type='text'
              name='store-branch'
              value={branch}
              onChange={(e) => this.handleBranchName(e.target.value)}
              placeholder='Enter branch'
            />
            <div id='add-bttn'>
            <button className='create-store-bttn add-bbtn' onClick={this.editStore}>
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
            <p className='check-input'>
              {checkinput ?? checkinput}
            </p>
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
                    <p className='store-description-text'><span className='desc-label'>Bir/Tin:</span><span className='desc'>{store.birTin}</span></p>
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

export default Store;
