// UK-specific configuration for GoCars
export const UKConfig = {
  // Currency settings
  currency: {
    symbol: '£',
    code: 'GBP',
    name: 'British Pound'
  },
  // Pricing structure (in pence, converted to pounds for display)
  pricing: {
    economy: {
      baseFare: 600, // £6.00
      perMile: 180,  // £1.80 per mile
      perMinute: 25, // £0.25 per minute
      displayRange: '£6-10'
    },
    standard: {
      baseFare: 1000, // £10.00
      perMile: 220,   // £2.20 per mile
      perMinute: 35,  // £0.35 per minute
      displayRange: '£10-15'
    },
    executive: {
      baseFare: 1800, // £18.00
      perMile: 350,   // £3.50 per mile
      perMinute: 50,  // £0.50 per minute
      displayRange: '£18-25'
    }
  },
  // UK-specific locations for fallback
  popularLocations: [
    'London Heathrow Airport, Hounslow TW6 1AP',
    'London Gatwick Airport, Horley RH6 0NP',
    'Manchester Airport, Manchester M90 1QX',
    'Birmingham New Street Station, Birmingham B2 4QA',
    'London King\'s Cross Station, London N1C 4TB',
    'London Victoria Station, London SW1V 1JU',
    'Edinburgh Waverley Station, Edinburgh EH1 1BB',
    'Glasgow Central Station, Glasgow G1 3SL',
    'Oxford Street, London W1C 1JN',
    'Regent Street, London W1B 5AH',
    'Piccadilly Circus, London W1J 9HS',
    'Tower Bridge, London SE1 2UP',
    'Buckingham Palace, London SW1A 1AA',
    'Westminster Abbey, London SW1P 3PA',
    'British Museum, London WC1B 3DG',
    'Tate Modern, London SE1 9TG',
    'Canary Wharf, London E14 5AB',
    'Liverpool Street Station, London EC2M 7QH',
    'Paddington Station, London W2 1HB',
    'St Pancras International, London NW1 2QP'
  ],
  // Regional coverage
  regions: {
    england: {
      name: 'England',
      major_cities: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Newcastle']
    },
    scotland: {
      name: 'Scotland', 
      major_cities: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Stirling']
    },
    wales: {
      name: 'Wales',
      major_cities: ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Bangor']
    },
    northern_ireland: {
      name: 'Northern Ireland',
      major_cities: ['Belfast', 'Derry', 'Lisburn', 'Newtownabbey']
    }
  },
  // OpenStreetMap API settings
  geocoding: {
    nominatim_url: 'https://nominatim.openstreetmap.org/search',
    country_code: 'gb',
    user_agent: 'GoCars-UK-TaxiService',
    rate_limit_ms: 300
  },
  // UK-specific settings
  locale: {
    country: 'United Kingdom',
    language: 'en-GB',
    timezone: 'Europe/London',
    date_format: 'DD/MM/YYYY',
    time_format: '24h'
  },
  // Legal compliance
  compliance: {
    gdpr: true,
    data_protection_act: true,
    pco_licensed: true, // Private Hire Vehicle (London)
    hackney_licensed: true // Hackney Carriage licensing
  },
  // Emergency and support
  emergency: {
    police: '999',
    non_emergency_police: '101',
    support_hours: '24/7',
    support_phone: '+44 20 7946 0958'
  }
};

// Helper functions for UK-specific formatting
export const formatUKCurrency = (pence: number): string => {
  return `£${(pence / 100).toFixed(2)}`;
};

export const formatUKPostcode = (postcode: string): string => {
  // Basic UK postcode formatting
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  if (cleaned.length >= 5) {
    return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
  }
  return postcode;
};

export const isValidUKPostcode = (postcode: string): boolean => {
  const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
  return ukPostcodeRegex.test(postcode.replace(/\s/g, ''));
};