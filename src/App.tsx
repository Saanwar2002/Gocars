import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import BookRide from './pages/BookRide';
import MyRides from './pages/MyRides';
import DriverPortal from './pages/DriverPortal';
import TestingDashboard from './pages/TestingDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookRide />} />
          <Route path="/rides" element={<MyRides />} />
          <Route path="/driver" element={<DriverPortal />} />
          <Route path="/testing" element={<TestingDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;