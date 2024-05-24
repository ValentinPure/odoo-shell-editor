import { Request, Response } from "express";
import * as pty from "node-pty";
import { WebSocketManager } from "./web_socket_manager";

export class OdooProcessManager {
  private odooProcess: pty.IPty | null = null;
  private wsManager: WebSocketManager;
  private currentContainer: string;

  constructor(wsManager: WebSocketManager) {
    this.wsManager = wsManager;
    this.currentContainer = "";
  }

  public startShell(req: Request, res: Response) {
    const { containerName } = req.body;
    if (!containerName) {
      return res.status(400).json({ error: "Container name is required" });
    }
    if (this.odooProcess && this.currentContainer === containerName) {
      return res.status(400).json({ error: "Odoo shell is already running" });
    }

    // Créer un pseudo-terminal pour le conteneur Docker
    this.odooProcess = pty.spawn(
      "docker",
      ["exec", "-i", containerName, "bash"],
      {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env,
      },
    );
    this.odooProcess.onData((data) => {
      console.log("Odoo shell output:", data);
      this.wsManager.send({ type: "stdout", data: data.toString() });
    });

    this.odooProcess.onExit(({ exitCode }) => {
      console.log(`Odoo process exited with code ${exitCode}`);
      this.odooProcess = null;
      this.wsManager.send({ type: "exit", code: exitCode });
    });
    this.currentContainer = containerName;
    res.json({
      message: "Odoo shell started successfully at " + containerName,
    });
  }

  public runCode(req: Request, res: Response) {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }
    if (!this.odooProcess) {
      return res.status(400).json({ error: "Odoo shell is not running" });
    }
    console.log("Received code:", code);

    // Envoyer le code au shell Odoo via le conteneur Docker
    const command = `echo "${code.replace(/"/g, '\\"')}" | odoo shell -d odoo --db_host db --db_password odoo --shell-interface ipython\n`;

    this.odooProcess.write(command);

    res.json({ message: "Code sent to Odoo shell" });
  }
}
