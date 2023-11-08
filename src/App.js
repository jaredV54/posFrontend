import React, { useState } from 'react';
import LogIn from './LogIn';
import NavArea from './NavArea';
import User from './User';
import Home from './Home';
import Purchase from './Purchase';
import SalesRecord from './SalesRecord';
import Transactions from './Transactions';
import TotalSales from './TotalSales';
import Store from './Store';
import Customer from './Customer';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import SplitPayment from './SplitPayment';
import SplitPaymentRecord from './SplitPaymentRecord';

const AuthenticatedRoutes = ({ values, authenticated}) => {
  const navigate = useNavigate()
  if (authenticated) {
    return (
      <>
        <NavArea values={values} />
        <div className='page-container'>
          <Routes>
            <Route path='/User' element={<User />} />
            <Route path='/Home' element={<Home />} />
            <Route path='/Purchase' element={<Purchase />} />
            <Route path='/SalesRecord' element={<SalesRecord />} />
            <Route path='/Transactions' element={<Transactions />} />
            <Route path='/TotalSales' element={<TotalSales />} />
            <Route path='/Store' element={<Store />} />
            <Route path='/Customer' element={<Customer />} />
            <Route path='/SplitPayment' element={<SplitPayment />} />
            <Route path='/SplitPaymentRecord' element={<SplitPaymentRecord />} />
          </Routes>
        </div>
      </>
    );
  } else {
    navigate("/");
    return null;
  }
};

const App = () => {
  const [values, setValues] = useState({
    email: '',
    password: ''
  });
  const [authenticated, setAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LogIn values={values} setValues={setValues} setAuthenticated={setAuthenticated} />} />
        <Route path='/*' element={<AuthenticatedRoutes values={values} authenticated={authenticated} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
