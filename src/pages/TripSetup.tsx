import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Clock, Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClass } from '@/hooks/useClasses';
import { useQuestions } from '@/hooks/useQuestions';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRouteCalculation } from '@/hooks/useRouteCalculation';

export default function TripSetup() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const { data: classData, isLoading: classLoading } = useClass(classId);
  const { data: questions } = useQuestions(classId);
  const { coordinates, loading: locationLoading, error: locationError, requestLocation } = useGeolocation();
  const {
    route,
    loading: routeLoading,
    error: routeError,
    placeSuggestions,
    searchingPlaces,
    calculateDriveTime,
    searchDestinations,
  } = useRouteCalculation();

  const [destination, setDestination] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  const availableQuestions = questions?.length ?? 0;

  // Request location on mount
  useEffect(() => {
    requestLocation().catch(() => {});
  }, [requestLocation]);

  // Debounce destination search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (destination.length >= 3) {
        searchDestinations(destination);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [destination, searchDestinations]);

  // Calculate route when destination is selected
  const handleCalculateRoute = useCallback(async () => {
    if (!coordinates || !destination.trim()) return;

    const result = await calculateDriveTime(coordinates, destination);
    if (result) {
      // Limit to available questions
      const count = Math.min(result.suggestedQuestionCount, availableQuestions);
      setQuestionCount(count);
    }
  }, [coordinates, destination, calculateDriveTime, availableQuestions]);

  const handleSelectSuggestion = (suggestion: { description: string }) => {
    setDestination(suggestion.description);
    setShowSuggestions(false);
    // Auto-calculate after selection
    setTimeout(() => handleCalculateRoute(), 100);
  };

  const handleStartSession = () => {
    if (!classId || !questionCount) return;
    navigate(`/commute/${classId}?questions=${questionCount}`);
  };

  // Loading state
  if (classLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(`/classes/${classId}`)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Class
          </Button>

          <div className="text-center">
            <Navigation className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Plan Your Learning Trip</h1>
            <p className="text-gray-500">
              {classData?.name} - {availableQuestions} questions available
            </p>
          </div>
        </div>

        {/* Location Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-500" />
              Your Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locationLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Getting your location...
              </div>
            ) : locationError ? (
              <div className="space-y-2">
                <p className="text-red-500 text-sm">{locationError}</p>
                <Button variant="outline" size="sm" onClick={() => requestLocation()}>
                  Try Again
                </Button>
              </div>
            ) : coordinates ? (
              <p className="text-green-600">
                Location found ({coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)})
              </p>
            ) : (
              <Button variant="outline" onClick={() => requestLocation()}>
                Enable Location
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Destination Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5 text-purple-500" />
              Destination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destination">Where are you driving to?</Label>
              <div className="relative">
                <Input
                  id="destination"
                  placeholder="Enter destination address..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onFocus={() => destination.length >= 3 && setShowSuggestions(true)}
                  disabled={!coordinates}
                />

                {/* Suggestions dropdown */}
                {showSuggestions && placeSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {placeSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.placeId}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        <p className="font-medium">{suggestion.mainText}</p>
                        <p className="text-sm text-gray-500">{suggestion.secondaryText}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {searchingPlaces && (
                <p className="text-sm text-gray-500">Searching...</p>
              )}
            </div>

            <Button
              onClick={handleCalculateRoute}
              disabled={!coordinates || !destination.trim() || routeLoading}
              className="w-full"
            >
              {routeLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Calculate Drive Time'
              )}
            </Button>

            {routeError && (
              <p className="text-red-500 text-sm">{routeError}</p>
            )}
          </CardContent>
        </Card>

        {/* Route Info Card */}
        {route && (
          <Card className="mb-6 border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <Clock className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{route.durationText}</p>
                  <p className="text-sm text-gray-500">Drive Time</p>
                </div>
                <div className="text-center">
                  <Brain className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{questionCount}</p>
                  <p className="text-sm text-gray-500">Questions</p>
                </div>
              </div>

              <p className="text-center text-sm text-gray-600 mb-4">
                Distance: {route.distanceText}
              </p>

              {questionCount && questionCount < route.suggestedQuestionCount && (
                <p className="text-center text-sm text-amber-600 mb-4">
                  Limited to {availableQuestions} available questions
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Start Button */}
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
          onClick={handleStartSession}
          disabled={!route || !questionCount}
        >
          Start Learning Session
        </Button>

        {/* Safety Notice */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Questions will be read aloud. Keep your eyes on the road.
        </p>
      </div>
    </div>
  );
}
