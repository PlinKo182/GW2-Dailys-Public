export const convertUTCTimeToLocal = (utcTimeString) => {
  const now = new Date();
  const [hours, minutes] = utcTimeString.split(':').map(Number);
  
  const utcDate = new Date(Date.UTC(
    now.getUTCFullYear(), 
    now.getUTCMonth(), 
    now.getUTCDate(), 
    hours, 
    minutes
  ));
  
  return new Date(utcDate);
};

export const formatTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatTimeWithSeconds = (date) => {
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit' 
  });
};