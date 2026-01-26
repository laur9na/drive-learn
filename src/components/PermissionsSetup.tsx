import { useState } from 'react';
import { Mic, MapPin, CheckCircle2, XCircle, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionsSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function PermissionsSetup({ onComplete, onSkip }: PermissionsSetupProps) {
  const {
    status,
    requestMicrophone,
    requestGeolocation,
  } = usePermissions();

  const [requesting, setRequesting] = useState<'microphone' | 'geolocation' | null>(null);

  const handleRequestMicrophone = async () => {
    setRequesting('microphone');
    await requestMicrophone();
    setRequesting(null);
  };

  const handleRequestGeolocation = async () => {
    setRequesting('geolocation');
    await requestGeolocation();
    setRequesting(null);
  };

  const handleContinue = () => {
    // Mark as checked and continue
    localStorage.setItem('drivelearn_permissions_checked', 'true');
    onComplete();
  };

  const allGranted = status.microphone === 'granted' && status.geolocation === 'granted';
  const anyDenied = status.microphone === 'denied' || status.geolocation === 'denied';

  const getStatusIcon = (permissionStatus: PermissionState) => {
    switch (permissionStatus) {
      case 'granted':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Enable Permissions</CardTitle>
          <CardDescription>
            DriveLearn needs access to your microphone and location for the best learning experience.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Microphone Permission */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Mic className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Microphone</p>
                <p className="text-sm text-gray-500">For voice answers and help requests</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.microphone)}
              {status.microphone === 'prompt' && (
                <Button
                  size="sm"
                  onClick={handleRequestMicrophone}
                  disabled={requesting === 'microphone'}
                >
                  {requesting === 'microphone' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Enable'
                  )}
                </Button>
              )}
              {status.microphone === 'granted' && (
                <span className="text-sm text-green-600">Enabled</span>
              )}
              {status.microphone === 'denied' && (
                <span className="text-sm text-red-600">Denied</span>
              )}
            </div>
          </div>

          {/* Location Permission */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm text-gray-500">To calculate your drive time</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.geolocation)}
              {status.geolocation === 'prompt' && (
                <Button
                  size="sm"
                  onClick={handleRequestGeolocation}
                  disabled={requesting === 'geolocation'}
                >
                  {requesting === 'geolocation' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Enable'
                  )}
                </Button>
              )}
              {status.geolocation === 'granted' && (
                <span className="text-sm text-green-600">Enabled</span>
              )}
              {status.geolocation === 'denied' && (
                <span className="text-sm text-red-600">Denied</span>
              )}
            </div>
          </div>

          {/* Denied Warning */}
          {anyDenied && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                Some permissions were denied. You can enable them later in your browser settings.
                The app will still work with limited features.
              </p>
            </div>
          )}

          {/* Continue Button */}
          <div className="pt-4 space-y-2">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleContinue}
            >
              {allGranted ? 'Continue' : 'Continue Anyway'}
            </Button>

            {onSkip && !allGranted && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={onSkip}
              >
                Skip for Now
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-gray-400">
            Your privacy is important. We only use these permissions during active learning sessions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
