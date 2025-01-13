export const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const period = Number(hours) >= 12 ? 'PM' : 'AM';
  const formattedHours = Number(hours) % 12 || 12;
  return `${formattedHours}:${minutes} ${period}`;
}; 