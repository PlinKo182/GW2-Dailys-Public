import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { formatTime } from '../../utils/timeUtils';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { formatPriceWithImages } from '../../utils/priceUtils';

const EventCard = ({ event, isCompleted = false, onToggle, itemPrices }) => {
  const [currentStatus, setCurrentStatus] = React.useState({
    active: false,
    upcoming: false
  });

  React.useEffect(() => {
    if (!event) return;

    const updateStatus = () => {
      const now = new Date();
      const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
      
      setCurrentStatus({
        active: startTime <= now && endTime >= now,
        upcoming: startTime > now
      });
    };

    // Atualiza status inicial
    updateStatus();

    // Atualiza a cada segundo
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [event]);

  if (!event) return null;

  const { active: eventActive, upcoming: eventUpcoming } = currentStatus;
  
  // Função para renderizar uma única recompensa
  const renderSingleReward = (reward, index) => {
    if (!reward) return null;

    if (reward.type === 'item' && reward.itemId) {
      return (
        <div key={index} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <a 
              href={reward.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              <span className="hover:underline">{reward.name}</span>
            </a>
          </div>
          <div className="flex items-center gap-1">
            {itemPrices[reward.itemId] !== undefined ? (
              formatPriceWithImages(itemPrices[reward.itemId])
            ) : (
              <span className="text-yellow-400 text-xs">Loading...</span>
            )}
          </div>
        </div>
      );
    } else if (reward.type === 'item') {
      return (
        <div key={index} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <a 
              href={reward.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              <span className="hover:underline">{reward.name}</span>
            </a>
          </div>
          <span className="text-yellow-400">({reward.price})</span>
        </div>
      );
    } else if (reward.amount && reward.currency) {
      return (
        <div key={index} className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Currency reward:</span>
          <div className="flex items-center gap-1">
            <span className={reward.currency === 'gold' ? 'text-yellow-400' : 'text-yellow-400'}>
              {reward.amount}
            </span>
            {reward.currency === 'gold' ? (
              <>
                <img 
                  src="https://wiki.guildwars2.com/images/d/d1/Gold_coin.png" 
                  alt="Gold coin" 
                  className="w-4 h-4 object-contain" 
                />
              </>
            ) : (
              <>
                <img 
                  src="https://wiki.guildwars2.com/images/b/b5/Mystic_Coin.png" 
                  alt="Mystic Coin" 
                  className="w-4 h-4 object-contain" 
                />
              </>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Função para renderizar todas as recompensas
  const renderRewards = () => {
    const rewards = Array.isArray(event.rewards) ? event.rewards : [];
    
    if (rewards.length === 0) return null;

    return (
      <div className="mt-3">
        <div className="text-xs text-gray-400 font-semibold mb-2">Rewards:</div>
        <div className="space-y-2">
          {rewards.map((reward, index) => renderSingleReward(reward, index))}
        </div>
      </div>
    );
  };

  let statusClass = '';
  let statusText = '';

  if (eventActive) {
    statusClass = 'bg-emerald-500/20 text-emerald-300';
    statusText = 'Ongoing';
  } else if (eventUpcoming) {
    statusClass = 'bg-amber-500/20 text-amber-300';
    statusText = 'Upcoming';
  } else {
    statusClass = 'bg-gray-500/20 text-gray-300';
    statusText = 'Completed';
  }

  const handleToggle = () => {
    if (event.id && event.eventKey) {
      onToggle(event.id, event.eventKey);
    }
  };

  return (
    <div className={`bg-gray-800 rounded-xl overflow-hidden border transition-all duration-300 flex flex-col relative ${
      eventActive 
        ? 'border-emerald-500/70 shadow-[0_0_20px_-3px_rgba(16,185,129,0.35)] bg-emerald-950/20' 
        : 'border-gray-700'
    } hover:shadow-xl hover:-translate-y-1 group ${
      isCompleted ? 'opacity-70' : ''
    }`}>
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={handleToggle}
        className="absolute top-3 right-3 rounded bg-gray-700 border-gray-600 text-emerald-400 focus:ring-emerald-400/50"
      />

            <div className="p-6 flex-grow pt-12">
        <h3 className="text-xl font-bold text-emerald-400 mb-2">
          {event.link ? (
            <a 
              href={event.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline hover:text-emerald-300"
            >
              {event.name || 'Unknown Event'}
            </a>
          ) : (
            event.name || 'Unknown Event'
          )}
        </h3>
        <div className="flex items-center gap-1 text-sm text-gray-400 mb-4">
          <MapPin className="w-4 h-4" />
          {event.location || 'Unknown Location'}
        </div>
        
        {!isCompleted && event.startTime && event.endTime && (
          <CountdownTimer 
            startTime={event.startTime} 
            endTime={event.endTime}
          />
        )}
        
        <div className="text-xs text-gray-400 mb-2">
          {event.startTime ? formatTime(event.startTime) : '--:--'} - {event.endTime ? formatTime(event.endTime) : '--:--'}
        </div>

        {/* EXIBIR MÚLTIPLAS RECOMPENSAS */}
        {renderRewards()}
      </div>
      
      <div className="px-6 pb-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => event.waypoint && copyToClipboard(event.waypoint)}
            className="text-emerald-400 hover:underline text-sm font-mono hover:bg-gray-700 px-2 py-1 rounded transition-colors duration-150"
            title="Click to copy waypoint"
          >
            {event.waypoint || 'No waypoint'}
          </button>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusClass}`}>
            {isCompleted ? 'Completed' : statusText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EventCard);