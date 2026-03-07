// Copyright (c) 2026 MiraNova Studios
require('dotenv').config();

let app;
try {
  app = require('./app');
} catch (err) {
  console.error('Astra failed to start:', err.message);
  process.exit(1);
}

const PORT = process.env.PORT || 9000;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(`Astra is running at http://${HOST}:${PORT}`);
  console.log(`Database: ${process.env.DB_PATH}`);
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
});

server.on('close', () => {
  console.log('Server closed unexpectedly.');
});
