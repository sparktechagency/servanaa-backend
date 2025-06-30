
export const generateTimeSlots = (startTime: string, endTime: string) => {
  const timeSlots = [];
  let currentTime = startTime;

  // Generate all time slots between startTime and endTime (one hour increment)
  while (currentTime < endTime) {
    const nextTime = addOneHour(currentTime); // Add one hour to current time
    timeSlots.push(`${currentTime}-${nextTime}`);
    currentTime = nextTime;
  }

  return timeSlots;
};

export const addOneHour = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(0, 0, 0, hours, minutes);
  date.setHours(date.getHours() + 1); // Add one hour to the time
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export const getDayName = (dateStr: string):string => {
  const date = new Date(dateStr);  // Convert date string to Date object
  const options: Intl.DateTimeFormatOptions = { weekday: 'long' };  // We want the full name of the weekday
  return new Intl.DateTimeFormat('en-US', options).format(date);  // Format the date to get the weekday name
};
