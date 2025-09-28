import { EventCard } from './EventCard';
interface Event { eventId:string; title:string; startTimeUTC:number; }
interface EventListProps { events: Event[]; }
export const EventList: React.FC<EventListProps> = ({ events }) => (<div className="event-list">{events.map(event=><EventCard key={`${event.eventId}|${event.startTimeUTC}`} eventId={event.eventId} title={event.title} startTimeUTC={event.startTimeUTC} />)}</div>);