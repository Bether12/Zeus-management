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
                amount_paid INT NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
                last_payment TEXT DEFAULT NULL,
                active BOOLEAN DEFAULT 1);`);
            await db.execute(`CREATE TABLE IF NOT EXISTS payment_records(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                amount_paid INT NOT NULL CHECK (amount_paid >= 0), 
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

    async changePaymentUser(userId, newUserId, paymentId){
        try {
            //Begin transaction
            await this.queryDatabase('set', `BEGIN TRANSACTION`);

            //Get the amount paid and date of payment by the previous user
            const data = await this.queryDatabase('get', 
                `SELECT amount_paid, payment_date FROM payment_records WHERE id = $1`, 
                [paymentId]);
            console.log(data);

            //Change the payment user's id
            await this.queryDatabase('set', 
                `UPDATE payment_records SET user_id = $1 WHERE id = $2`, 
                [newUserId, paymentId]);

            //Subtract the amount paid from the old user's total
            await this.queryDatabase('set', 
                `UPDATE users_id SET amount_paid = amount_paid - $1 WHERE id = $2`, 
                [data[0].amount_paid, userId]);

            //Update the values of the new user
            await this.queryDatabase('set', 
                `UPDATE users_id SET amount_paid = amount_paid + $1, last_payment = CASE WHEN last_payment > $2 THEN last_payment ELSE $2 END WHERE id = $3`, 
                [data[0].amount_paid, data[0].payment_date, newUserId]);
            
            //Get old user's most recent payment date
            const oldUserPayDate = await this.queryDatabase('get', 
                `SELECT MAX(payment_date) AS payment_date FROM payment_records WHERE user_id = $1`, 
                [userId]);
            console.log(oldUserPayDate);
            
            //Update old user's last payment date
            await this.queryDatabase('set', 
                `UPDATE users_id SET last_payment = $1 WHERE id = $2`,
                [oldUserPayDate[0].payment_date, userId]);

            await this.queryDatabase('set', `COMMIT`);
        } catch (error) {
            await this.queryDatabase('set', `ROLLBACK`);
            console.log('Error during transaction:', error);
        }
    }

    async changePaymentDate(newDate, paymentId, userId) {
        try {
            await this.queryDatabase('set', `BEGIN TRANSACTION`);

            //Change the payment date
            await this.queryDatabase('set', 
                `UPDATE payment_records SET payment_date = $1 WHERE id = $2`, 
                [newDate, paymentId]);

            //Get user's new last payment
            const lastPayment = await this.queryDatabase('get', 
                `SELECT MAX(payment_date) AS payment_date FROM payment_records WHERE user_id = $1`, 
                [userId]);

            //Set user's new last payment
            await this.queryDatabase('set', 
                `UPDATE users_id SET last_payment = $1 WHERE id = $2`, 
                [lastPayment[0].payment_date, userId]);

            await this.queryDatabase('set', `COMMIT`);
        } catch (error) {
            await this.queryDatabase('set', `ROLLBACK`);
            console.log('Error during transaction:', error);
        }
    }

    async deletePayment(paymentId){
        try {
            await this.queryDatabase('set', `BEGIN TRANSACTION`);

            //Get payment data
            const data = await this.queryDatabase('get', 
                `SELECT * FROM payment_records WHERE id = $1`, 
                [paymentId]);

            //Delete payment
            await this.queryDatabase('set', 
                `DELETE FROM payment_records WHERE id = $1`, 
                [paymentId]);

            //Set new total for the user
            await this.queryDatabase('set', 
                `UPDATE users_id SET amount_paid = amount_paid - $1 WHERE id = $2`, 
                [data[0].amount_paid, data[0].user_id]);

            //Get user's new last payment
            const lastPayment = await this.queryDatabase('get', 
                `SELECT MAX(payment_date) AS payment_date FROM payment_records WHERE user_id = $1`, 
                [data[0].user_id]);

            //Set user's new last payment
            await this.queryDatabase('set', 
                `UPDATE users_id SET last_payment = $1 WHERE id = $2`, 
                [lastPayment[0].payment_date, data[0].user_id]);

                await this.queryDatabase('set', `COMMIT`);
        } catch (error) {
            await this.queryDatabase('set', `ROLLBACK`);
            console.log('Error during transaction:', error);
        }
    }

    async getDuePay(){
        const usersDuePay = await this.queryDatabase('get', 
            `SELECT last_payment, id, name FROM (SELECT last_payment, id, name FROM users_id WHERE active = 1) WHERE last_payment <= strftime('%Y-%m-%d %H:%M', datetime('now', '-31 day'))`);
        return usersDuePay;
    }
}