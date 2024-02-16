import React, { useState, useEffect } from 'react';
import LogIn from './LogIn';
import NavArea from './NavArea';
import User from './User';
import Hybrid from './Hybrid';
import Purchase from './Purchase';
import SalesRecord from './SalesRecord';
import Transactions from './Transactions';
import TotalSales from './TotalSales';
import Place from './Store';
import Client from './Client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import SplitPayment from './SplitPayment';
import SplitPaymentRecord from './SplitPaymentRecord';

const AuthenticatedRoutes = ({ values, authenticated }) => {
  const navigate = useNavigate();


  useEffect(() => {
    if (!authenticated) {
      navigate("/");
    }
  }, [authenticated, navigate]);

  if (authenticated) {
    return (
      <>
        <NavArea values={values} />
        <div className='page-container'>
          <Routes>
            <Route path='/User' element={<User />} />
            <Route path='/Hybrid' element={<Hybrid />} />
            <Route path='/Purchase' element={<Purchase />} />
            <Route path='/SalesRecord' element={<SalesRecord />} />
            <Route path='/Transactions' element={<Transactions />} />
            <Route path='/TotalSales' element={<TotalSales />} />
            <Route path='/Place' element={<Place />} />
            <Route path='/Customer' element={<Client />} />
            <Route path='/SplitPayment' element={<SplitPayment />} />
            <Route path='/SplitPaymentRecord' element={<SplitPaymentRecord />} />
          </Routes>
        </div>
      </>
    );
  } else {
    return null;
  }
};

const App = () => {
  const [values, setValues] = useState({
    email: '',
    password: ''
  });

  const [authenticated, setAuthenticated] = useState(
    localStorage.getItem('authenticated') === 'true'
  );

  const handleLogin = (validation) => {
    setAuthenticated(validation);
    localStorage.setItem('authenticated', 'true');
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LogIn values={values} setValues={setValues} handleLogin={handleLogin} />} />
        <Route path='/*' element={<AuthenticatedRoutes values={values} authenticated={authenticated} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
