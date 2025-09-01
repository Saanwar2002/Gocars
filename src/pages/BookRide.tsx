import React, { useState, useEffect } from 'react';
import { UKConfig, formatUKCurrency } from '../config/uk-config';

const BookRide: React.FC = () => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [rideType, setRideType] = useState('standard');
  const [pickupSuggestions, setPickupSuggestions] = useState<string[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [isLoadingPickup, setIsLoadingPickup] = useState(false);
  const [isLoadingDestination, setIsLoadingDestination] = useState(false);

  // UK-specific OpenStreetMap Nominatim API integration
  const searchUKAddresses = async (query: string): Promise<string[]> => {
    if (query.length < 3) return [];

    try {
      // UK-specific Nominatim search with countrycodes=gb
      const response = await fetch(
        `${UKConfig.geocoding.nominatim_url}?` +
        `format=json` +
        `&addressdetails=1` +
        `&limit=5` +
        `&countrycodes=${UKConfig.geocoding.country_code}` +
        `&q=${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent': UKConfig.geocoding.user_agent
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json();

      // Format UK addresses properly
      return data.map((item: any) => {
        const address = item.address || {};
        const parts = [];

        // Build UK-style address format
        if (address.house_number && address.road) {
          parts.push(`${address.house_number} ${address.road}`);
        } else if (address.road) {
          parts.push(address.road);
        } else if (item.name && item.name !== address.road) {
          parts.push(item.name);
        }

        if (address.suburb || address.neighbourhood) {
          parts.push(address.suburb || address.neighbourhood);
        }

        if (address.city || address.town || address.village) {
          parts.push(address.city || address.town || address.village);
        }

        if (address.postcode) {
          parts.push(address.postcode);
        }

        // Fallback to display_name if we can't build a proper address
        return parts.length > 0 ? parts.join(', ') : item.display_name;
      });
    } catch (error) {
      console.error('Error fetching UK addresses:', error);
      // Fallback to some common UK locations if API fails
      return getUKFallbackAddresses(query);
    }
  };

  // Fallback UK addresses for offline/error scenarios
  const getUKFallbackAddresses = (query: string): string[] => {
    return UKConfig.popularLocations.filter(address =>
      address.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '2rem'
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    padding: '2rem'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '2rem',
    textAlign: 'center'
  };

  const formGroupStyle: React.CSSProperties = {
    marginBottom: '1.5rem'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none'
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '1rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1rem'
  };

  const suggestionContainerStyle: React.CSSProperties = {
    position: 'relative'
  };

  const suggestionsListStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 10,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  const suggestionItemStyle: React.CSSProperties = {
    padding: '0.75rem',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.875rem'
  };

  const rideOptionsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  };

  const rideOptionStyle: React.CSSProperties = {
    padding: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const selectedRideOptionStyle: React.CSSProperties = {
    ...rideOptionStyle,
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff'
  };

  // Debounce function to limit API calls
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Debounced search functions for UK addresses
  const debouncedPickupSearch = debounce(async (query: string) => {
    if (query.length >= 3) {
      setIsLoadingPickup(true);
      try {
        const suggestions = await searchUKAddresses(query);
        console.log('UK Pickup suggestions:', suggestions);
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(true);
      } catch (error) {
        console.error('Pickup search error:', error);
      } finally {
        setIsLoadingPickup(false);
      }
    } else {
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
    }
  }, 300);

  const debouncedDestinationSearch = debounce(async (query: string) => {
    if (query.length >= 3) {
      setIsLoadingDestination(true);
      try {
        const suggestions = await searchUKAddresses(query);
        console.log('UK Destination suggestions:', suggestions);
        setDestinationSuggestions(suggestions);
        setShowDestinationSuggestions(true);
      } catch (error) {
        console.error('Destination search error:', error);
      } finally {
        setIsLoadingDestination(false);
      }
    } else {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
  }, 300);

  const handlePickupChange = (value: string) => {
    setPickup(value);
    console.log('Pickup changed:', value);
    debouncedPickupSearch(value);
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    console.log('Destination changed:', value);
    debouncedDestinationSearch(value);
  };

  const selectPickupSuggestion = (address: string) => {
    setPickup(address);
    setShowPickupSuggestions(false);
  };

  const selectDestinationSuggestion = (address: string) => {
    setDestination(address);
    setShowDestinationSuggestions(false);
  };

  const handleBookRide = () => {
    if (!pickup || !destination) {
      alert('Please fill in both pickup and destination locations');
      return;
    }

    // Calculate estimated fare based on ride type (UK pricing)
    const rideConfig = UKConfig.pricing[rideType as keyof typeof UKConfig.pricing];
    const baseFare = rideConfig.baseFare;
    const estimatedFare = baseFare + Math.floor(Math.random() * 800); // Add random amount in pence

    alert(`✅ Taxi Booked Successfully!\n\nDetails:\n🚗 Type: ${rideType.charAt(0).toUpperCase() + rideType.slice(1)}\n📍 From: ${pickup}\n🎯 To: ${destination}\n💰 Estimated Fare: ${formatUKCurrency(estimatedFare)}\n⏰ Driver ETA: 5-10 minutes\n\nYour driver will contact you shortly!`);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.suggestion-container')) {
        setShowPickupSuggestions(false);
        setShowDestinationSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>🚗 Book Your Taxi</h1>

        <form onSubmit={(e) => { e.preventDefault(); handleBookRide(); }}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>📍 Pickup Location</label>
            <div style={suggestionContainerStyle} className="suggestion-container">
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="Enter UK pickup address (min 3 chars...)"
                  value={pickup}
                  onChange={(e) => handlePickupChange(e.target.value)}
                  onFocus={() => {
                    if (pickup.length >= 3) {
                      setShowPickupSuggestions(true);
                    }
                  }}
                />
                {isLoadingPickup && (
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    🔍 Searching...
                  </div>
                )}
              </div>
              {showPickupSuggestions && pickupSuggestions.length > 0 && (
                <div style={suggestionsListStyle}>
                  {pickupSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      style={suggestionItemStyle}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectPickupSuggestion(suggestion);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      📍 {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>🎯 Destination</label>
            <div style={suggestionContainerStyle} className="suggestion-container">
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="UK destination address (min 3 chars...)"
                  value={destination}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  onFocus={() => {
                    if (destination.length >= 3) {
                      setShowDestinationSuggestions(true);
                    }
                  }}
                />
                {isLoadingDestination && (
                  <div style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    🔍 Searching...
                  </div>
                )}
              </div>
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div style={suggestionsListStyle}>
                  {destinationSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      style={suggestionItemStyle}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectDestinationSuggestion(suggestion);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      🎯 {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>🚙 Ride Type</label>
            <div style={rideOptionsStyle}>
              <div
                style={rideType === 'economy' ? selectedRideOptionStyle : rideOptionStyle}
                onClick={() => setRideType('economy')}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚗</div>
                <div style={{ fontWeight: '600' }}>Economy</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{UKConfig.pricing.economy.displayRange}</div>
              </div>

              <div
                style={rideType === 'standard' ? selectedRideOptionStyle : rideOptionStyle}
                onClick={() => setRideType('standard')}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚙</div>
                <div style={{ fontWeight: '600' }}>Standard</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{UKConfig.pricing.standard.displayRange}</div>
              </div>

              <div
                style={rideType === 'executive' ? selectedRideOptionStyle : rideOptionStyle}
                onClick={() => setRideType('executive')}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚗</div>
                <div style={{ fontWeight: '600' }}>Executive</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{UKConfig.pricing.executive.displayRange}</div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={buttonStyle}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Book Taxi Now
          </button>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>🇬🇧 UK Address Search Tips:</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
            <li>Try "Heathrow" for London Heathrow Airport</li>
            <li>Type "Oxford Street" for London shopping</li>
            <li>Search "Manchester" for Manchester locations</li>
            <li>Use postcodes like "SW1A 1AA" for precise locations</li>
            <li>Minimum 3 characters required for search</li>
            <li>Real UK addresses powered by OpenStreetMap</li>
          </ul>

          <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#e0f2fe', borderRadius: '4px', fontSize: '0.75rem' }}>
            <strong>🔍 Search Status:</strong><br />
            Pickup: {isLoadingPickup ? 'Searching...' : `${pickupSuggestions.length} suggestions`} | Show: {showPickupSuggestions.toString()}<br />
            Destination: {isLoadingDestination ? 'Searching...' : `${destinationSuggestions.length} suggestions`} | Show: {showDestinationSuggestions.toString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRide;