import { AsyncQueue } from "./asyncQueue.js";

export class Data{
    #currentUser = {
        username: 'root', 
        role: 'dependent'
    };

    constructor(db){
        console.log('Database successfully initiated');
        this.db = db;
        this.sqlQueue = new AsyncQueue();
    }

    static async initializeDatabase(){
        try{
            const db = await window.__TAURI__.sql.load('sqlite:gym.db');

            await db.execute(`PRAGMA foreign_keys = ON;`);

            //Create users id table with their last payment data
            await db.execute(`
                CREATE TABLE IF NOT EXISTS users_id(
                id INTEGER PRIMARY KEY AUTOINCREMENT ,
                name VARCHAR(100) NOT NULL,
                ci VARCHAR(11) NOT NULL UNIQUE,  
                amount_paid INT NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
                last_amount_paid INT NOT NULL DEFAULT 0 CHECK (last_amount_paid >=0),
                last_payment TEXT DEFAULT NULL,
                active BOOLEAN DEFAULT 1,
                registered_by VARCHAR(50) NOT NULL
                );`);

            await db.execute(`
                CREATE TABLE IF NOT EXISTS payment_records(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                amount_paid INT NOT NULL CHECK (amount_paid >= 0), 
                payment_date TEXT NOT NULL, 
                user_id INTEGER NOT NULL,
                registered_by VARCHAR(50) NOT NULL, 
                FOREIGN KEY(user_id) REFERENCES users_id(id) ON DELETE CASCADE
                );`);

            await db.execute(`
                CREATE TABLE IF NOT EXISTS attendance(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                check_in_date TEXT NOT NULL,
                check_in_time TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users_id(id) ON DELETE CASCADE
                );`);

            await db.execute(`
                CREATE TABLE IF NOT EXISTS staff(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL CHECK(role IN ('admin', 'dependiente'))
                );`);
            
            const staffCount = await db.select(`SELECT COUNT(*) as total FROM staff`);
            if(staffCount[0].total === 0){
                // If no user is present in staff, create default admin el 'admin' with password 'admin123'
                const defaultHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
                await db.execute(
                    `INSERT INTO staff (username, password, role) VALUES ('admin', $1, 'admin')`,
                    [defaultHash]
                );
                console.log('Usuario administrador por defecto creado.');
            }

        return new Data(db);
        }catch(error){
            throw error;
        }
    }

    getCurrentUserData(){
        return this.#currentUser;
    }

    setCurrentUser(user) {
        this.#currentUser = user;
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
            } 
        });   
    }

    async recordAttendance(identifier) {
        return this.sqlQueue.enqueue(async ()=>{
            try {
                const users = await this.db.select(
                    `SELECT id, name FROM users_id WHERE ci = $1 OR id = $2`,
                    [identifier, parseInt(identifier) || 0]
                );

                if (!users || users.length === 0) {
                    throw { type: 'NOT_FOUND', message: 'Cliente no registrado' };
                }

                const user = users[0];
                const today = new Date().toISOString().split('T')[0];
                const time = new Date().toTimeString().split(' ')[0].substring(0, 5); // Format HH:MM

                const duePay = await this.db.select(`
                    SELECT last_payment
                    FROM users_id 
                    WHERE id = $1 
                    AND COALESCE(last_payment, '1970-01-01T00:00') <= strftime('%Y-%m-%dT%H:%M', datetime('now', 'localtime', '-31 day'))`, 
                    [user.id]);
                console.log(duePay);

                if (duePay && duePay.length > 0){
                    if (duePay[0].last_payment === null){
                        throw { type: 'DUE_PAY', message: 'El cliente no ha pagado por primera vez!' };
                    }
                    throw { type: 'DUE_PAY', message: 'El cliente tiene atraso en el pago!' };
                }

                const existing = await this.db.select(
                    `SELECT id FROM attendance WHERE user_id = $1 AND check_in_date = $2`,
                    [user.id, today]
                );

                if (existing && existing.length > 0) {
                    throw { type: 'DUPLICATE', message: `${user.name} ya registró entrada hoy.` };
                }

                await this.db.execute(
                    `INSERT INTO attendance (user_id, check_in_date, check_in_time) VALUES ($1, $2, $3)`,
                    [user.id, today, time]
                );

                return { name: user.name, time };
            } catch (error) {
                console.error(error);
                throw error;
            }
        });
    }

    async getTodayAttendance() {
        try {
            const today = new Date().toISOString().split('T')[0];
            return await this.queryDatabase('get',
                `SELECT a.id, a.check_in_time, u.id as user_id, u.name, u.ci 
                FROM attendance a 
                JOIN users_id u ON a.user_id = u.id 
                WHERE a.check_in_date = $1 
                ORDER BY a.id DESC`,
                [today]
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async verifyLogin(username, passwordHash) {
        const user = await this.queryDatabase('get',
            `SELECT username, role FROM staff WHERE username = $1 AND password = $2`,
            [username, passwordHash]
        );
        if(user.length > 0) {
            return user[0];
        }else {
            throw new Error('Usuario o contraseña incorrectos');
        }
    }

    async addUserSession(name, password, role){
        try{
            await this.queryDatabase('set', 
                `INSERT INTO staff(username, password, role) VALUES ($1, $2, $3)`, 
                [name, password, role]);
        }catch(error){
            throw error;
        }
    }

    async deleteUserSession(name){
        try {
            if(this.#currentUser.username === name) {
                throw new Error('No puedes eliminar tu propia sesión');
            }
            await this.queryDatabase('set',
                `DELETE FROM staff WHERE username = $1`, 
                [name]);

        } catch (error) {
            throw error;
        }
    }

    async getSearchUsers(searchTerm, limit, offset){
        try{
            const term = `%${searchTerm}%`; 
            return await this.queryDatabase('get', 
                `SELECT * FROM users_id 
                 WHERE name LIKE $1 OR ci LIKE $1 OR id LIKE $1
                 ORDER BY id LIMIT $2 OFFSET $3`, 
                [term, limit, offset]
            );
        }catch(error){
            console.log(error);
            throw error;
        }
    }

    async getSearchUsersCount(searchTerm) {
        try {
            const term = `%${searchTerm}%`;
            const result = await this.queryDatabase('get', 
                `SELECT COUNT(*) as total FROM users_id WHERE name LIKE $1 OR ci LIKE $1 OR id LIKE $1`,
                [term]
            );
            return result[0].total;
        } catch(error) {
            console.log(error);
            throw error;
        }
    }

    async getSearchPayment(searchTerm, limit, offset){
        try{
            const term = `%${searchTerm}%`; 
            return await this.queryDatabase('get', 
                `SELECT * FROM payment_records 
                 WHERE id LIKE $1 OR 
                 DATE(payment_date) LIKE $1 OR 
                 REPLACE(payment_date, 'T', ' ') LIKE $1 
                 OR user_id LIKE $1
                 ORDER BY id LIMIT $2 OFFSET $3`, 
                [term, limit, offset]
            );
        }catch(error){
            console.log(error);
            throw error;
        }
    }

    async getSearchPaymentCount(searchTerm) {
        try {
            const term = `%${searchTerm}%`;
            const result = await this.queryDatabase('get', 
                `SELECT COUNT(*) as total FROM payment_records WHERE id LIKE $1 
                OR DATE(payment_date) LIKE $1 
                OR REPLACE(payment_date, 'T', ' ') LIKE $1 
                OR user_id LIKE $1`,
                [term]
            );
            return result[0].total;
        } catch(error) {
            console.log(error);
            throw error;
        }
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
                    `SELECT COUNT(*) as total FROM (SELECT last_payment, id, name FROM users_id WHERE active = 1) WHERE COALESCE(last_payment, '1970-01-01T00:00') <= strftime('%Y-%m-%dT%H:%M', datetime('now', 'localtime', '-31 day'))`);
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
                `SELECT last_payment, id, name FROM (SELECT last_payment, id, name FROM users_id WHERE active = 1) WHERE COALESCE(last_payment, '1970-01-01T00:00') <= strftime('%Y-%m-%dT%H:%M', datetime('now', 'localtime', '-31 day')) LIMIT $1 OFFSET $2`, 
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
                    `INSERT INTO payment_records (amount_paid, payment_date, user_id, registered_by) VALUES ($1, $2, $3, $4);`,
                    [amountPaid, date, userId, this.#currentUser.username]);

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
                `INSERT INTO users_id(name, ci, registered_by) VALUES ($1, $2, $3)`, 
                [name, ci, this.#currentUser.username]);
        } catch (error) {
           console.log(error);
           throw error; 
        }
    }

    async changeUserName(name, id){
        if(this.#currentUser.role !== 'admin'){
            throw new Error('No tienes los permisos necesarios para ejecutar esta acción');
        }
        try {
            await this.queryDatabase('set',
                `UPDATE users_id SET name = $1, registered_by = $3 WHERE id = $2`,
                [name, id, this.#currentUser.username]);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async changeUserCI(ci, id){
        if(this.#currentUser.role !== 'admin'){
            throw new Error('No tienes los permisos necesarios para ejecutar esta acción');
        }
        try {
            await this.queryDatabase('set',
                `UPDATE users_id SET ci = $1, registered_by = $3 WHERE id = $2`,
                [ci, id, this.#currentUser.username]);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async changeAmountPaid(newAmountPaid, oldAmountPaid, paymentId, userId){
        if(this.#currentUser.role !== 'admin'){
            throw new Error('No tienes los permisos necesarios para ejecutar esta acción');
        }
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

                await this.db.execute(
                    `UPDATE payment_records SET registered_by = $1 WHERE id = $2`, 
                    [this.#currentUser.username, paymentId]
                );

                await this.db.execute(`COMMIT`);
            } catch (error) {
                await this.db.execute(`ROLLBACK`);
                console.log(error);
                throw error;
            }
        });
    }

    async changeUserStatus(newStatus, id){
        if(this.#currentUser.role !== 'admin'){
            throw new Error('No tienes los permisos necesarios para ejecutar esta acción');
        }
        try {
            await this.queryDatabase('set',
                `UPDATE users_id SET active = $1, registered_by = $3 WHERE id = $2`,
                [newStatus, id, this.#currentUser.username]);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async changePaymentUser(userId, newUserId, paymentId){
        if(this.#currentUser.role !== 'admin'){
            throw new Error('No tienes los permisos necesarios para ejecutar esta acción');
        }
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

                await this.db.execute(
                    `UPDATE payment_records SET registered_by = $1 WHERE id = $2`, 
                    [this.#currentUser.username, paymentId]
                );

                await this.db.execute(`COMMIT`);
            } catch (error) {
                await this.db.execute(`ROLLBACK`);
                console.log('Error during transaction:', error);
                throw error;
            }
        });
    }

    async changePaymentDate(newDate, paymentId, userId) {
        if(this.#currentUser.role !== 'admin'){
            throw new Error('No tienes los permisos necesarios para ejecutar esta acción');
        }
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

                await this.db.execute(
                    `UPDATE payment_records SET registered_by = $1 WHERE id = $2`, 
                    [this.#currentUser.username, paymentId]
                );

                await this.db.execute(`COMMIT`);
            } catch (error) {
                await this.db.execute(`ROLLBACK`);
                console.log('Error during transaction:', error);
                throw error;
            }
        });
    }

    async deletePayment(paymentId){
        if(this.#currentUser.role !== 'admin'){
            throw new Error('No tienes los permisos necesarios para ejecutar esta acción');
        }
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
        if(this.#currentUser.role !== 'admin'){
            throw new Error('No tienes los permisos necesarios para ejecutar esta acción');
        }
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