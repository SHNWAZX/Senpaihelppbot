const express = require('express');
const app = express();

app.use(express.json());

// Health check endpoint for Render and UptimeRobot
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    bot: 'SenpaiHelpBot',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ping endpoint specifically for UptimeRobot
app.get('/ping', (req, res) => {
  res.json({ status: 'pong', timestamp: new Date().toISOString() });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    bot: 'SenpaiHelpBot (@senpaihelppbot)',
    node_version: process.version,
    memory: process.memoryUsage(),
    uptime_seconds: Math.floor(process.uptime())
  });
});

function startServer(port = process.env.PORT || 3000) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 Web server running on port ${port}`);
    console.log(`🏓 Ping endpoint: http://localhost:${port}/ping`);
  });
}

module.exports = { startServer, app };
