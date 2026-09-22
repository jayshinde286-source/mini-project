/**
 * Formatting helpers for timestamps, numbers, and TTL
 */

export const formatTimestamp = (epochMillis) => {
  if (!epochMillis) return 'N/A';
  const date = new Date(epochMillis);
  return date.toTimeString().split(' ')[0] + '.' + String(date.getMilliseconds()).padStart(3, '0');
};

export const formatFullDateTime = (epochMillis) => {
  if (!epochMillis) return 'N/A';
  const date = new Date(epochMillis);
  return date.toLocaleString();
};

export const formatRelativeTime = (epochMillis) => {
  if (!epochMillis) return 'just now';
  const diffSec = Math.floor((Date.now() - epochMillis) / 1000);
  if (diffSec < 2) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat().format(num);
};

export const formatPercent = (rate) => {
  if (isNaN(rate) || rate === null || rate === undefined) return '0.0%';
  return `${Number(rate).toFixed(1)}%`;
};

export const formatTTLRemaining = (expiresAt) => {
  if (!expiresAt || expiresAt === 0) return { text: 'PERSISTENT', percent: 100, isExpired: false };
  const diff = expiresAt - Date.now();
  if (diff <= 0) return { text: 'EXPIRED', percent: 0, isExpired: true };
  
  const sec = Math.ceil(diff / 1000);
  if (sec < 60) return { text: `${sec}s remaining`, percent: Math.min(100, (sec / 60) * 100), isExpired: false };
  const min = Math.ceil(sec / 60);
  return { text: `${min}m remaining`, percent: Math.min(100, (min / 60) * 100), isExpired: false };
};

export const formatUptime = (startTime) => {
  const totalSec = Math.floor((Date.now() - startTime) / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
