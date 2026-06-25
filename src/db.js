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
                amount_paid INT NOT NULL DEFAULT 0,
                last_payment TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT 1);`);
            await db.execute(`CREATE TABLE IF NOT EXISTS payment_records(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                amount_paid INT NOT NULL, 
                payment_date TEXT NOT NULL, 
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
                throw Error(error);
            }
        }else{
            return;
        } 
    }

    async setPayment(userId, amountPaid, date){
        try{
            const date = new Date().toLocaleString('es-ES');

            //Begin transaction
            await this.queryDatabase('set', `BEGIN TRANSACTION`);

            //Insert payment data
            await this.queryDatabase('set',`INSERT INTO payment_records (amount_paid, payment_date, user_id) VALUES ($1, $2, $3);`,
            [amountPaid, date, userId]);

            //Update user data
            await this.queryDatabase('set', 
                `UPDATE users_id
                SET last_payment = $2,
                amount_paid = amount_paid + $3
                WHERE id = $1`, [userId, date, amountPaid]);
            
            await this.queryDatabase('set', `COMMIT`);
        }catch(error){
            await this.queryDatabase('set', `ROLLBACK`);
            console.log('Error during transaction:', error);
        }
    }
}