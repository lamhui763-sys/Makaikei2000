import axios from 'axios';
import dayjs from 'dayjs';

class AmadeusService {
  constructor() {
    this.baseURL = process.env.AMADEUS_API_URL || 'https://test.api.amadeus.com/v1';
    this.clientId = process.env.AMADEUS_CLIENT_ID;
    this.clientSecret = process.env.AMADEUS_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && dayjs().isBefore(this.tokenExpiry)) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', 
        `grant_type=client_credentials&client_id=${this.clientId}&client_secret=${this.clientSecret}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = dayjs().add(response.data.expires_in, 'second');
      
      return this.accessToken;
    } catch (error) {
      console.error('獲取Amadeus訪問令牌失敗:', error.response?.data || error.message);
      throw new Error('無法獲取API訪問權限');
    }
  }

  async searchFlights(origin, destination, departureDate, returnDate = null, adults = 1) {
    try {
      const token = await this.getAccessToken();
      
      const params = {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departureDate,
        adults: adults,
        max: 20,
        currencyCode: 'HKD'
      };

      if (returnDate) {
        params.returnDate = returnDate;
      }

      const response = await axios.get(`${this.baseURL}/shopping/flight-offers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: params
      });

      return response.data.data.map(offer => ({
        id: offer.id,
        airline: offer.itineraries[0].segments[0].carrierCode,
        flightNumber: offer.itineraries[0].segments[0].number,
        departureAirport: offer.itineraries[0].segments[0].departure.iataCode,
        arrivalAirport: offer.itineraries[0].segments[0].arrival.iataCode,
        departureTime: offer.itineraries[0].segments[0].departure.at,
        arrivalTime: offer.itineraries[0].segments[0].arrival.at,
        price: parseFloat(offer.price.total),
        currency: offer.price.currency,
        bookingUrl: `https://www.amadeus.com/flights/${offer.id}`
      }));
    } catch (error) {
      console.error('搜索航班失敗:', error.response?.data || error.message);
      throw new Error('搜索航班時發生錯誤');
    }
  }

  async searchHotels(cityCode, checkInDate, checkOutDate, adults = 1) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/reference-data/locations/hotels/by-city`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          cityCode: cityCode,
          radius: 5,
          radiusUnit: 'KM'
        }
      });

      const hotels = response.data.data;
      const hotelOffers = [];

      // 獲取酒店報價
      for (const hotel of hotels.slice(0, 10)) { // 限制前10個酒店
        try {
          const offerResponse = await axios.get(`${this.baseURL}/shopping/hotel-offers`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              hotelIds: hotel.hotelId,
              checkInDate: checkInDate,
              checkOutDate: checkOutDate,
              adults: adults,
              currencyCode: 'HKD'
            }
          });

          if (offerResponse.data.data && offerResponse.data.data.length > 0) {
            const offer = offerResponse.data.data[0];
            hotelOffers.push({
              id: offer.hotel.hotelId,
              name: offer.hotel.name,
              rating: offer.hotel.rating,
              address: offer.hotel.address,
              amenities: offer.hotel.amenities,
              price: parseFloat(offer.offers[0].price.total),
              currency: offer.offers[0].price.currency,
              bookingUrl: `https://www.amadeus.com/hotels/${offer.hotel.hotelId}`
            });
          }
        } catch (error) {
          console.warn(`獲取酒店 ${hotel.hotelId} 報價失敗:`, error.message);
        }
      }

      return hotelOffers;
    } catch (error) {
      console.error('搜索酒店失敗:', error.response?.data || error.message);
      throw new Error('搜索酒店時發生錯誤');
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
      
      throw new Error(`未找到城市: ${cityName}`);
    } catch (error) {
      console.error('獲取城市代碼失敗:', error.response?.data || error.message);
      throw new Error(`無法獲取城市 ${cityName} 的代碼`);
    }
  }

  async getAirportCode(airportName) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/reference-data/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          keyword: airportName,
          subType: 'AIRPORT'
        }
      });

      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0].iataCode;
      }
      
      throw new Error(`未找到機場: ${airportName}`);
    } catch (error) {
      console.error('獲取機場代碼失敗:', error.response?.data || error.message);
      throw new Error(`無法獲取機場 ${airportName} 的代碼`);
    }
  }
}

export default new AmadeusService();