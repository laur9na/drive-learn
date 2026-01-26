import { useState, useCallback } from 'react';
import { calculateRoute, calculateQuestionCount, searchPlaces } from '@/lib/mapsService';

interface Coordinates {
  lat: number;
  lng: number;
}

interface RouteResult {
  durationMinutes: number;
  distanceKm: number;
  durationText: string;
  distanceText: string;
  suggestedQuestionCount: number;
}

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export function useRouteCalculation() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlacePrediction[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);

  const calculateDriveTime = useCallback(async (
    origin: Coordinates,
    destination: string
  ): Promise<RouteResult | null> => {
    if (!destination.trim()) {
      setError('Please enter a destination');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const routeInfo = await calculateRoute(origin, destination);
      const result: RouteResult = {
        ...routeInfo,
        suggestedQuestionCount: calculateQuestionCount(routeInfo.durationMinutes),
      };
      setRoute(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate route';
      setError(message);
      setRoute(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchDestinations = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setPlaceSuggestions([]);
      return;
    }

    setSearchingPlaces(true);
    try {
      const suggestions = await searchPlaces(query);
      setPlaceSuggestions(suggestions);
    } catch {
      setPlaceSuggestions([]);
    } finally {
      setSearchingPlaces(false);
    }
  }, []);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
    setPlaceSuggestions([]);
  }, []);

  return {
    route,
    loading,
    error,
    placeSuggestions,
    searchingPlaces,
    calculateDriveTime,
    searchDestinations,
    clearRoute,
  };
}
