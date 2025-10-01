import React, { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { convertUTCTimeToLocal } from '../../utils/timeUtils';

const TaskTimer = ({ availability, currentTime, inline = false }) => {
  const [nextAvailableTime, setNextAvailableTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentWindow, setCurrentWindow] = useState(null);

  // Calcular disponibilidade apenas quando availability ou currentTime mudarem
  const availabilityInfo = useMemo(() => {
    if (!availability || !availability.times) return null;

    const now = currentTime || new Date();
    let nextTime = null;
    let currentWindowTemp = null;
    let isAvailableTemp = false;

    // Converter horários UTC para locais
    const localTimes = availability.times.map(utcTime => {
      return convertUTCTimeToLocal(utcTime);
    });

    // Verificar se estamos em alguma janela de disponibilidade
    for (const time of localTimes) {
      const eventTime = new Date(time);
      const endTime = new Date(eventTime.getTime() + availability.duration * 60000);

      // Se o evento está acontecendo agora
      if (eventTime <= now && endTime >= now) {
        isAvailableTemp = true;
        currentWindowTemp = { start: eventTime, end: endTime };
        break;
      }

      // Se o evento é no futuro
      if (eventTime > now) {
        if (!nextTime || eventTime < nextTime) {
          nextTime = eventTime;
        }
      }
    }

    // Se não estamos em nenhuma janela atual
    if (!isAvailableTemp && !currentWindowTemp) {
      if (nextTime) {
        currentWindowTemp = null;
      } else {
        // Se não há próximo hoje, usar o primeiro de amanhã
        const firstTimeTomorrow = convertUTCTimeToLocal(availability.times[0]);
        firstTimeTomorrow.setDate(firstTimeTomorrow.getDate() + 1);
        nextTime = firstTimeTomorrow;
      }
    }

    return {
      isAvailable: isAvailableTemp,
      currentWindow: currentWindowTemp,
      nextAvailableTime: nextTime ? { 
        start: nextTime, 
        end: new Date(nextTime.getTime() + availability.duration * 60000) 
      } : null
    };
  }, [availability, currentTime]);

  useEffect(() => {
    if (availabilityInfo) {
      setIsAvailable(availabilityInfo.isAvailable);
      setCurrentWindow(availabilityInfo.currentWindow);
      setNextAvailableTime(availabilityInfo.nextAvailableTime);
    }
  }, [availabilityInfo]);

  // Timer separado que não afeta o estado principal
  useEffect(() => {
    if (!availability) return;

    const updateTimer = () => {
      const now = new Date();
      
      if (currentWindow) {
        // Estamos em uma janela ativa - calcular tempo restante
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
        // Esperando pela próxima janela
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
  }, [currentWindow, nextAvailableTime, availability]);

  if (!availability) return null;

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
