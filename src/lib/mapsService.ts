interface Coordinates {
  lat: number;
  lng: number;
}

interface RouteInfo {
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

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

/**
 * Calculate route between origin and destination
 * Returns drive time and distance
 */
export async function calculateRoute(
  origin: Coordinates,
  destination: string
): Promise<RouteInfo> {
  // In Electron, use secure IPC
  if (isElectron) {
    return (window as any).electronAPI.calculateRoute(origin, destination);
  }

  // Web version - direct API call (temporary, move to backend later)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;

  // Note: Direct API call won't work from browser due to CORS
  // Using a proxy or backend is recommended for production
  // For now, we'll use the Google Maps JavaScript API

  // Alternative: Use fetch with a CORS proxy for development
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl);
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
  } catch (error) {
    console.error('Route calculation error:', error);
    throw new Error('Failed to calculate route. Please try again.');
  }
}

/**
 * Search for places using autocomplete
 */
export async function searchPlaces(query: string): Promise<PlacePrediction[]> {
  // In Electron, use secure IPC
  if (isElectron) {
    return (window as any).electronAPI.searchPlaces(query);
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${apiKey}`;
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(data.error_message || 'Place search failed');
    }

    return (data.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || '',
    }));
  } catch (error) {
    console.error('Place search error:', error);
    return [];
  }
}

/**
 * Estimate time to read text aloud (TTS)
 * Average speaking rate: ~150 words per minute
 */
export function estimateTTSTime(text: string): number {
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 150;
  return (words / wordsPerMinute) * 60; // seconds
}

/**
 * Calculate recommended question count based on drive duration
 * Time per question = TTS reading time (~15 sec avg) + answer time (~30 sec avg) + feedback (~10 sec)
 * Total ~55 seconds per question
 */
export function calculateQuestionCount(durationMinutes: number): number {
  const secondsPerQuestion = 55; // TTS + thinking + answer + feedback
  const totalSeconds = durationMinutes * 60;
  const count = Math.floor(totalSeconds / secondsPerQuestion);
  // Minimum 3 questions, reasonable cap at 50
  return Math.max(3, Math.min(count, 50));
}
