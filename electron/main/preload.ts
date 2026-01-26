import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // OpenAI calls (secure - no API key exposed to renderer)
  generateQuestions: (text: string, isImage: boolean = false) =>
    ipcRenderer.invoke('openai:generateQuestions', text, isImage),

  askAI: (question: string, context: { currentTopic?: string; conversationHistory?: any[] }) =>
    ipcRenderer.invoke('openai:askAI', question, context),

  // Maps calls (secure - no API key exposed to renderer)
  calculateRoute: (origin: { lat: number; lng: number }, destination: string) =>
    ipcRenderer.invoke('maps:calculateRoute', origin, destination),

  searchPlaces: (query: string) =>
    ipcRenderer.invoke('maps:searchPlaces', query),

  // Auth callback listener
  onAuthCallback: (callback: (url: string) => void) => {
    ipcRenderer.on('auth-callback', (_, url) => callback(url));
  },

  // Remove auth callback listener
  removeAuthCallback: () => {
    ipcRenderer.removeAllListeners('auth-callback');
  },

  // Check if running in Electron
  isElectron: true,

  // App version
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // Platform info
  platform: process.platform,
});

// Notify renderer that preload is ready
window.addEventListener('DOMContentLoaded', () => {
  console.log('Electron preload script loaded');
});
