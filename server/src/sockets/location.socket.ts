import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../middleware/auth.middleware";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LocationUpdate {
  orderId: string;
  lat: number;
  lng: number;
}

interface TrackSubscribe {
  orderId: string;
}

// ─── Token verification helper ────────────────────────────────────────────────
function verifySocketToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Register all location-related socket handlers ────────────────────────────
export function registerLocationHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    // ── Authenticate the socket connection ──────────────────────────────────
    // Token is passed in the handshake auth object: { auth: { token: "Bearer ..." } }
    // or as a query param: ?token=...
    const rawToken =
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.query?.token as string) ||
      "";

    const token = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;
    const payload = verifySocketToken(token);

    if (!payload) {
      console.warn(`[Socket] Rejected unauthenticated connection: ${socket.id}`);
      socket.emit("error", { message: "Authentication failed. Provide a valid JWT." });
      socket.disconnect(true);
      return;
    }

    console.log(`[Socket] Connected: ${socket.id} | user: ${payload.sub} | role: ${payload.role}`);
    
    // ── Vendor Room Setup ────────────────────────────────────────────────────
    if (payload.role === "Vendor") {
      const vendorRoom = `vendor:${payload.sub}`;
      socket.join(vendorRoom);
      console.log(`[Socket] Vendor ${payload.sub} automatically joined room: ${vendorRoom}`);
    }

    // ── Delivery Person: emit GPS location ──────────────────────────────────
    // Event: "delivery:update-location"
    // Payload: { orderId: string, lat: number, lng: number }
    // Effect: Broadcasts "delivery:location" to everyone in room `order:<orderId>`
    socket.on("delivery:update-location", (data: LocationUpdate) => {
      if (payload.role !== "Delivery") {
        socket.emit("error", { message: "Only Delivery users can emit location updates" });
        return;
      }

      const { orderId, lat, lng } = data;
      if (!orderId || lat === undefined || lng === undefined) {
        socket.emit("error", { message: "orderId, lat, and lng are required" });
        return;
      }

      const room = `order:${orderId}`;
      // Ensure the delivery person is in the room
      socket.join(room);

      // Broadcast to all subscribers in the room (including the sender)
      io.to(room).emit("delivery:location", {
        orderId,
        lat,
        lng,
        timestamp: new Date().toISOString(),
        deliveryPersonId: payload.sub,
      });

      console.log(`[Socket] Location update | order: ${orderId} | (${lat}, ${lng})`);
    });

    // ── Student: subscribe to an order's tracking room ───────────────────────
    // Event: "track:subscribe"
    // Payload: { orderId: string }
    // Effect: Joins room `order:<orderId>` — will now receive "delivery:location" events
    socket.on("track:subscribe", (data: TrackSubscribe) => {
      if (payload.role !== "Student") {
        socket.emit("error", { message: "Only Students can subscribe to order tracking" });
        return;
      }

      const { orderId } = data;
      if (!orderId) {
        socket.emit("error", { message: "orderId is required" });
        return;
      }

      const room = `order:${orderId}`;
      socket.join(room);
      socket.emit("track:subscribed", { orderId, room });

      console.log(`[Socket] Student ${payload.sub} subscribed to room: ${room}`);
    });

    // ── Student: unsubscribe from tracking ───────────────────────────────────
    // Event: "track:unsubscribe"
    socket.on("track:unsubscribe", (data: TrackSubscribe) => {
      const { orderId } = data;
      if (orderId) {
        socket.leave(`order:${orderId}`);
        socket.emit("track:unsubscribed", { orderId });
      }
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} | reason: ${reason}`);
    });
  });
}
