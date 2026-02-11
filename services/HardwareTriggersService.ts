// Hardware Triggers Service - Bluetooth, NFC, and Location-based triggers
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';
import { ReminderService } from './ReminderService';
import type { Reminder } from '@/types/reminder';

export interface LocationTrigger {
  latitude: number;
  longitude: number;
  radius: number;
  name: string;
  type: 'arrive' | 'depart' | 'near';
}

export interface BluetoothTrigger {
  deviceId: string;
  deviceName: string;
  action: 'connect' | 'disconnect';
}

export class HardwareTriggersService {
  private static locationSubscription: Location.LocationSubscription | null = null;
  private static isMonitoring = false;
  private static lastLocation: Location.LocationObject | null = null;
  private static triggeredReminders = new Set<string>();

  // Request location permissions
  static async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Anchor needs location access to trigger reminders based on your location.'
        );
        return false;
      }

      // Request background permissions for geofencing
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Background Location',
          'For the best experience, enable "Always" location access to receive reminders when you arrive at locations.'
        );
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Start monitoring location for triggers
  static async startLocationMonitoring(userId: string, onTrigger: (reminder: Reminder) => void) {
    if (this.isMonitoring) return;

    const hasPermission = await this.requestLocationPermissions();
    if (!hasPermission) return;

    try {
      this.isMonitoring = true;

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 100, // Update every 100 meters
          timeInterval: 60000, // Or every minute
        },
        async (location) => {
          this.lastLocation = location;
          await this.checkLocationTriggers(userId, location, onTrigger);
        }
      );

      console.log('Location monitoring started');
    } catch (error) {
      console.error('Error starting location monitoring:', error);
      this.isMonitoring = false;
    }
  }

  // Stop location monitoring
  static stopLocationMonitoring() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isMonitoring = false;
    this.triggeredReminders.clear();
    console.log('Location monitoring stopped');
  }

  // Check if any reminders should trigger based on location
  private static async checkLocationTriggers(
    userId: string,
    location: Location.LocationObject,
    onTrigger: (reminder: Reminder) => void
  ) {
    try {
      const nearbyReminders = await ReminderService.getByLocation(
        userId,
        location.coords.latitude,
        location.coords.longitude,
        1000 // Check within 1km
      );

      for (const reminder of nearbyReminders) {
        if (!reminder.locationTrigger || this.triggeredReminders.has(reminder.id)) continue;

        const { latitude, longitude, radius, type } = reminder.locationTrigger;
        const distance = this.calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          latitude,
          longitude
        );

        // Check if within trigger radius
        if (distance <= radius) {
          if (type === 'arrive' || type === 'near') {
            this.triggeredReminders.add(reminder.id);
            onTrigger(reminder);
            console.log(`Triggered reminder: ${reminder.title} (${distance}m away)`);
          }
        } else if (distance > radius && type === 'depart') {
          if (this.triggeredReminders.has(reminder.id)) {
            this.triggeredReminders.delete(reminder.id);
          }
        }
      }
    } catch (error) {
      console.error('Error checking location triggers:', error);
    }
  }

  // Add location trigger to reminder
  static async addLocationTrigger(
    reminderId: string,
    trigger: LocationTrigger
  ): Promise<void> {
    await ReminderService.update(reminderId, {
      locationTrigger: trigger as any,
    });
  }

  // Get current location
  static async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) return null;

      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Reverse geocode (get address from coordinates)
  static async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        const address = results[0];
        return [address.street, address.city, address.region]
          .filter(Boolean)
          .join(', ');
      }
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  // Search for places (forward geocode)
  static async searchPlaces(query: string): Promise<Array<{ name: string; latitude: number; longitude: number }>> {
    try {
      const results = await Location.geocodeAsync(query);
      return results.map((result, index) => ({
        name: query,
        latitude: result.latitude,
        longitude: result.longitude,
      }));
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Add Bluetooth trigger (placeholder - requires native module)
  static async addBluetoothTrigger(reminderId: string, trigger: BluetoothTrigger): Promise<void> {
    if (Platform.OS === 'web') {
      console.warn('Bluetooth triggers not supported on web');
      return;
    }

    await ReminderService.update(reminderId, {
      bluetoothTrigger: trigger as any,
    });

    console.log('Bluetooth trigger added (native implementation required)');
  }

  // Add NFC trigger (placeholder - requires native module)
  static async addNFCTrigger(reminderId: string, nfcTag: string): Promise<void> {
    if (Platform.OS === 'web') {
      console.warn('NFC triggers not supported on web');
      return;
    }

    await ReminderService.update(reminderId, {
      nfcTrigger: nfcTag,
    });

    console.log('NFC trigger added (native implementation required)');
  }

  // Get nearby category locations (e.g., "any pharmacy")
  static async getNearbyPlaces(
    category: string,
    radius: number = 5000
  ): Promise<Array<{ name: string; latitude: number; longitude: number; distance: number }>> {
    const location = this.lastLocation || await this.getCurrentLocation();
    if (!location) return [];

    // This would integrate with a places API (Google Places, Mapbox, etc.)
    // For now, return a placeholder
    console.log(`Searching for ${category} within ${radius}m`);

    // In production, integrate with Places API:
    // const results = await PlacesAPI.search({
    //   location: { lat: location.coords.latitude, lng: location.coords.longitude },
    //   radius,
    //   type: category,
    // });

    return [];
  }
}
