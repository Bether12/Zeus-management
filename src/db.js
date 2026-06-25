//const Database = window.__TAURI__.sql;

export class Data{

    constructor(db){
        console.log('Database successfully initiated');
        this.db = db;
    }

    static async initializeDatabase(){
        try{
            const db = await window.__TAURI__.sql.load('sqlite:gym.db');
            //Create users id table with their last payment data
            await db.execute(`CREATE TABLE IF NOT EXISTS users_id(
                id INTEGER PRIMARY KEY AUTOINCREMENT ,
                name VARCHAR(70) NOT NULL,  
                amount_paid INT NOT NULL,
                last_payment TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT 1);`);
            await db.execute(`CREATE TABLE IF NOT EXISTS payment_records(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                amount_paid INT NOT NULL, 
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                user_id INTEGER NOT NULL, 
                FOREIGN KEY(user_id) REFERENCES users_id(id)
                );`);
        return new Data(db);
        }catch(error){
            console.log(error);
        }
    }

    async queryDatabase(queyType, query, params=[]){
        if(queyType === 'get'){
            try{
                return await this.db.select(query, params);
            }catch(error){
                console.log(error);
            }
        }else if (queyType === 'set'){
            try{
                return await this.db.execute(query, params);
            }catch(error){
                console.log(error);
            }
        }else{
            return;
        } 
    }
}