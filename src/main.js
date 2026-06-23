import { Data } from "./db.js";
import { GUI } from "./gui.js";

const Database = new Data();
Database.initializeDatabase();
GUI.renderTables();
