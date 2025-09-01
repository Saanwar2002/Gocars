import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navStyle: React.CSSProperties = {
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '1rem 0',
    position: 'sticky',
    top: 0,
    zIndex: 100
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#2563eb',
    textDecoration: 'none'
  };

  const navLinksStyle: React.CSSProperties = {
    display: 'flex',
    gap: '2rem',
    listStyle: 'none',
    margin: 0,
    padding: 0
  };

  const linkStyle: React.CSSProperties = {
    textDecoration: 'none',
    color: '#6b7280',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    transition: 'all 0.2s'
  };

  const activeLinkStyle: React.CSSProperties = {
    ...linkStyle,
    color: '#2563eb',
    backgroundColor: '#eff6ff'
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <Link to="/" style={logoStyle}>
          🚗 GoCars UK
        </Link>
        
        <ul style={navLinksStyle}>
          <li>
            <Link 
              to="/" 
              style={isActive('/') ? activeLinkStyle : linkStyle}
            >
              Home
            </Link>
          </li>
          <li>
            <Link 
              to="/book" 
              style={isActive('/book') ? activeLinkStyle : linkStyle}
            >
              Book Taxi
            </Link>
          </li>
          <li>
            <Link 
              to="/rides" 
              style={isActive('/rides') ? activeLinkStyle : linkStyle}
            >
              My Rides
            </Link>
          </li>
          <li>
            <Link 
              to="/driver" 
              style={isActive('/driver') ? activeLinkStyle : linkStyle}
            >
              Driver Portal
            </Link>
          </li>
          <li>
            <Link 
              to="/testing" 
              style={isActive('/testing') ? activeLinkStyle : linkStyle}
            >
              Testing Dashboard
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;