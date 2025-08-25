import dayjs from 'dayjs';
import axios from 'axios';

// Placeholder adapters with public APIs; in production you would integrate paid APIs.
async function fetchFlights(country, city, startDate, days, logger) {
  // TODO: Replace with real API (e.g., Duffel, Amadeus). For demo, return sample.
  logger.info('Fetching flights (demo data)');
  return [
    {
      provider: 'DemoAir',
      priceHKD: 3200,
      depart: `${startDate}T08:30`,
      return: `${dayjs(startDate).add(days, 'day').format('YYYY-MM-DD')}T16:45`,
      url: 'https://example.com/flights',
    },
  ];
}

async function fetchHotels(country, city, startDate, days, logger) {
  logger.info('Fetching hotels (demo data)');
  return [
    {
      name: 'Shinjuku Comfort Hotel',
      pricePerNightHKD: 680,
      phone: '+81-3-0000-0000',
      url: 'https://example.com/hotels',
      availability: '有房',
      address: 'Shinjuku, Tokyo',
    },
  ];
}

async function fetchAttractions(country, city, logger) {
  logger.info('Fetching attractions (demo data)');
  return [
    { name: '淺草寺', url: 'https://www.senso-ji.jp/', area: '淺草' },
    { name: '晴空塔', url: 'https://www.tokyo-skytree.jp/', area: '押上' },
    { name: '明治神宮', url: 'https://www.meijijingu.or.jp/', area: '原宿' },
  ];
}

async function fetchTransportGuides(country, city, logger) {
  logger.info('Fetching transport guides (demo data)');
  return [
    { title: '東京地鐵一日券', url: 'https://www.tokyometro.jp/' },
    { title: 'Suica / PASMO 卡指南', url: 'https://www.jreast.co.jp/' },
  ];
}

async function geocodeCity(city, logger) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh-HK`;
    const { data } = await axios.get(url, { timeout: 8000 });
    if (data && data.results && data.results.length > 0) {
      const r = data.results[0];
      return { latitude: r.latitude, longitude: r.longitude };
    }
  } catch (error) {
    logger?.error?.({ error }, 'Geocoding failed');
  }
  return null;
}

function mapWeatherCodeToText(code) {
  const table = {
    0: '晴朗',
    1: '多雲',
    2: '多雲',
    3: '陰天',
    45: '霧',
    48: '霧',
    51: '小毛雨',
    53: '毛雨',
    55: '大毛雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    80: '陣雨',
    81: '陣雨',
    82: '強陣雨',
  };
  return table[code] || '天氣未知';
}

async function fetchWeather(city, startDate, days, logger) {
  try {
    const geo = await geocodeCity(city, logger);
    if (!geo) throw new Error('Geocoding unavailable');
    const start = dayjs(startDate).format('YYYY-MM-DD');
    const end = dayjs(startDate).add(days - 1, 'day').format('YYYY-MM-DD');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${start}&end_date=${end}`;
    const { data } = await axios.get(url, { timeout: 8000 });
    const items = [];
    if (data && data.daily && data.daily.time) {
      for (let i = 0; i < data.daily.time.length; i += 1) {
        items.push({
          date: data.daily.time[i],
          summary: mapWeatherCodeToText(data.daily.weathercode[i]),
          tempMinC: data.daily.temperature_2m_min[i],
          tempMaxC: data.daily.temperature_2m_max[i],
        });
      }
    }
    if (items.length > 0) return items;
    throw new Error('No daily data');
  } catch (error) {
    logger?.warn?.({ error }, 'Weather API failed, falling back to demo');
    const items = [];
    for (let i = 0; i < days; i += 1) {
      const date = dayjs(startDate).add(i, 'day').format('YYYY-MM-DD');
      items.push({ date, summary: '多雲', tempMinC: 22, tempMaxC: 28 });
    }
    return items;
  }
}

export async function aggregateForTrip(trip, logger) {
  const flights = await fetchFlights(trip.country, trip.city, trip.start_date, trip.days, logger);
  const hotels = await fetchHotels(trip.country, trip.city, trip.start_date, trip.days, logger);
  const attractions = await fetchAttractions(trip.country, trip.city, logger);
  const transport = await fetchTransportGuides(trip.country, trip.city, logger);
  const weather = await fetchWeather(trip.city, trip.start_date, trip.days, logger);

  return { flights, hotels, attractions, transport, weather };
}

