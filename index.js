// Main entry point: HTTP server + WebSocket chat with Redis pub/sub horizontal scaling

// TODO: user signup/login and authentication (issue a session/JWT on login,
//       verify it before accepting WebSocket connections, attach user identity
//       to each message instead of an anonymous socketId)

import http from "node:http";
import requestListener from "./handler/requestListener.js";
import { WebSocketServer, WebSocket } from "ws";
import { publisher, subscriber } from "./connection.js";

// PORT comes from env so multiple instances can run on one machine
const PORT = process.env.PORT || 8000;

// Shared Redis channel: every server instance publishes here and
// every instance's subscriber fans messages out to its local clients
const REDIS_CHANNEL = "chat-room";

// HTTP server serves index.html and style.css via requestListener
const httpServer = http.createServer(requestListener);

// WebSocket server attached to the HTTP server (upgrades handled automatically)
const ws = new WebSocketServer({ server: httpServer });

// Subscribe to the Redis channel: when ANY instance publishes a chat message,
// deliver it to every WebSocket client connected to THIS instance.
// readyState guard skips clients that are closing/closed.
await subscriber.subscribe(REDIS_CHANNEL, (message) => {
  ws.clients.forEach((client) => {
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

ws.on("connection", (socket) => {
  // Assign a unique id to this connection and tell the client what it is
  // (client uses it to mark its own messages as "outgoing")
  const socketId = crypto.randomUUID();
  socket.send(JSON.stringify({ type: "init", socketId }));
  console.log("New connection established.");

  // Incoming chat message: publish to Redis so ALL instances (including this
  // one) broadcast it to their clients. try/catch keeps a Redis outage from
  // crashing the process via an unhandled rejection.
  socket.on("message", async (message) => {
    try {
      await publisher.publish(
        REDIS_CHANNEL,
        JSON.stringify({
          socketId,
          message: message.toString(),
        }),
      );
    } catch (error) {
      console.error("Publish failed:", error);
    }
  });

  socket.on("close", () => {
    console.log("Connection closed!");
  });

  socket.on("error", (error) => {
    console.log(error);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server was listening on PORT:${PORT}`);
});
