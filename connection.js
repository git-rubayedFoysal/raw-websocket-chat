// Redis clients shared by the whole app.
import { createClient } from "redis";

// Publisher and subscriber must be separate connections (a subscribed
// connection can only issue subscribe commands). REDIS_URL lets the Redis
// host differ per environment; defaults to the local compose.yml instance.

export const publisher = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
export const subscriber = publisher.duplicate();

// Log Redis errors instead of letting them crash the process
publisher.on("error", (err) => console.error("Redis publisher error:", err));
subscriber.on("error", (err) => console.error("Redis subscriber error:", err));

// Top-level await: both connections must be ready before the server starts
// accepting WebSocket traffic
await publisher.connect();
await subscriber.connect();
