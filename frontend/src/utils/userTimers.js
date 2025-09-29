// frontend/src/utils/userTimers.js

export const DEFAULT_TIMERS = {
  vine_bridge: [{
    times: [
      "00:50","01:50","02:50","03:50","04:50","05:50","06:50","07:50","08:50","09:50","10:50","11:50","12:50",
      "13:50","14:50","15:50","16:50","17:50","18:50","19:50","20:50","21:50","22:50","23:50"
    ],
    duration: 10
  }]
};

export const getUserTimers = () => {
  try {
    const timers = localStorage.getItem('userTimers');
    return timers ? JSON.parse(timers) : {};
  } catch (error) {
    console.error("Failed to parse user timers from localStorage", error);
    return {};
  }
};

export const setUserTimers = (timers) => {
  try {
    localStorage.setItem('userTimers', JSON.stringify(timers));
  } catch (error) {
    console.error("Failed to save user timers to localStorage", error);
  }
};

export const clearUserTimers = () => {
  try {
    localStorage.removeItem('userTimers');
  } catch (error) {
    console.error("Failed to clear user timers from localStorage", error);
  }
};