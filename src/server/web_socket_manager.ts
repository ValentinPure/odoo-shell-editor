import http from "http";
import WebSocket, { Server as WebSocketServer } from "ws";

export class WebSocketManager {
  private wss: WebSocketServer;
  public wsClient: WebSocket | null = null;

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on("connection", (ws: WebSocket) => {
      this.wsClient = ws;
      ws.on("close", () => {
        this.wsClient = null;
      });
    });
  }

  public send(data: any) {
    if (this.wsClient) {
      this.wsClient.send(JSON.stringify(data));
    }
  }
}
