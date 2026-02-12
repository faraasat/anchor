// Weather and Traffic Service - Live environment data
import * as Location from 'expo-location';

export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  feelsLike: number;
}

export interface TrafficData {
  duration: string;
  durationInTraffic: string;
  distance: string;
  summary: string;
  incidents: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export class WeatherService {
  private static cachedWeather: WeatherData | null = null;
  private static lastWeatherUpdate: number = 0;
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  // Get current weather
  static async getCurrentWeather(latitude?: number, longitude?: number): Promise<WeatherData | null> {
    try {
      // Check cache
      const now = Date.now();
      if (this.cachedWeather && (now - this.lastWeatherUpdate) < this.CACHE_DURATION) {
        return this.cachedWeather;
      }

      // Get location if not provided
      if (!latitude || !longitude) {
        try {
          // Request location permission first
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            console.log('Location permission not granted, using mock weather');
            return this.getMockWeather();
          }

          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        } catch (locationError) {
          console.log('Location error, using mock weather:', locationError);
          return this.getMockWeather();
        }
      }

      // Real OpenWeatherMap API integration
      const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
      
      if (API_KEY) {
        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=imperial`
          );
          
          if (response.ok) {
            const data = await response.json();
            const weather: WeatherData = {
              temperature: Math.round(data.main.temp),
              condition: data.weather[0].main,
              description: data.weather[0].description,
              icon: this.getWeatherIcon(data.weather[0].main),
              humidity: data.main.humidity,
              windSpeed: Math.round(data.wind.speed),
              precipitation: (data.rain?.['1h'] || 0) * 100, // Convert to percentage
              feelsLike: Math.round(data.main.feels_like),
            };

            this.cachedWeather = weather;
            this.lastWeatherUpdate = now;

            return weather;
          }
        } catch (apiError) {
          console.error('Weather API error:', apiError);
          // Fall through to mock data
        }
      }

      // Fallback to mock data if API key not configured or API fails
      return this.getMockWeather();
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    }
  }

  // Get weather icon based on condition
  private static getWeatherIcon(condition: string): string {
    const iconMap: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '🌨️',
      'Mist': '🌫️',
      'Fog': '🌫️',
    };
    return iconMap[condition] || '⛅';
  }

  // Checmock weather data
  private static getMockWeather(): WeatherData {
    console.log('Using mock weather data (configure EXPO_PUBLIC_OPENWEATHER_API_KEY for real data)');
    const weather: WeatherData = {
      temperature: 68,
      condition: 'Partly Cloudy',
      description: 'Partly cloudy with a chance of rain later',
      icon: '⛅',
      humidity: 65,
      windSpeed: 12,
      precipitation: 20,
      feelsLike: 66,
    };

    this.cachedWeather = weather;
    this.lastWeatherUpdate = Date.now();

    return weather;
  }

  // Get k if weather is suitable for outdoor activity
  static async isGoodWeatherForActivity(activityType: 'outdoor' | 'walking' | 'cycling' | 'running'): Promise<{
    suitable: boolean;
    reason?: string;
  }> {
    const weather = await this.getCurrentWeather();
    if (!weather) return { suitable: true };

    // Check for unsuitable conditions
    if (weather.precipitation > 50) {
      return {
        suitable: false,
        reason: `High chance of rain (${weather.precipitation}%)`,
      };
    }

    if (weather.temperature < 32) {
      return {
        suitable: false,
        reason: 'Temperature below freezing',
      };
    }

    if (weather.temperature > 95) {
      return {
        suitable: false,
        reason: 'Extreme heat warning',
      };
    }

    if (weather.condition.toLowerCase().includes('storm')) {
      return {
        suitable: false,
        reason: 'Storm conditions',
      };
    }

    return { suitable: true };
  }

  // Get traffic duration to destination
  static async getTrafficDuration(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<TrafficData | null> {
    try {
      // In production, use Google Maps Directions API or Mapbox
      // For now, return mock data
      const traffic: TrafficData = {
        duration: '15m',
        durationInTraffic: '22m',
        distance: '8.5 mi',
        summary: 'Moderate traffic on usual route',
        incidents: [
          {
            type: 'Construction',
            description: 'Lane closure on Main St',
            severity: 'medium',
          },
        ],
      };

      // Example API integration:
      // const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      // const response = await fetch(
      //   `https://maps.googleapis.com/maps/api/directions/json?` +
      //   `origin=${origin.latitude},${origin.longitude}&` +
      //   `destination=${destination.latitude},${destination.longitude}&` +
      //   `departure_time=now&` +
      //   `traffic_model=best_guess&` +
      //   `key=${API_KEY}`
      // );
      // const data = await response.json();
      // const route = data.routes[0]?.legs[0];
      // const traffic: TrafficData = {
      //   duration: route.duration.text,
      //   durationInTraffic: route.duration_in_traffic.text,
      //   distance: route.distance.text,
      //   summary: route.summary,
      //   incidents: this.parseTrafficIncidents(data.routes[0]?.warnings || []),
      // };

      return traffic;
    } catch (error) {
      console.error('Error fetching traffic:', error);
      return null;
    }
  }

  // Get commute time to work (saved location)
  static async getCommuteTime(workLocation: { latitude: number; longitude: number }): Promise<string | null> {
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });

