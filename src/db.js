export const Database = (function(){
    
    async function initializeDatabase(){
        try{
            const { invoke } = window._TAURI_.core;
            //Creating/loading database file
            const db = await invoke('plugin:sql|load', { db: 'sqlite:gym.db'});
            
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
            await db.execute(usersScheme, []);
            await db.execute(paymentScheme, []);

            console.log('Database verified and in OK status');
        }catch(error){
            console.log('Error while loading the database:', error);
        }
    }

    async function queryDatabase (query, params = []){
        try{
            const { invoke } = window._TAURI_.core;
            return await invoke('plugin:sql|execute', { query: query, binds: params });
        }catch(error){
            console.log('Error detected:', error);

            //Implement user error notification
        }
    }
    return {initializeDatabase, queryDatabase};
})();