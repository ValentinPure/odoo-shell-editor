"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OdooProcessManager = void 0;
const pty = __importStar(require("node-pty"));
class OdooProcessManager {
    odooProcess = null;
    wsManager;
    currentContainer;
    constructor(wsManager) {
        this.wsManager = wsManager;
        this.currentContainer = "";
    }
    startShell(req, res) {
        const { containerName } = req.body;
        if (!containerName) {
            return res.status(400).json({ error: "Container name is required" });
        }
        if (this.odooProcess && this.currentContainer === containerName) {
            return res.status(400).json({ error: "Odoo shell is already running" });
        }
        // Créer un pseudo-terminal pour le conteneur Docker
        this.odooProcess = pty.spawn("docker", ["exec", "-i", containerName, "bash"], {
            name: "xterm-color",
            cols: 80,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env,
        });
        this.odooProcess.onData((data) => {
            console.log("Odoo shell output:", data);
            this.wsManager.send({ type: "stdout", data: data.toString() });
        });
        this.odooProcess.onExit(({ exitCode }) => {
            console.log(`Odoo process exited with code ${exitCode}`);
            this.odooProcess = null;
            this.wsManager.send({ type: "exit", code: exitCode });
            res.json({
                message: `Odoo process exited with code ${exitCode}`,
            });
        });
        this.currentContainer = containerName;
        res.json({
            message: "Odoo shell started successfully at " + containerName,
        });
    }
    runCode(req, res) {
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
exports.OdooProcessManager = OdooProcessManager;
