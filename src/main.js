import { Data } from "./db.js";
import { eventMaster } from "./events.js";
import { GUI } from "./gui.js";

const Database = await Data.initializeDatabase();
const tableInfo1 = await Database.queryDatabase('get', `PRAGMA table_info(users_id)`);
const tableInfo2 = await Database.queryDatabase('get', `PRAGMA table_info(payment_records)`);
const tableInfo3 = await Database.queryDatabase('get', `SELECT * FROM staff`);
console.log('Users_id:', tableInfo1);
console.log('Payment_records:', tableInfo2);
console.log('Staff:', tableInfo3);

const Event = eventMaster(Database);
const Gui = GUI(Database, Event);

Gui.logIn();
