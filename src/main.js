import { Data } from "./db.js";
import { eventMaster } from "./events.js";
import { GUI } from "./gui.js";

const Database = new Data();
Database.initializeDatabase();

const Event = eventMaster(Database);
const Gui = GUI(Database, Event);

Gui.renderTables();
