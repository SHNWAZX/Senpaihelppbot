// In-memory flood tracker (no DB needed for real-time tracking)
const floodData = new Map();

function trackMessage(chatId, userId) {
  const key = `${chatId}:${userId}`;
  const now = Date.now();
  
  if (!floodData.has(key)) {
    floodData.set(key, { count: 1, firstTime: now });
    return { flooded: false, count: 1 };
  }
  
  const data = floodData.get(key);
  const elapsed = (now - data.firstTime) / 1000;
  
  if (elapsed > 60) {
    // Reset after 1 minute
    floodData.set(key, { count: 1, firstTime: now });
    return { flooded: false, count: 1 };
  }
  
  data.count++;
  floodData.set(key, data);
  return { flooded: false, count: data.count, elapsed };
}

function isFlooding(chatId, userId, maxMessages, timeSeconds) {
  const key = `${chatId}:${userId}`;
  const now = Date.now();
  
  if (!floodData.has(key)) {
    floodData.set(key, { count: 1, firstTime: now });
    return false;
  }
  
  const data = floodData.get(key);
  const elapsed = (now - data.firstTime) / 1000;
  
  if (elapsed > timeSeconds) {
    floodData.set(key, { count: 1, firstTime: now });
    return false;
  }
  
  data.count++;
  floodData.set(key, data);
  
  if (data.count >= maxMessages) {
    floodData.delete(key);
    return true;
  }
  return false;
}

function resetFlood(chatId, userId) {
  floodData.delete(`${chatId}:${userId}`);
}

module.exports = { trackMessage, isFlooding, resetFlood };
