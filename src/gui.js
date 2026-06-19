import { Database } from "./db.js";
import { eventMaster } from "./events.js";

export const Gui = (function(){
    const body = document.querySelector('body');
    const table = document.querySelector('table');
    const addBtn = document.querySelector('#add-btn');
    const resumeBtn = document.querySelector('#resume-btn');
    const editBtn =document.querySelector('edit-btn');

    
    function addEntry(){
        if (!document.querySelector('dialog')){
            //Dialog creation
            const dialog = document.createElement('dialog');

            //Form elements creation
            const form = document.createElement('form');
            form.noValidate = true;
            dialog.appendChild(form);

            const userIdLabel = document.createElement('label');
            userIdLabel.textContent = 'ID:';
            userIdLabel.htmlFor = 'user-id-input';
            const userIdInput = document.createElement('input');
            userIdInput.id = 'user-id-input';
            userIdInput.type = 'number';
            userIdInput.placeholder = '1, 2, o 25';
            userIdInput.step = '1';
            userIdInput.min = '1';
            userIdInput.required = true;
            form.appendChild(userIdLabel);
            form.appendChild(userIdInput);

            const amountPaidLabel = document.createElement('label');
            amountPaidLabel.textContent = 'Cantidad pagada:';
            amountPaidLabel.htmlFor = 'amount-paid-input';
            const amountPaidInput = document.createElement('input');
            amountPaidInput.id = 'amount-paid-input';
            amountPaidInput.type = 'number';
            amountPaidInput.step = '100';
            amountPaidInput.min = '100';
            amountPaidInput.required = true;
            amountPaidInput.placeholder = '1000, 1500 o 2000';
            form.appendChild(amountPaidLabel);
            form.appendChild(amountPaidInput);

            const paymentDateLabel = document.createElement('label');
            paymentDateLabel.textContent = 'Fecha del pago:';
            paymentDateLabel.htmlFor = 'payment-date-input';
            const paymentDateInput = document.createElement('input');
            paymentDateInput.id = 'payment-date-input';
            paymentDateInput.type = 'datetime-local';
            paymentDateInput.placeholder = '23/02/2026 4:00 PM';
            form.appendChild(paymentDateLabel);
            form.appendChild(paymentDateInput);

            const okBtn = document.createElement('button');
            okBtn.type = 'submit';
            okBtn.textContent = 'Añadir entrada';
            eventMaster.addEntry(okBtn, form, dialog, userIdInput, amountPaidInput, paymentDateInput);
            form.appendChild(okBtn);

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancelar';
            form.appendChild(cancelBtn);

            body.appendChild(dialog);

            dialog.showModal();
        }else {
            document.querySelector('dialog').showModal();
        }
    }

    eventMaster.clickEvent(addBtn, addEntry);

    async function renderTable(){
        const tableHead = document.querySelector('thead');
        const tableBody = document.querySelector('tbody');

        const response = await Database.queryDatabase(`SELECT user_id, amount_paid FROM payment_record`);
        const json = await response.json();
        console.log(response);
        console.log(json);
    }

    return { renderTable };
})();