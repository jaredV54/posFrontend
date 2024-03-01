import React from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import decryptedUserDataFunc from './decrypt';
import CryptoJS from 'crypto-js';
import config from "./Config.json";

class Transactions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      transactions: [],
      filteredTransactions: [],
      startDate: '',
      endDate: '',
      searchQuery: '',
      splitPayment: [],
      userType: 0,
      displayCount: 150,
      loading: false,
      message: ""
    };
  }

  componentDidMount() {
    this.getTransactions();
    this.getSplitPayment();
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
  
  getTransactions = async () => {
    try {
      this.setState({ loading: true });
      const response = await axios.get(`${config.Configuration.database}/transactions`);
      if (response.data !== "Error retrieving transaction records") {
        this.setState({ transactions: response.data, filteredTransactions: response.data });
      } else {
        this.setState({ message: response.data });
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.setState({ loading: false });
    }
  };

  getSplitPayment = async () => {
    try {
      this.setState({ loading: true });
      const response = await axios.get(`${config.Configuration.database}/splitPayment`);
      this.setState({ splitPayment: response.data });
    } catch(error) {
      console.error(error)
    } finally {
      this.setState({ loading: false });
    }
  }

  handleStartDateChange = (event) => {
    const startDate = event.target.value;
    this.setState({ startDate }, () => {
      if (!startDate) {
        this.setState({ filteredTransactions: this.state.transactions });
      } else {
        this.filterTransactions();
      }
    });
  };
  
  handleEndDateChange = (event) => {
    const endDate = event.target.value;
    this.setState({ endDate }, () => {
      if (!endDate) {
        this.setState({ filteredTransactions: this.state.transactions });
      } else {
        this.filterTransactions();
      }
    });
  };

  handleStartDateChange = (event) => {
    const startDate = event.target.value;
    this.setState({ startDate }, () => {
      if (!startDate) {
        this.setState({ filteredTransactions: this.state.transactions });
      } else {
        this.filterTransactions();
      }
    });
  };
  
  handleEndDateChange = (event) => {
    const endDate = event.target.value;
    this.setState({ endDate }, () => {
      if (!endDate) {
        this.setState({ filteredTransactions: this.state.transactions });
      } else {
        this.filterTransactions();
      }
    });
  };

  // local storage client selection
  encryptData = (data, key) => {
    return CryptoJS.AES.encrypt(data, key).toString();
  };

  handleSaveToLocalStorage = (data) => {
    const splitData = JSON.stringify(data);
    const encryptionKey = 'Dr988U3DDD';

    const encrypted = this.encryptData(splitData, encryptionKey);
    localStorage.setItem('TID', encrypted);
  }

  handleSplitPayment = async (id, balance, customerId, items) => {
    const {splitPayment} = this.state;
    if (splitPayment.length > 0) {
      splitPayment.map((split) => {
        if (split.transId == id && split.balance !== 0) {
          this.handleSaveToLocalStorage({
            id: id, 
            balance: split.balance, 
            customerId: customerId, 
            items: items
          });
          window.location.assign("/SplitPayment");
        } else {
          this.handleSaveToLocalStorage({
            id: id, 
            balance: balance, 
            customerId: customerId, 
            items: items
          })
          window.location.assign("/SplitPayment");
        }
      })
    } else {
      this.handleSaveToLocalStorage({
        id: id, 
        balance: balance, 
        customerId: customerId, 
        items: items
      });
      window.location.assign("/SplitPayment");
    }
  }

  filterTransactions = () => {
    const { transactions, startDate, endDate } = this.state;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start) {
      start.setHours(0, 0, 0, 0); 
    }
  
    const filteredTransactions = transactions.filter((trans) => {
      const transDate = new Date(trans.transDate);
      if (start && end) {
        return (
          transDate >= start && 
          transDate <= end
        );
      } else {
        return true;
      }
    });
  
    this.setState({ filteredTransactions: filteredTransactions });
  };

  formatDate = (dateString) => {
    const options = { month: '2-digit', day: '2-digit', year: '2-digit' };
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', options);
    return formattedDate;
  };
  
  handleClearDates = () => {
    this.setState({
      startDate: '',
      endDate: '',
      filteredTransactions: this.state.transactions,
    });
  };

  handleSearch = (searchQuery) => {
    this.setState({ searchQuery }, () => {
      const { transactions, searchQuery } = this.state;
      if (searchQuery.trim() === '') {
        this.setState({ filteredTransactions: transactions });
      } else {
        const filtered = transactions.filter(
          (trans) =>
            trans.receiptNo.toString() === searchQuery.trim() ||
            trans.customerId.toString() === searchQuery.trim() ||
            trans.fName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            trans.lName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            trans.modeOfPayment.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            `${trans.fName.toLowerCase()} ${trans.lName.toLowerCase()}`.includes(searchQuery.toLowerCase().trim())
        );
        this.setState({ filteredTransactions: filtered });
      }
    });
  };  

  handleExpandClick = () => {
    this.setState((prevState) => ({
      displayCount: prevState.displayCount + 150
    }));
  };  

  render() {
    const {
      startDate,
      endDate,
      filteredTransactions,
      searchQuery,
      splitPayment,
      transactions,
      userType,
      displayCount,
      loading
    } = this.state;
  
    const matchingSplitPayments = {};
  
    transactions.forEach((transaction) => {
      const matchingSplitPayment = splitPayment.find(
        (split) => split.transId === transaction.id && parseFloat(split.balance) === 0
      );
      if (matchingSplitPayment) {
        matchingSplitPayments[transaction.id] = true;
      }
    });

    if (userType !== undefined) {
    return (
      <div>
        <div className="go-back">
          <Link to="/Purchase">
            <i className='bx bx-chevron-left'></i>
          </Link>
        </div>
        <div id='sales-record-container'>
          <h1>Transaction Records</h1>
  
          <div className='date-range'>
            <label htmlFor="start-date">From</label>
            <input className='start-date' 
              type="date" 
              id="start-date" name="start-date" value={startDate} onChange={this.handleStartDateChange} />
            <label htmlFor="end-date">To</label>
            <input className='end-date' 
              type="date" 
              id="end-date" name="end-date" value={endDate} onChange={this.handleEndDateChange} />
            <button className='clear-date' onClick={this.handleClearDates}>Clear</button>
          </div>
  
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
  
          <table className='sales-table'
          style={{
            width: "1500px"
          }}>
            <thead className='table-column'>
              <tr className='sales-column'>
                <th></th>
                <th title='Transaction ID'>ID</th>
                <th>Item</th>
                <th>Amount</th>
                <th>Money</th>
                <th style={{color: "#6878e0"}}>Change</th>
                <th style={{color: "#ff8808"}}>Balance</th>
                <th>Date</th>
                <th title='Client ID Number'>CID</th>
                <th>Client_Name</th>
                <th>Receipt#</th>
                <th title='Mode of Payment'>MoP</th>
                <th>Acc/Ref#</th>
                <th title='Type of Payment'>ToP</th>
                <th>Platform</th>
                <th>Service</th>
                <th>Remarks</th>
                <th>Providers</th>
              </tr>
            </thead>
            <tbody className='table-rows'>
              {filteredTransactions.slice(0, displayCount).map((trans) => (
                <tr className={`sales-row ${matchingSplitPayments[trans.id] ? 'split-balance-passed' : ''}`} key={trans.id}>
                  <td
                    id={`${trans.id}`}
                    onClick={() => {
                      this.handleSplitPayment(trans.id, trans.balance, trans.customerId, trans.items);
                    }}
                    className={`select-split-row ${matchingSplitPayments[trans.id] || trans.typeOfPayment === 'straight' ? 'split-balance-passed' : ''}`}
                  >Pay</td>
                  <td>{trans.id}</td>
                  <td>{trans.items}</td>
                  <td>{trans.amount}</td>
                  <td>{trans.cash}</td>
                  {trans.typeOfPayment === "straight" ? (
                    <>
                    <td>{trans.changeAmount}</td>
                    <td>0.00</td>
                    </>
                  ) : (
                    <>
                    <td>0.00</td>
                    <td>{parseFloat(trans.balance).toFixed(2)}</td>
                    </>
                  )}
                  <td>{this.formatDate(trans.transDate)}</td>
                  <td>{trans.customerId}</td>
                  <td>{trans.fName} {trans.lName}</td>
                  <td>{trans.receiptNo}</td>
                  <td>{trans.modeOfPayment}</td>
                  <td>{trans.accNo}</td>
                  <td>{trans.typeOfPayment}</td>
                  <td>{trans.platform}</td>
                  <td>{trans.service ? trans.service : "N/A"}</td>
                  <td>{trans.remarks}</td>
                  <td>{trans.providers}</td>
                </tr>
              ))}
              {filteredTransactions.length >= displayCount ? (
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
              <td id='expand' onClick={this.handleExpandClick}>Expand</td>
            </tr>
            ): null}
            </tbody>
          </table>
          {loading ? (<>
            <div style={{top: "100%"}} class="lds-ellipsis"><div></div><div></div><div></div></div>
            </>) : null
          }
        </div>
      </div>
    );
    } else {
      (<div>
        You don't have acces to this page.
      </div>);
    }
  }
  
}

export default Transactions;
