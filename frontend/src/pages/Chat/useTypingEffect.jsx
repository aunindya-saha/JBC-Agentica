// src/hooks/useTypingEffect.js
import { useEffect, useState, useRef } from "react";

export default function useTypingEffect(text, speed = 10, interruptSignal) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      indexRef.current = 0;
      return;
    }

    if (interruptSignal) {
      setDisplayed(text);
      clearInterval(intervalRef.current);
      indexRef.current = text.length;
      return;
    }

    setDisplayed(text.charAt(0));
    indexRef.current = 1;

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const currentIndex = indexRef.current;
      if (currentIndex >= text.length) {
        clearInterval(intervalRef.current);
        return;
      }
      setDisplayed((prev) => prev + text.charAt(currentIndex));
      indexRef.current += 1;
    }, speed);

    return () => clearInterval(intervalRef.current);
  }, [text, speed, interruptSignal]);

  return displayed;
}
