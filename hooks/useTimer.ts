import { useState, useEffect } from 'react';
export function useTimer(targetTime: number) {
  const [timeLeft, setTimeLeft] = useState(targetTime - Date.now());
  useEffect(() => {
    const interval = setInterval(() => { setTimeLeft(targetTime - Date.now()); }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);
  return timeLeft;
}