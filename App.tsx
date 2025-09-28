import { useEffect, useState } from 'react';
import { EventList } from './components/EventList';
import { resetDailyIfNeeded } from './utils/reset';
import { mockData } from './mockData';

function generateEventInstances() {
  const events = [];
  Object.values(mockData.eventConfig.events).forEach(event => {
    if(event.utc_times) {
        event.utc_times.forEach(time => {
            const [hour,minute] = time.split(':').map(Number);
            const now = new Date();
            const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute));
            if(target.getTime() < Date.now()) target.setUTCDate(target.getUTCDate()+1);
            events.push({
                id: event.event_name+'_'+time,
                title: event.event_name,
                location: event.location??'',
                rewards: event.rewards??[],
                startTimeUTC: target.getTime(),
                waypoint: event.waypoint??''
            });
        });
    }
    if(event.locations){
        event.locations.forEach(loc => {
            loc.utc_times.forEach(time => {
                const [hour,minute] = time.split(':').map(Number);
                const now = new Date();
                const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute));
                if(target.getTime() < Date.now()) target.setUTCDate(target.getUTCDate()+1);
                events.push({
                    id: event.event_name+'_'+loc.map+'_'+time,
                    title: event.event_name+' - '+loc.map,
                    location: loc.map,
                    rewards: loc.rewards??[],
                    startTimeUTC: target.getTime(),
                    waypoint: loc.waypoint
                });
            });
        });
    }
  });
  return events.sort((a,b)=>a.startTimeUTC-b.startTimeUTC);
}

export const App: React.FC = () => {
  const [events, setEvents] = useState(generateEventInstances());

  useEffect(() => {
    const interval = setInterval(() => { resetDailyIfNeeded(); setEvents(generateEventInstances()); }, 60*60*1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <h1>GW2 Daily Tracker</h1>
      <EventList events={events} />
    </div>
  );
};