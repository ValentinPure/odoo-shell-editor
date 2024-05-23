"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const web_socket_manager_1 = require("./web_socket_manager");
const odoo_process_manager_1 = require("./odoo_process_manager");
class Server {
    app;
    server;
    wsManager;
    odooProcessManager;
    PORT = 3000;
    constructor() {
        this.app = (0, express_1.default)();
        this.server = http_1.default.createServer(this.app);
        this.wsManager = new web_socket_manager_1.WebSocketManager(this.server);
        this.odooProcessManager = new odoo_process_manager_1.OdooProcessManager(this.wsManager);
        this.configureMiddleware();
        this.configureRoutes();
    }
    configureMiddleware() {
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.static(path_1.default.join(__dirname, "../../public")));
        this.app.use("/dist/client", express_1.default.static(path_1.default.join(__dirname, "../../dist/client")));
    }
    configureRoutes() {
        this.app.post("/start-shell", (req, res) => this.odooProcessManager.startShell(req, res));
        this.app.post("/run-code", (req, res) => this.odooProcessManager.runCode(req, res));
    }
    start() {
        this.server.listen(this.PORT, () => {
            console.log(`Server is running on http://localhost:${this.PORT}`);
        });
    }
}
exports.Server = Server;
