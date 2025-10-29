/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse & { socket: any }
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const { type, payload } = req.body || {};

  if (!type) {
    res.status(400).json({ error: "Missing 'type' in body" });
    return;
  }

  const io = res.socket?.server?.io;
  if (!io) {
    res.status(503).json({
      error: "Socket.io server not initialized",
      hint: "Open a page that calls /api/socket to initialize first",
    });
    return;
  }

  if (type === "new_order") {
    io.to("orders").emit("new-order", payload);
  } else if (type === "new_points") {
    io.to("points").emit("new-points", payload);
  } else if (type === "order_updated") {
    io.to("orders").emit("order-updated", payload);
  } else {
    res.status(400).json({ error: `Unknown type '${type}'` });
    return;
  }

  res.status(200).json({ success: true });
}
