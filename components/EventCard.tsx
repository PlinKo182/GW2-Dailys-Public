import { useState, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import { CompletedEvent, saveCompletedEvent, removeCompletedEvent, getAllCompletedEvents } from '../utils/storage';
interface EventCardProps { eventId: string; title: string; startTimeUTC: number; }
export const EventCard: React.FC<EventCardProps> = ({ eventId, title, startTimeUTC }) => {
  const timeLeft = useTimer(startTimeUTC);
  const [completed, setCompleted] = useState(false);
  useEffect(() => { const checkCompletion = async () => { const events = await getAllCompletedEvents(); setCompleted(events.some(e => e.eventId===eventId && e.instanceStartUTC===startTimeUTC)); }; checkCompletion(); }, [eventId, startTimeUTC]);
  const handleComplete = async () => { const event: CompletedEvent = { eventId, instanceStartUTC:startTimeUTC, completedAtUTC:Date.now(), by:'user'}; await saveCompletedEvent(event); setCompleted(true); };
  const handleUndo = async () => { const event: CompletedEvent = { eventId, instanceStartUTC:startTimeUTC, completedAtUTC:Date.now(), by:'user'}; await removeCompletedEvent(event); setCompleted(false); };
  return (<div className={`event-card ${completed?'completed':''}`}><h3>{title}</h3><p>{timeLeft>0?`Time left: ${Math.floor(timeLeft/1000)}s`:'Event Started'}</p>{!completed?<button onClick={handleComplete}>Complete</button>:<button onClick={handleUndo}>Undo</button>}</div>);
};