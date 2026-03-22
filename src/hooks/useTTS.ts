import { useState, useRef, useCallback } from "react";

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const abortRef = useRef(false);

  const stop = useCallback(() => {
    abortRef.current = true;
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, language: "en" | "hi" = "en") => {
    stop();
    abortRef.current = false;

    const cleaned = text
      .replace(/[#*_~`]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, " ")
      .trim();

    if (!cleaned || typeof speechSynthesis === "undefined") return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = language === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 0.95;
    utterance.onstart = () => {
      if (!abortRef.current) setIsSpeaking(true);
    };
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  }, [stop]);

  return { speak, stop, isSpeaking };
}
