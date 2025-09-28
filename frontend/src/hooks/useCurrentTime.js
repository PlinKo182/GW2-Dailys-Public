import { useState, useEffect } from 'react';

export const useCurrentTime = (interval = 1000) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return currentTime;
};