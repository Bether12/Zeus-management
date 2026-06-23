import { Data } from "./db.js";

export const GUI =(function(){
    const Database = new Data();
    const body = document.querySelector('body');
    const usersTable = document.querySelector('#users-id');
    const paymentsTable = document.querySelector('#payment-records');

    async function renderTables(){
        const responseUsers = await Database.queryDatabase('get', `
            SELECT * FROM users_id;
            `);
        const responsePayments = await Database.queryDatabase('get', `
            SELECT * FROM payment_records;
            `);

        //Render for users_id table
        responseUsers.forEach(element => {
            let row = document.createElement('tr');

            let id = document.createElement('td');
            id.dataset.id =  element.id;
            id.textContent = element.id;
            row.appendChild(id);

            let name = document.createElement('td');
            name.dataset.name = element.name;
            name.textContent = element.name;
            row.appendChild(name);

            let amountPaid = document.createElement('td');
            amountPaid.dataset.amountPaid = element.amount_paid;
            amountPaid.textContent = element.amount_paid;
            row.appendChild(amountPaid);

            let lastPayment = document.createElement('td');
            lastPayment.dataset.lastPayment = element.last_payment;
            lastPayment.textContent = element.last_payment;
            row.appendChild(lastPayment);

            let active = document.createElement('td');
            active.dataset.active = element.active;
            active.textContent = element.active;
            row.appendChild(active);

            usersTable.children.item(1).appendChild(row);
        });

        //Render for payment_records table
        responsePayments.forEach(element => {
            let row = document.createElement('tr');

            let id = document.createElement('td');
            id.dataset.id =  element.id;
            id.textContent = element.id;
            row.appendChild(id);

            let amountPaid = document.createElement('td');
            amountPaid.dataset.amountPaid = element.amount_paid;
            amountPaid.textContent = element.amount_paid;
            row.appendChild(amountPaid);

            let paymentDate = document.createElement('td');
            paymentDate.dataset.paymentDate = element.payment_date;
            paymentDate.textContent = element.payment_date;
            row.appendChild(paymentDate);

            let userId = document.createElement('td');
            userId.dataset.userId = element.user_id;
            userId.textContent = element.user_id;
            row.appendChild(userId);

            paymentsTable.children.item(1).appendChild(row);
        });
    }
    return {renderTables};
})();