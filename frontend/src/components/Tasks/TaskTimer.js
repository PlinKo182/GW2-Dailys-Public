import React, { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { convertUTCTimeToLocal } from '../../utils/timeUtils';

const TaskTimer = ({ availability: timers, currentTime, inline = false }) => {
  const [nextAvailableTime, setNextAvailableTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentWindow, setCurrentWindow] = useState(null);

  const availabilityInfo = useMemo(() => {
    if (!timers || timers.length === 0) return null;

    const now = currentTime || new Date();
    let nextTime = null;
    let nextDuration = 0;
    let currentWindowTemp = null;
    let isAvailableTemp = false;

    for (const timer of timers) {
      if (!timer.times || !timer.times.length) continue;

      const localTimes = timer.times.map(utcTime => convertUTCTimeToLocal(utcTime));

      for (const time of localTimes) {
        const eventTime = new Date(time);
        const endTime = new Date(eventTime.getTime() + timer.duration * 60000);

        if (eventTime <= now && endTime >= now) {
          isAvailableTemp = true;
          currentWindowTemp = { start: eventTime, end: endTime };
          break;
        }

        if (eventTime > now) {
          if (!nextTime || eventTime < nextTime) {
            nextTime = eventTime;
            nextDuration = timer.duration;
          }
        }
      }
      if (isAvailableTemp) break;
    }

    if (!isAvailableTemp && !currentWindowTemp) {
      if (!nextTime && timers.length > 0 && timers[0].times.length > 0) {
        const firstTimeTomorrow = convertUTCTimeToLocal(timers[0].times[0]);
        firstTimeTomorrow.setDate(firstTimeTomorrow.getDate() + 1);
        nextTime = firstTimeTomorrow;
        nextDuration = timers[0].duration;
      }
    }

    return {
      isAvailable: isAvailableTemp,
      currentWindow: currentWindowTemp,
      nextAvailableTime: nextTime ? { 
        start: nextTime, 
        end: new Date(nextTime.getTime() + nextDuration * 60000)
      } : null
    };
  }, [timers, currentTime]);

  useEffect(() => {
    if (availabilityInfo) {
      setIsAvailable(availabilityInfo.isAvailable);
      setCurrentWindow(availabilityInfo.currentWindow);
      setNextAvailableTime(availabilityInfo.nextAvailableTime);
    }
  }, [availabilityInfo]);

  useEffect(() => {
    if (!timers || timers.length === 0) return;

    const updateTimer = () => {
      const now = new Date();
      
      if (currentWindow) {
        const timeDiff = currentWindow.end - now;
        
        if (timeDiff <= 0) {
          setIsAvailable(false);
          setCurrentWindow(null);
          return;
        }

        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        setTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else if (nextAvailableTime) {
        const timeDiff = nextAvailableTime.start - now;

        if (timeDiff <= 0) {
          setIsAvailable(true);
          setCurrentWindow(nextAvailableTime);
          setNextAvailableTime(null);
          return;
        }

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentWindow, nextAvailableTime, timers]);

  if (!timers || timers.length === 0) return null;

  if (isAvailable && currentWindow) {
    if (inline) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 ml-2">
          <Clock className="w-3 h-3" />
          <span>Available now! Ends in: {timeRemaining}</span>
        </span>
      );
    }
    return (
      <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
        <Clock className="w-3 h-3" />
        <span>Available now! Ends in: {timeRemaining}</span>
      </div>
    );
  }

  if (nextAvailableTime) {
    if (inline) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-400 ml-2">
          <Clock className="w-3 h-3" />
          <span>Next available in: {timeRemaining}</span>
        </span>
      );
    }
    return (
      <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
        <Clock className="w-3 h-3" />
        <span>Next available in: {timeRemaining}</span>
      </div>
    );
  }

  return null;
};

export default React.memo(TaskTimer);
