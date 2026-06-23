const Database = window.__TAURI__.sql;

export class Data{

    constructor(){
        console.log("Initializing database");
    }

    async initializeDatabase(){
        try{
            this.db = await Database.load('sqlite:gym.db');
            //Create users id table with their last payment data
            await this.db.execute(`CREATE TABLE IF NOT EXISTS users_id(
                id INTEGER PRIMARY KEY AUTOINCREMENT ,
                name VARCHAR(70) NOT NULL,  
                amount_paid INT NOT NULL,
                last_payment TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT 1);`);
            await this.db.execute(`CREATE TABLE IF NOT EXISTS payment_records(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                amount_paid INT NOT NULL, 
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                user_id INTEGER NOT NULL, 
                FOREIGN KEY(user_id) REFERENCES users(id)
                );`);
        console.log('Database successfully initiated');
        }catch(error){
            console.log(error);
        }
    }

    async queryDatabase(queyType, query, params=[]){
        if(queyType === 'get'){
            try{
                this.db = await Database.load('sqlite:gym.db');
                return await this.db.select(query, params);
            }catch(error){
                console.log(error);
            }
        }else if (queyType === 'set'){
            try{
                this.db = await Database.load('sqlite:gym.db');
                return await this.db.execute(query, params);
            }catch(error){
                console.log(error);
            }
        }else{
            return;
        } 
    }
}