// Copyright (c) 2026 MiraNova Studios
// In-memory SSE client registry for push notifications
const clients = new Set();

function addClient(res) {
  clients.add(res);
}

function removeClient(res) {
  clients.delete(res);
}

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try { client.write(msg); } catch (e) { clients.delete(client); }
  }
}

module.exports = { addClient, removeClient, broadcast };
