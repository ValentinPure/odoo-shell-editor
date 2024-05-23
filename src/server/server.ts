import express from "express";
import path from "path";
import http from "http";
import { WebSocketManager } from "./web_socket_manager";
import { OdooProcessManager } from "./odoo_process_manager";

export class Server {
  private app: express.Application;
  private server: http.Server;
  private wsManager: WebSocketManager;
  private odooProcessManager: OdooProcessManager;
  private PORT: number = 3000;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wsManager = new WebSocketManager(this.server);
    this.odooProcessManager = new OdooProcessManager(this.wsManager);

    this.configureMiddleware();
    this.configureRoutes();
  }

  private configureMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, "../../public")));
    this.app.use(
      "/dist/client",
      express.static(path.join(__dirname, "../../dist/client")),
    );
  }

  private configureRoutes() {
    this.app.post("/start-shell", (req, res) =>
      this.odooProcessManager.startShell(req, res),
    );
    this.app.post("/run-code", (req, res) =>
      this.odooProcessManager.runCode(req, res),
    );
  }

  public start() {
    this.server.listen(this.PORT, () => {
      console.log(`Server is running on http://localhost:${this.PORT}`);
    });
  }
}
