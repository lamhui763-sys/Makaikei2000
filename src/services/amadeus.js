import Amadeus from 'amadeus';
import dotenv from 'dotenv';

dotenv.config();

// 初始化Amadeus客戶端
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY,
  clientSecret: process.env.AMADEUS_API_SECRET,
  hostname: process.env.AMADEUS_HOSTNAME || 'test'
});

/**
 * 搜索航班
 */
export async function searchFlights(origin, destination, departureDate, returnDate = null, adults = 1) {
  try {
    const searchParams = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: adults,
      max: 10
    };

    if (returnDate) {
      searchParams.returnDate = returnDate;
    }

    const response = await amadeus.shopping.flightOffersSearch.get(searchParams);
    
    return {
      success: true,
      data: response.data,
      meta: response.meta
    };
  } catch (error) {
    console.error('Amadeus Flight Search Error:', error);
    return {
      success: false,
      error: error.message,
      description: error.description
    };
  }
}

/**
 * 搜索酒店
 */
export async function searchHotels(cityCode, checkInDate, checkOutDate, adults = 1, rooms = 1) {
  try {
    // 首先搜索酒店列表
    const hotelsResponse = await amadeus.shopping.hotelOffers.get({
      cityCode: cityCode,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      adults: adults,
      rooms: rooms
    });

    return {
      success: true,
      data: hotelsResponse.data
    };
  } catch (error) {
    console.error('Amadeus Hotel Search Error:', error);
    return {
      success: false,
      error: error.message,
      description: error.description
    };
  }
}

/**
 * 獲取機場信息
 */
export async function getAirportInfo(keyword) {
  try {
    const response = await amadeus.referenceData.locations.get({
      keyword: keyword,
      subType: 'AIRPORT'
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Amadeus Airport Search Error:', error);
    return {
      success: false,
      error: error.message,
      description: error.description
    };
  }
}

/**
 * 獲取城市信息
 */
export async function getCityInfo(keyword) {
  try {
    const response = await amadeus.referenceData.locations.get({
      keyword: keyword,
      subType: 'CITY'
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Amadeus City Search Error:', error);
    return {
      success: false,
      error: error.message,
      description: error.description
    };
  }
}

/**
 * 獲取景點信息
 */
export async function getPointsOfInterest(latitude, longitude, radius = 10) {
  try {
    const response = await amadeus.referenceData.locations.pointsOfInterest.get({
      latitude: latitude,
      longitude: longitude,
      radius: radius
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Amadeus POI Search Error:', error);
    return {
      success: false,
      error: error.message,
      description: error.description
    };
  }
}

/**
 * 格式化航班結果
 */
export function formatFlightResults(flightData) {
  if (!flightData || !flightData.length) return [];

  return flightData.map(offer => {
    const itinerary = offer.itineraries[0];
    const segment = itinerary.segments[0];
    
    return {
      price: parseFloat(offer.price.total),
      currency: offer.price.currency,
      airline: segment.carrierCode,
      flightNumber: `${segment.carrierCode}${segment.number}`,
      departure: {
        airport: segment.departure.iataCode,
        time: segment.departure.at
      },
      arrival: {
        airport: segment.arrival.iataCode,
        time: segment.arrival.at
      },
      duration: itinerary.duration,
      bookingClass: segment.cabin,
      deepLink: `https://www.amadeus.com/booking/${offer.id}`
    };
  });
}

/**
 * 格式化酒店結果
 */
export function formatHotelResults(hotelData) {
  if (!hotelData || !hotelData.length) return [];

  return hotelData.map(hotel => ({
    name: hotel.hotel.name,
    rating: hotel.hotel.rating,
    price: hotel.offers?.[0]?.price?.total,
    currency: hotel.offers?.[0]?.price?.currency,
    checkIn: hotel.offers?.[0]?.checkInDate,
    checkOut: hotel.offers?.[0]?.checkOutDate,
    amenities: hotel.hotel.amenities || [],
    contact: {
      phone: hotel.hotel.contact?.phone,
      email: hotel.hotel.contact?.email
    },
    address: hotel.hotel.address,
    location: {
      latitude: hotel.hotel.latitude,
      longitude: hotel.hotel.longitude
    },
    bookingUrl: hotel.offers?.[0]?.self || null
  }));
}