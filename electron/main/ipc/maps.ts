import { ipcMain } from 'electron';

// API key is only accessible in main process - NOT exposed to renderer
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

interface RouteResult {
  durationMinutes: number;
  distanceKm: number;
  durationText: string;
  distanceText: string;
}

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export function setupMapsHandlers() {
  // Calculate route between origin and destination
  ipcMain.handle('maps:calculateRoute', async (_, origin: { lat: number; lng: number }, destination: string): Promise<RouteResult> => {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.routes?.length) {
        throw new Error(data.error_message || 'No route found');
      }

      const route = data.routes[0].legs[0];
      return {
        durationMinutes: Math.ceil(route.duration.value / 60),
        distanceKm: parseFloat((route.distance.value / 1000).toFixed(1)),
        durationText: route.duration.text,
        distanceText: route.distance.text,
      };
    } catch (error: any) {
      console.error('Maps API error:', error);
      throw new Error(error.message || 'Failed to calculate route');
    }
  });

  // Search for places using autocomplete
  ipcMain.handle('maps:searchPlaces', async (_, query: string): Promise<PlacePrediction[]> => {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    if (!query || query.length < 3) {
      return [];
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Places API error:', data.error_message);
        return [];
      }

      return (data.predictions || []).map((p: any) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || '',
      }));
    } catch (error: any) {
      console.error('Places API error:', error);
      return [];
    }
  });
}
