import { useState, useCallback } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const speak = useCallback((text: string, rate = 1, pitch = 1) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech Synthesis API not supported');
      setIsSupported(false);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.5, Math.min(2, rate)); // Clamp between 0.5 and 2
    utterance.pitch = Math.max(0.5, Math.min(2, pitch)); // Clamp between 0.5 and 2
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    } else {
      window.speechSynthesis.pause();
    }
  }, []);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
    pause,
    getVoices: () => window.speechSynthesis.getVoices(),
  };
};
