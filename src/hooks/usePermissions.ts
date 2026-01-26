import { useState, useEffect, useCallback } from 'react';

type PermissionType = 'microphone' | 'geolocation';

interface PermissionStatus {
  microphone: PermissionState;
  geolocation: PermissionState;
}

const PERMISSIONS_CHECKED_KEY = 'drivelearn_permissions_checked';

export function usePermissions() {
  const [status, setStatus] = useState<PermissionStatus>({
    microphone: 'prompt',
    geolocation: 'prompt',
  });
  const [loading, setLoading] = useState(true);
  const [allGranted, setAllGranted] = useState(false);

  // Check if permissions have been checked before
  const hasCheckedPermissions = localStorage.getItem(PERMISSIONS_CHECKED_KEY) === 'true';

  // Check all permission states
  const checkPermissions = useCallback(async () => {
    setLoading(true);

    try {
      // Check microphone permission
      let micStatus: PermissionState = 'prompt';
      try {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        micStatus = micPermission.state;

        // Listen for changes
        micPermission.addEventListener('change', () => {
          setStatus(prev => ({ ...prev, microphone: micPermission.state }));
        });
      } catch {
        // Permissions API not fully supported, will check on request
      }

      // Check geolocation permission
      let geoStatus: PermissionState = 'prompt';
      try {
        const geoPermission = await navigator.permissions.query({ name: 'geolocation' });
        geoStatus = geoPermission.state;

        // Listen for changes
        geoPermission.addEventListener('change', () => {
          setStatus(prev => ({ ...prev, geolocation: geoPermission.state }));
        });
      } catch {
        // Permissions API not fully supported
      }

      const newStatus = {
        microphone: micStatus,
        geolocation: geoStatus,
      };

      setStatus(newStatus);
      setAllGranted(micStatus === 'granted' && geoStatus === 'granted');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Request microphone permission
  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed to trigger the permission
      stream.getTracks().forEach(track => track.stop());
      setStatus(prev => ({ ...prev, microphone: 'granted' }));
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setStatus(prev => ({ ...prev, microphone: 'denied' }));
      return false;
    }
  }, []);

  // Request geolocation permission
  const requestGeolocation = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setStatus(prev => ({ ...prev, geolocation: 'granted' }));
          resolve(true);
        },
        (error) => {
          console.error('Geolocation permission denied:', error);
          setStatus(prev => ({ ...prev, geolocation: 'denied' }));
          resolve(false);
        },
        { timeout: 10000 }
      );
    });
  }, []);

  // Request all permissions at once
  const requestAllPermissions = useCallback(async (): Promise<{ microphone: boolean; geolocation: boolean }> => {
    const [micGranted, geoGranted] = await Promise.all([
      requestMicrophone(),
      requestGeolocation(),
    ]);

    // Mark as checked so we don't show the setup screen again
    localStorage.setItem(PERMISSIONS_CHECKED_KEY, 'true');

    setAllGranted(micGranted && geoGranted);

    return {
      microphone: micGranted,
      geolocation: geoGranted,
    };
  }, [requestMicrophone, requestGeolocation]);

  // Reset permissions checked state (for debugging/settings)
  const resetPermissionsChecked = useCallback(() => {
    localStorage.removeItem(PERMISSIONS_CHECKED_KEY);
  }, []);

  return {
    status,
    loading,
    allGranted,
    hasCheckedPermissions,
    requestMicrophone,
    requestGeolocation,
    requestAllPermissions,
    checkPermissions,
    resetPermissionsChecked,
  };
}
