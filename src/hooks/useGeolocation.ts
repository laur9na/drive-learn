import { useState, useEffect, useCallback } from 'react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface GeolocationState {
  coordinates: Coordinates | null;
  error: string | null;
  loading: boolean;
  permissionState: PermissionState | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: true,
    permissionState: null,
  });

  // Check permission state
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setState(prev => ({ ...prev, permissionState: result.state }));

        // Listen for permission changes
        result.addEventListener('change', () => {
          setState(prev => ({ ...prev, permissionState: result.state }));
        });
      } catch {
        // Permissions API not supported, will check on request
      }
    };

    checkPermission();
  }, []);

  // Get current position
  const getCurrentPosition = useCallback((): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setState(prev => ({
            ...prev,
            coordinates: coords,
            loading: false,
            permissionState: 'granted',
          }));
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          setState(prev => ({
            ...prev,
            error: errorMessage,
            loading: false,
            permissionState: error.code === error.PERMISSION_DENIED ? 'denied' : prev.permissionState,
          }));
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    });
  }, []);

  // Request location on mount if permission already granted
  useEffect(() => {
    if (state.permissionState === 'granted') {
      getCurrentPosition().catch(() => {});
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.permissionState, getCurrentPosition]);

  const requestLocation = useCallback(async () => {
    try {
      const coords = await getCurrentPosition();
      return coords;
    } catch (error) {
      throw error;
    }
  }, [getCurrentPosition]);

  return {
    coordinates: state.coordinates,
    error: state.error,
    loading: state.loading,
    permissionState: state.permissionState,
    requestLocation,
  };
}
