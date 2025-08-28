import axios from 'axios';

class AmadeusService {
  constructor() {
    this.apiKey = process.env.AMADEUS_API_KEY;
    this.apiSecret = process.env.AMADEUS_API_SECRET;
    this.baseURL = 'https://test.api.amadeus.com/v1';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', 
        `grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.apiSecret}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Amadeus access token:', error.message);
      throw error;
    }
  }

  async searchFlights(origin, destination, departureDate, returnDate = null) {
    try {
      const token = await this.getAccessToken();
      
      const params = {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departureDate,
        adults: '1',
        currencyCode: 'HKD',
        max: '10'
      };

      if (returnDate) {
        params.returnDate = returnDate;
      }

      const response = await axios.get(`${this.baseURL}/shopping/flight-offers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });

      return response.data.data.map(flight => ({
        id: flight.id,
        airline: flight.itineraries[0].segments[0].carrierCode,
        flightNumber: flight.itineraries[0].segments[0].number,
        departureAirport: flight.itineraries[0].segments[0].departure.iataCode,
        arrivalAirport: flight.itineraries[0].segments[0].arrival.iataCode,
        departureTime: flight.itineraries[0].segments[0].departure.at,
        arrivalTime: flight.itineraries[0].segments[0].arrival.at,
        price: flight.price.total,
        currency: flight.price.currency,
        bookingUrl: `https://www.amadeus.com/flights/${flight.id}`
      }));
    } catch (error) {
      console.error('Failed to search flights:', error.message);
      return [];
    }
  }

  async searchHotels(cityCode, checkInDate, checkOutDate) {
    try {
      const token = await this.getAccessToken();
      
      // 首先搜索酒店列表
      const hotelListResponse = await axios.get(`${this.baseURL}/reference-data/locations/hotels/by-city`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          cityCode: cityCode
        }
      });

      const hotels = hotelListResponse.data.data.slice(0, 10); // 限制前10個酒店
      const hotelResults = [];

      for (const hotel of hotels) {
        try {
          // 搜索酒店價格
          const priceResponse = await axios.get(`${this.baseURL}/shopping/hotel-offers`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              hotelIds: hotel.hotelId,
              checkInDate: checkInDate,
              checkOutDate: checkOutDate,
              adults: '1',
              currencyCode: 'HKD'
            }
          });

          if (priceResponse.data.data && priceResponse.data.data.length > 0) {
            const offer = priceResponse.data.data[0];
            hotelResults.push({
              hotelId: hotel.hotelId,
              name: hotel.name,
              address: hotel.address,
              rating: hotel.rating,
              price: offer.offers[0].price.total,
              currency: offer.offers[0].price.currency,
              availability: true,
              bookingUrl: `https://www.amadeus.com/hotels/${hotel.hotelId}`
            });
          }
        } catch (error) {
          console.error(`Failed to get price for hotel ${hotel.hotelId}:`, error.message);
        }
      }

      return hotelResults;
    } catch (error) {
      console.error('Failed to search hotels:', error.message);
      return [];
    }
  }

  async getCityCode(cityName) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/reference-data/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          keyword: cityName,
          subType: 'CITY'
        }
      });

      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0].iataCode;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get city code:', error.message);
      return null;
    }
  }
}

export const amadeusService = new AmadeusService();