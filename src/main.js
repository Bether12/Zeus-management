import { Data } from "./db.js";
const { invoke } = window.__TAURI__.core;

const Database = new Data();
Database.initializeDatabase()
console.log(Database.queryDatabase('set', `
    INSERT INTO users_id(name, amount_paid) VALUES('Ernesto', 1000)
  ;`));
Database.queryDatabase('get',`
    SELECT * FROM users_id WHERE amount_paid = 1000
  ;`).then(result=>{console.log(result)});
