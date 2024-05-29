"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const web_socket_manager_1 = require("./web_socket_manager");
const odoo_process_manager_1 = require("./odoo_process_manager");
class Server {
    app;
    server;
    wsManager;
    odooProcessManager;
    PORT = 3000;
    SNIPPETS_FILE = path_1.default.join(__dirname, 'snippets.json');
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
        this.app.get('/snippets', (req, res) => {
            fs_1.default.readFile(this.SNIPPETS_FILE, 'utf8', (err, data) => {
                if (err) {
                    res.status(500).send('Error reading snippets file');
                    return;
                }
                res.json(JSON.parse(data));
            });
        });
        // Endpoint pour ajouter un nouveau snippet
        this.app.post('/snippets', (req, res) => {
            const newSnippet = req.body;
            fs_1.default.readFile(this.SNIPPETS_FILE, 'utf8', (err, data) => {
                if (err) {
                    res.status(500).send('Error reading snippets file');
                    return;
                }
                const snippets = JSON.parse(data);
                snippets.push(newSnippet);
                fs_1.default.writeFile(this.SNIPPETS_FILE, JSON.stringify(snippets, null, 2), (err) => {
                    if (err) {
                        res.status(500).send('Error writing snippets file');
                        return;
                    }
                    res.status(201).send('Snippet added');
                });
            });
        });
    }
    start() {
        this.server.listen(this.PORT, () => {
            console.log(`Server is running on http://localhost:${this.PORT}`);
        });
    }
}
exports.Server = Server;
