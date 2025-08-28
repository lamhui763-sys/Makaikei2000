import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'http://api.openweathermap.org/data/2.5';

/**
 * 獲取當前天氣信息
 */
export async function getCurrentWeather(city) {
  try {
    if (!WEATHER_API_KEY) {
      return {
        success: false,
        error: 'Weather API key not configured'
      };
    }

    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units: 'metric',
        lang: 'zh_tw'
      }
    });

    return {
      success: true,
      data: {
        city: response.data.name,
        country: response.data.sys.country,
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        windSpeed: response.data.wind.speed,
        windDirection: response.data.wind.deg,
        visibility: response.data.visibility,
        sunrise: new Date(response.data.sys.sunrise * 1000).toLocaleTimeString(),
        sunset: new Date(response.data.sys.sunset * 1000).toLocaleTimeString()
      }
    };
  } catch (error) {
    console.error('Weather API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 獲取5天天氣預報
 */
export async function getWeatherForecast(city) {
  try {
    if (!WEATHER_API_KEY) {
      return {
        success: false,
        error: 'Weather API key not configured'
      };
    }

    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: city,
        appid: WEATHER_API_KEY,
        units: 'metric',
        lang: 'zh_tw'
      }
    });

    const forecasts = response.data.list.map(item => ({
      date: new Date(item.dt * 1000).toLocaleDateString('zh-TW'),
      time: new Date(item.dt * 1000).toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      temperature: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      windSpeed: item.wind.speed,
      rainProbability: Math.round((item.pop || 0) * 100)
    }));

    return {
      success: true,
      data: {
        city: response.data.city.name,
        country: response.data.city.country,
        forecasts: forecasts
      }
    };
  } catch (error) {
    console.error('Weather Forecast API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 生成天氣建議
 */
export function generateWeatherAdvice(weatherData) {
  if (!weatherData || !weatherData.forecasts) return '';

  const avgTemp = weatherData.forecasts.reduce((sum, f) => sum + f.temperature, 0) / weatherData.forecasts.length;
  const maxTemp = Math.max(...weatherData.forecasts.map(f => f.temperature));
  const minTemp = Math.min(...weatherData.forecasts.map(f => f.temperature));
  const rainDays = weatherData.forecasts.filter(f => f.rainProbability > 50).length;

  let advice = `${weatherData.city}天氣概況：\n`;
  advice += `• 平均溫度：${Math.round(avgTemp)}°C\n`;
  advice += `• 溫度範圍：${minTemp}°C - ${maxTemp}°C\n`;
  
  if (rainDays > 0) {
    advice += `• 預計有${rainDays}天可能下雨，建議攜帶雨具\n`;
  }

  if (avgTemp < 10) {
    advice += `• 溫度偏低，建議攜帶保暖衣物\n`;
  } else if (avgTemp > 30) {
    advice += `• 溫度偏高，建議攜帶防曬用品和輕便衣物\n`;
  } else {
    advice += `• 溫度適中，適合旅遊\n`;
  }

  return advice;
}