      const traffic = await this.getTrafficDuration(
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        workLocation
      );

      return traffic?.durationInTraffic || null;
    } catch (error) {
      console.error('Error getting commute time:', error);
      return null;
    }
  }

  // Get weather forecast for specific date/time
  static async getForecast(date: Date): Promise<WeatherData | null> {
    try {
      // In production, use weather forecast API
      // For now, return current weather
      return this.getCurrentWeather();
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return null;
    }
  }

  // Check if reminder timing should be adjusted based on weather/traffic
  static async suggestReminderAdjustment(
    reminder: {
      dueDate: string;
      dueTime: string;
      tag: string;
      locationTrigger?: any;
    }
  ): Promise<{
    shouldAdjust: boolean;
    suggestion?: string;
    newTime?: string;
  }> {
    // Check if outdoor activity
    const isOutdoor = ['Personal', 'Health', 'Errands'].includes(reminder.tag);

    if (isOutdoor) {
      const weatherCheck = await this.isGoodWeatherForActivity('outdoor');
      if (!weatherCheck.suitable) {
        return {
          shouldAdjust: true,
          suggestion: `Weather alert: ${weatherCheck.reason}. Consider rescheduling this task.`,
        };
      }
    }

    // Check traffic if has location
    if (reminder.locationTrigger) {
      try {
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission not granted for traffic check');
          return { shouldAdjust: false };
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });

        const traffic = await this.getTrafficDuration(
          {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
          {
            latitude: reminder.locationTrigger.latitude,
            longitude: reminder.locationTrigger.longitude,
          }
        );

        if (traffic && traffic.durationInTraffic !== traffic.duration) {
          const [currentHours, currentMinutes] = reminder.dueTime.split(':').map(Number);
          const trafficMinutes = parseInt(traffic.durationInTraffic.replace(/\D/g, ''));
          const normalMinutes = parseInt(traffic.duration.replace(/\D/g, ''));
          const extraTime = trafficMinutes - normalMinutes;

          if (extraTime > 5) {
            const adjustedMinutes = currentMinutes - extraTime;
            const adjustedTime = `${currentHours.toString().padStart(2, '0')}:${Math.max(0, adjustedMinutes).toString().padStart(2, '0')}`;

            return {
              shouldAdjust: true,
              suggestion: `Heavy traffic detected (+${extraTime} min). Leave earlier to arrive on time.`,
              newTime: adjustedTime,
            };
          }
        }
      } catch (locationError) {
        console.log('Error checking traffic:', locationError);
        // Continue without traffic adjustment
      }
    }

    return { shouldAdjust: false };
  }
}
