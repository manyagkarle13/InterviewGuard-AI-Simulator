/**
 * useSpeechSynthesis — Custom hook for Web Speech API text-to-speech output.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export default function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);

      // Prefer a natural-sounding English voice
      const preferred = availableVoices.find(
        (v) => v.lang.startsWith('en') && v.name.includes('Google')
      ) || availableVoices.find(
        (v) => v.lang.startsWith('en') && v.name.includes('Natural')
      ) || availableVoices.find(
        (v) => v.lang.startsWith('en-US')
      ) || availableVoices[0];

      if (preferred) setSelectedVoice(preferred);
    };

    loadVoices();
    synth.onvoiceschanged = loadVoices;

    return () => {
      synth.cancel();
    };
  }, []);

  const speak = useCallback((text, options = {}) => {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = options.rate || 0.95;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      options.onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      options.onError?.();
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [selectedVoice]);

  const stop = useCallback(() => {
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    voices,
    selectedVoice,
    setSelectedVoice,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  };
}
