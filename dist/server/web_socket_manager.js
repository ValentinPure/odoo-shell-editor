"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = void 0;
const ws_1 = require("ws");
class WebSocketManager {
    wss;
    wsClient = null;
    constructor(server) {
        this.wss = new ws_1.Server({ server });
        this.wss.on("connection", (ws) => {
            this.wsClient = ws;
            ws.on("close", () => {
                this.wsClient = null;
            });
        });
    }
    send(data) {
        if (this.wsClient) {
            this.wsClient.send(JSON.stringify(data));
        }
    }
}
exports.WebSocketManager = WebSocketManager;
