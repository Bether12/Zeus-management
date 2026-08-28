import { AsyncQueue } from "./asyncQueue.js";

export class Data{

    constructor(db){
        console.log('Database successfully initiated');
        this.db = db;
        this.sqlQueue = new AsyncQueue();
    }

    static async initializeDatabase(){
        try{
            const db = await window.__TAURI__.sql.load('sqlite:gym.db');
            //Create users id table with their last payment data
            await db.execute(`CREATE TABLE IF NOT EXISTS users_id(
                id INTEGER PRIMARY KEY AUTOINCREMENT ,
                name VARCHAR(100) NOT NULL,
                ci VARCHAR(11) NOT NULL,  
                amount_paid INT NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
                last_amount_paid INT NOT NULL DEFAULT 0 CHECK (last_amount_paid >=0),
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
            throw error;
        }
    }

    async queryDatabase(queyType, query, params=[]){
        return this.sqlQueue.enqueue(async () =>{
            if(queyType === 'get'){
                try{
                    return await this.db.select(query, params);
                }catch(error){
                    console.log(error);
                    throw error;
                }
            }else if (queyType === 'set'){
                try{
                    return await this.db.execute(query, params);
                }catch(error){
                    console.log(error);
                    throw error;
                }
            }else{
                throw new Error('Unknown queryType parameter');
                return;
            } 
        });   
    }

    async getTotalUsersCount() {
        const result = await this.queryDatabase('get', `SELECT COUNT(*) as total FROM users_id`);
        console.log(`Users total: ${result[0].total}`);
        return result[0].total;
    }

    async getTotalPaymentsCount() {
        const result = await this.queryDatabase('get', `SELECT COUNT(*) as total FROM payment_records`);
        console.log(`Payments total: ${result[0].total}`);
        return result[0].total;
    }

    async getTotalDuePayCount(){
        try{
            const result = await this.queryDatabase('get', 
                    `SELECT COUNT(*) as total FROM (SELECT last_payment, id, name FROM users_id WHERE active = 1) WHERE COALESCE(last_payment, '1970-01-01T00:00') <= strftime('%Y-%m-%dT%H:%M', datetime('now', '-31 day'))`);
            console.log(`Due pays total: ${result[0].total}`);
            return result[0].total;
        }catch(error){
            console.log(error);
            throw error;
        }
    }

    async getPaginatedPayments(limit, offset){
         try {
            // Recent payments first
            return await this.queryDatabase('get', 
                `SELECT * FROM payment_records ORDER BY id DESC LIMIT $1 OFFSET $2`, 
                [limit, offset]);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getPaginatedUsers(limit, offset){
        try{
            //Ordered by ascending id
            return await this.queryDatabase('get', 
                `SELECT * FROM users_id ORDER BY id LIMIT $1 OFFSET $2`, 
                [limit, offset]);
        }catch(error){
            console.log(error);
            throw error;
        }
    }

    async getPaginatedDuePay(limit, offset){
        try{
            return await this.queryDatabase('get', 
                `SELECT last_payment, id, name FROM (SELECT last_payment, id, name FROM users_id WHERE active = 1) WHERE COALESCE(last_payment, '1970-01-01T00:00') <= strftime('%Y-%m-%dT%H:%M', datetime('now', '-31 day')) LIMIT $1 OFFSET $2`, 
                [limit, offset]);
        }catch(error){
            console.log(error);
            throw error;
        }
    }

    async setPayment(userId, amountPaid, date){
        return this.sqlQueue.enqueue(async () => {
            try{
                //Begin transaction
                await this.db.execute(`BEGIN TRANSACTION`);

                //Insert payment data
                await this.db.execute(
                    `INSERT INTO payment_records (amount_paid, payment_date, user_id) VALUES ($1, $2, $3);`,
                    [amountPaid, date, userId]);

                //Update user data
                await this.db.execute(
                    `UPDATE users_id
                    SET last_payment = CASE WHEN COALESCE(last_payment, '1970-01-01T00:00') > $2 THEN last_payment ELSE $2 END,
                    amount_paid = amount_paid + $3,
                    last_amount_paid = CASE WHEN COALESCE(last_payment, '1970-01-01T00:00') > $2 THEN last_amount_paid ELSE $3 END
                    WHERE id = $1`,
                    [userId, date, amountPaid]);
                
                await this.db.execute(`COMMIT`);
            }catch(error){
                await this.db.execute(`ROLLBACK`);
                console.log('Error during transaction:', error);
                throw error;
            }
        });
    }

    async addUser(name, ci){
        try {
            await this.queryDatabase('set', 
                `INSERT INTO users_id(name, ci) VALUES ($1, $2)`, 
                [name, ci]);
        } catch (error) {
           console.log(error);
           throw error; 
        }
    }

    async changeUserName(name, id){
        try {
            await this.queryDatabase('set',
                `UPDATE users_id SET name = $1 WHERE id = $2`,
                [name, id]);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async changeUserCI(ci, id){
        try {
            await this.queryDatabase('set',
                `UPDATE users_id SET ci = $1 WHERE id = $2`,
                [ci, id]);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async changeAmountPaid(newAmountPaid, oldAmountPaid, paymentId, userId){
        return this.sqlQueue.enqueue(async () => {
            try {
                //Begin transaction
                await this.db.execute(`BEGIN TRANSACTION`);

                //Set new amount paid
                await this.db.execute(
                    `UPDATE payment_records SET amount_paid = $1 WHERE id = $2`, 
                    [newAmountPaid, paymentId]);

                //Sum the difference of the old and new amount paid to the total paid by the user
                await this.db.execute(
                    `UPDATE users_id SET amount_paid = amount_paid + ($1 - $2) WHERE id = $3`,
                    [newAmountPaid, oldAmountPaid, userId]);

                await this.db.execute(`COMMIT`);
            } catch (error) {
                await this.db.execute(`ROLLBACK`);
                console.log(error);
                throw error;
            }
        });
    }

    async changeUserStatus(newStatus, id){
        try {
            await this.queryDatabase('set',
                `UPDATE users_id SET active = $1 WHERE id = $2`,
                [newStatus, id]);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async changePaymentUser(userId, newUserId, paymentId){
        return this.sqlQueue.enqueue(async () => {
            try {
                //Begin transaction
                await this.db.execute(`BEGIN TRANSACTION`);

                //Get the amount paid and date of payment by the previous user
                const data = await this.db.select(
                    `SELECT amount_paid, payment_date FROM payment_records WHERE id = $1`, 
                    [paymentId]);
                console.log(data);

                // Verification of the query's result
                if (!data || data.length === 0) {
                    throw new Error(`No se encontró ningún registro de pago con el ID: ${paymentId}`);
                }

                //Change the payment user's id
                await this.db.execute(
                    `UPDATE payment_records SET user_id = $1 WHERE id = $2`, 
                    [newUserId, paymentId]);

                //Subtract the amount paid from the old user's total
                await this.db.execute(
                    `UPDATE users_id SET amount_paid = amount_paid - $1 WHERE id = $2`, 
                    [data[0].amount_paid, userId]);

                //Update the values of the new user
                await this.db.execute(
                    `UPDATE users_id SET amount_paid = amount_paid + $1, last_payment = CASE WHEN COALESCE(last_payment, '1970-01-01T00:00') > $2 THEN last_payment ELSE $2 END WHERE id = $3`, 
                    [data[0].amount_paid, data[0].payment_date, newUserId]);
                
                //Get old user's most recent payment date
                const oldUserPayDate = await this.db.select(
                    `SELECT MAX(payment_date) AS payment_date FROM payment_records WHERE user_id = $1`, 
                    [userId]);
                console.log(oldUserPayDate);

                // Verification of the query's result
                if (!oldUserPayDate || oldUserPayDate.length === 0) {
                    throw new Error(`No se encontró ningún registro de pago reciente para el usuario ID: ${userId}`);
                }
                
                //Update old user's last payment date
                await this.db.execute(
                    `UPDATE users_id SET last_payment = $1 WHERE id = $2`,
                    [oldUserPayDate[0].payment_date, userId]);

                //Update the last amount paid of the old user
                await this.db.execute(
                    `UPDATE users_id SET last_amount_paid = COALESCE((SELECT amount_paid FROM payment_records WHERE payment_date = (SELECT last_payment FROM users_id WHERE id = $1)), 0) WHERE id = $1`, 
                    [userId]);

                //Update the last amount paid of the new user
                await this.db.execute(
                    `UPDATE users_id SET last_amount_paid = COALESCE((SELECT amount_paid FROM payment_records WHERE payment_date = (SELECT last_payment FROM users_id WHERE id = $1)), 0) WHERE id = $1`, 
                    [newUserId]);

                await this.db.execute(`COMMIT`);
            } catch (error) {
                await this.db.execute(`ROLLBACK`);
                console.log('Error during transaction:', error);
                throw error;
            }
        });
    }

    async changePaymentDate(newDate, paymentId, userId) {
        return this.sqlQueue.enqueue(async () => {
            try {
                await this.db.execute(`BEGIN TRANSACTION`);

                //Change the payment date
                await this.db.execute( 
                    `UPDATE payment_records SET payment_date = $1 WHERE id = $2`, 
                    [newDate, paymentId]);

                //Get user's new last payment
                const lastPayment = await this.db.select(
                    `SELECT MAX(payment_date) AS payment_date FROM payment_records WHERE user_id = $1`, 
                    [userId]);

                if(!lastPayment || lastPayment.length === 0){
                    throw new Error(`No se encontró ningún registro de pago reciente para el usuario con ID: ${userId}`);
                };

                //Set user's new last payment
                await this.db.execute(
                    `UPDATE users_id SET last_payment = $1 WHERE id = $2`, 
                    [lastPayment[0].payment_date, userId]);

                //Update the last amount paid of the user
                await this.db.execute( 
                    `UPDATE users_id SET last_amount_paid = COALESCE((SELECT amount_paid FROM payment_records WHERE payment_date = (SELECT last_payment FROM users_id WHERE id = $1)), 0) WHERE id = $1`, 
                    [userId]);

                await this.db.execute(`COMMIT`);
            } catch (error) {
                await this.db.execute(`ROLLBACK`);
                console.log('Error during transaction:', error);
                throw error;
            }
        });
    }

    async deletePayment(paymentId){
        return this.sqlQueue.enqueue(async () => {
            try {
                await this.db.execute(`BEGIN TRANSACTION`);

                //Get payment data
                const data = await this.db.select(
                    `SELECT * FROM payment_records WHERE id = $1`, 
                    [paymentId]);

                if(!data || data.length === 0){
                    throw new Error(`No se encontró el pago con ID: ${paymentId}`)
                }

                //Delete payment
                await this.db.execute( 
                    `DELETE FROM payment_records WHERE id = $1`, 
                    [paymentId]);

                //Set new total for the user
                await this.db.execute( 
                    `UPDATE users_id SET amount_paid = amount_paid - $1 WHERE id = $2`, 
                    [data[0].amount_paid, data[0].user_id]);

                //Get user's new last payment
                const lastPayment = await this.db.select( 
                    `SELECT MAX(payment_date) AS payment_date FROM payment_records WHERE user_id = $1`, 
                    [data[0].user_id]);

                if(!lastPayment || lastPayment.length === 0){
                    throw new Error(`No se encontró un registro de pago reciente para el usuario con ID: ${data[0].user_id}`)
                }

                //Set user's new last payment
                await this.db.execute(
                    `UPDATE users_id SET last_payment = $1 WHERE id = $2`, 
                    [lastPayment[0].payment_date, data[0].user_id]);

                //Update the last amount paid of the user
                await this.db.execute(
                    `UPDATE users_id SET last_amount_paid = COALESCE((SELECT amount_paid FROM payment_records WHERE payment_date = (SELECT last_payment FROM users_id WHERE id = $1)), 0) WHERE id = $1`, 
                    [data[0].user_id]);

                    await this.db.execute(`COMMIT`);
            } catch (error) {
                await this.db.execute(`ROLLBACK`);
                console.log('Error during transaction:', error);
                throw error;
            }
        });
    }

    async getDateResume(date){
        return this.sqlQueue.enqueue(async () => {
            try{
                const dateResponse ={
                    resume: await this.db.select( 
                    `SELECT COUNT(DISTINCT user_id) as users_total, SUM(amount_paid) as paid_total FROM payment_records WHERE payment_date LIKE $1`, 
                    [date + '%']),
                    usersResume: await this.db.select(
                    `SELECT user_id, amount_paid FROM payment_records WHERE payment_date LIKE $1`, 
                    [date + '%'])
                };

                return dateResponse;
            }catch(error){
                console.log(error);
                throw error;
            }
        });
    }
}