// Copyright (c) 2026 MiraNova Studios
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 9000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`Astra is running at http://${HOST}:${PORT}`);
});
