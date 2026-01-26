interface ElectronAPI {
  // OpenAI calls (secure - no API key exposed)
  generateQuestions: (text: string, isImage?: boolean) => Promise<string>;
  askAI: (question: string, context: { currentTopic?: string; conversationHistory?: any[] }) => Promise<{ answer: string; searchResults: any[] | null }>;

  // Maps calls (secure - no API key exposed)
  calculateRoute: (origin: { lat: number; lng: number }, destination: string) => Promise<{
    durationMinutes: number;
    distanceKm: number;
    durationText: string;
    distanceText: string;
  }>;
  searchPlaces: (query: string) => Promise<Array<{
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
  }>>;

  // Auth callback
  onAuthCallback: (callback: (url: string) => void) => void;
  removeAuthCallback: () => void;

  // App info
  isElectron: boolean;
  getVersion: () => Promise<string>;
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
