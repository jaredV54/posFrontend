import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ReactToPrint from 'react-to-print';
import config from "./Config.json";

function SalesRecord() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [displayCount, setDisplayCount] = useState(150);
  const [searchQuery, setSearchQuery] = useState('');
  const userTypeJSON = JSON.parse(localStorage.getItem("currentUserType"));
  const userType = userTypeJSON.userType;
  useEffect(() => {
    getSalesRecord();
  }, []);

  const [fieldInfo, setFieldInfo] = useState({
    loading: false
  })

  const getSalesRecord = async () => {
    try {
      setFieldInfo((prev) => ({...prev, loading: true }));
      const response = await axios.get(`${config.Configuration.database}/sales`);
      setSales(response.data);
      setFilteredSales(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setFieldInfo((prev) => ({...prev, loading: false }));
    }
  };

  const filterSales = () => {
    const query = searchQuery.trim();
    if (query === '') {
      setFilteredSales(sales);
    } else {
      const filteredSales = sales.filter((sale) => {
        const transId = String(sale.transId);
        return transId === query;
      });
      setFilteredSales(filteredSales);
    }
  };

  const formatDate = (dateString) => {
    const options = {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', options);
    return formattedDate;
  };

  const handleExpandClick = () => {
    setDisplayCount((prev) => prev + 150);
  }

  useEffect(() => {
    filterSales();
  }, [searchQuery]);

  if (userType !== 'user' && userType !== undefined) {
    return (
      <div>
        <div className="go-back">
          <Link to="/Purchase"><i className='bx bx-chevron-left' ></i></Link>
        </div>
        <div id='sales-record-container'>
          <h1>Sales Record</h1>
          <div className='search-form'>
            <input
              className='search-bar'
              type='number'
              name='search-bar'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Transaction No#'
            />
            <i className='bx bx-search search-icon' ></i>
          </div>
          <Receipt trackReceipt={filteredSales} searchQuery={searchQuery} formatDate={formatDate} />
          <table className='sales-table'>
          {fieldInfo.loading ? (<>
            <div style={{top: "100%"}} class="lds-ellipsis"><div></div><div></div><div></div></div>
            </>) : null
          }
            <thead className='table-column'>
              <tr className='sales-column'>
                <th>Sales ID</th>
                <th>Trans No#</th>
                <th>Hybrid</th>
                <th>Name</th>
                <th>Date Time Purchased</th>
                <th>Actual Price</th>
                <th>Quantity</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody className='table-rows' >
            {filteredSales.slice(0, displayCount).map((sale) => (
                <tr className='sales-row' key={sale.salesId}>
                  <td>{sale.salesId}</td>
                  <td>{sale.transId}</td>
                  <td>{sale.hybrid}</td>
                  <td>{sale.name}</td>
                  <td>{formatDate(sale.dateTimePurchased)}</td>
                  <td>{sale.price}</td>
                  <td>{sale.hybrid === 'service' ? "N/A" : sale.quantity}</td>
                  <td>{sale.hybrid === 'service' ? sale.price : (sale.price * sale.quantity).toFixed(2)}</td>
                </tr>
            ))}
            {filteredSales.length >= displayCount ? (
              <tr>
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
    )
  } else {
    return (<div>
      You don't have acces to this page.
    </div>);
  } 
}

class Receipt extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      transactions: [],
      customer: []
    }
    this.componentRef = React.createRef();
  }

  componentDidMount() {
    this.getTransactions();
    this.getClients();
  }

  componentDidUpdate(prevProps) {
    const { searchQuery, trackReceipt } = this.props;

    if (searchQuery !== prevProps.searchQuery) {
      this.getTransactions();
    }

    if (trackReceipt !== prevProps.trackReceipt && trackReceipt.length > 0) {
      this.getTransactions();
    }
  }

  getTransactions = async () => {
    try {
      const { trackReceipt, searchQuery } = this.props;
      if (searchQuery.length > 0 && trackReceipt.length !== 0) {
        const firstReceipt = trackReceipt[0];
        const response = await axios.get(`${config.Configuration.database}/transactions/${firstReceipt.transId}`);
        this.setState({ transactions: response.data });
      }
    } catch (error) {
      console.error(error);
    }
  };

  getClients = async () => {
    try {
      const response = await axios.get(`${config.Configuration.database}/customer`);
      this.setState({customer: response.data})
    } catch (error) {
      console.error(error);
    }
  };

  render() {
    const {trackReceipt} = this.props;
    const {searchQuery} = this.props;
    const {transactions, customer} = this.state;

    if (searchQuery.length > 0) {
    if (trackReceipt.length === 0) {
      return <div className='no-receipt'>
        <div>
        No receipt data available.
        </div>
      </div>;
    }
    const firstReceipt = trackReceipt[0];

    return (
      <div>
        <div id='receipt' className='receipt-container'>
        <div ref={this.componentRef} className='receipt-closed print-table'
        style={{
          backgroundColor: '#eeeeee'
        }}>
        <h1 style={{
          color: '#1a1a1a',
          fontSize: '1.9rem',
          fontFamily: 'Raleway, sans-serif',
          fontWeight: '600',
          marginBottom: '10px',
          textAlign: 'center'
        }}
        >
          Receipt
        </h1>
        {
          customer.map(cust => (
            cust.isSelected ? (
              <div className='client-info' key={cust.id}>
                <p className='date'
                style={{color: '#212121', fontWeight: 500, fontSize: '1rem', marginBottom: "10px"}}>
                  Client: {cust.fName} {cust.lName}
                </p>
              </div>
            ) : null
          ))
        }
        <p style={{color: '#212121', fontWeight: 500, fontSize: '1rem'}} className='date'>Date Time Purchased: {this.props.formatDate(firstReceipt.dateTimePurchased)}</p>
        <p style={{color: '#212121', fontWeight: 500, fontSize: '1rem', margin: '10px 0' }} className='transNo'>Trans No#: <span
        style={{color: '#313a72'}}>{firstReceipt.transId}</span></p>
          <table className='receipt-table' style={{borderCollapse: 'collapse', border: 'solid 1px #000'}} border="3">
          <thead className='receipt-head' style={{color: '#1a1a1a', backgroundColor: '#c3c3c3'}}>
          <tr className='receipt-row'>
            <th style={{padding: '5px 10px'}} >QTY</th>
            <th style={{padding: '5px 10px'}}>Product</th>
            <th style={{padding: '5px 10px'}}>Price</th>
            <th style={{padding: '5px 10px'}}>Amount</th>
          </tr>
          </thead>     
        {trackReceipt.map((prod) => (
                <tbody className='receipt-body' key={prod.salesId} style={{color: '#1a1a1a', backgroundColor: '#d3d3d3'}}>
                  <tr className='receipt-row'>
                    <td style={{padding: '5px 10px', fontWeight: '400'}}>{prod.quantity}</td>
                    <td style={{padding: '5px 10px', fontWeight: '400'}}><span
                    style={{fontWeight: '600'}}>{prod.name}</span> - {prod.description.slice(0, 20)}...</td>
                    <td style={{padding: '5px 10px', fontWeight: '400'}}>₱{prod.price}</td>
                    <td style={{padding: '5px 10px', fontWeight: '400'}}>₱{(prod.price * prod.quantity).toFixed(2)}</td>
                  </tr>
                </tbody>
          ))}
          </table>
          
          {transactions.map((prod) => {
            if (prod.id === firstReceipt.transId) {
              return (
                <div className='show-payment' key={prod.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'end',
                  width: '100%'
                  }}>
                  <p style={{marginTop: '10px'}} className='total-'>Total: <span>₱{prod.amount}</span></p>
                  <p>Cash: <span>₱{prod.cash}</span></p>
                  {prod.typeOfPayment === "straight" ? (
                    <p style={{marginBottom: '10px'}} className='change-'>Change: <span
                    style={{
                      color: '#f7860e'
                    }}>₱{prod.changeAmount}</span></p>
                  ): (
                  <p style={{marginBottom: '10px'}} className='change-'>Balance: <span
                  style={{
                    color: '#f7860e'
                  }}>₱{prod.changeAmount}</span></p>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
        <ReactToPrint 
        trigger={() => {
          return <button className='print-button'>Print Receipt</button>
        }}
        content={() => this.componentRef.current}
        documentTitle='Recent Transaction'
        pageStyle='print'
        />
        </div>
      </div>
    )
    }
  }
}

export default SalesRecord;
