import express from "express";
import path from "path";
import http from "http";
import bodyParser from 'body-parser';
import fs from 'fs';
import { WebSocketManager } from "./web_socket_manager";
import { OdooProcessManager } from "./odoo_process_manager";




export class Server {
  private app: express.Application;
  private server: http.Server;
  private wsManager: WebSocketManager;
  private odooProcessManager: OdooProcessManager;

  private PORT: number = 3000;
  private SNIPPETS_FILE: string = path.resolve(__dirname, 'snippets.json');
  

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
    this.app.get('/snippets', (req, res) => {
      fs.readFile(this.SNIPPETS_FILE, 'utf8', (err, data) => {
        if (err) {
          res.status(500).send('Error reading snippets file');
          return;
        }
        res.json(JSON.parse(data));
      });
    });

    // Endpoint pour ajouter un nouveau snippet
    this.app.post('/snippets', (req, res) => {
      console.log('Received request to add snippet:', req.body);

      const {title, code} = req.body;
      const snippet = {title, code}

        fs.writeFile(this.SNIPPETS_FILE, JSON.stringify(snippet, null, 2), (err) => {
          if (err) {
            res.status(500).send({status: false, message : 'failed to write the snippet'});
            return;
          }
          res.status(201).send({status: true, message : 'Succeed'});
        });
      });
    
    }
  

  public start() {
    this.server.listen(this.PORT, () => {
      console.log(`Server is running on http://localhost:${this.PORT}`);
    });
  }
}


