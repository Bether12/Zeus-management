import { tauri } from "@tauri-apps/api";

async function initializeDatabase(){
  try{
    //Creating/loading database file
    const db = await tauri.invoke('plugin:sql|load', { db: 'sqlite:gym.db'});
    
    //Define users structure with idempotency
    const usersScheme = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        inscription_date TEXT DEFAULT CURRENT_TIMEStAMP,
        expiration_date TEXT NOT NULL,
        paid_status TEXT DEFAULT 'Active'
      );`;

      //Define payments structure with idempotency
      const paymentScheme = `
      CREATE IF NOT EXISTS payment_record(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        amount_paid INTEGER NOT NULL,
        payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );`;

      //Execute scheme creation
    await tauri.invoke('plugin:sql|execute', {query: usersScheme, binds: []});
    await tauri.invoke('plugin:sql|execute', {query: paymentScheme, binds: []});

    console.log('Database verified and in OK status');
  }catch(error){
    console.log('Error while loading the database:', error);
  }
}

async function queryDatabase (query, params = []){
  try{
    return await tauri.invoke('plugin:sql|execute', { query: query, binds: params });
  }catch(error){
    console.log('Error detected:', error);

    //Implement user error notification
  }
}
