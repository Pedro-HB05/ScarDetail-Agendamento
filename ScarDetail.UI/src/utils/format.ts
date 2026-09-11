export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${minutes} min ("${hours}h${remainingMinutes}")`;
  }
  if (hours > 0) {
    return `${minutes} min ("${hours}h")`;
  }
  return `${minutes} min`;
}
