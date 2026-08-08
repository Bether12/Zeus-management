export const GUI = function(Data, Event){
    const Database = Data;
    const eventMaster = Event;
    const body = document.querySelector('body');
    const usersTable = document.querySelector('#users-id');
    const paymentsTable = document.querySelector('#payment-records');

    //Users table btn
    const addPaymentBtn = document.querySelector('#add-payment-btn');
    const editPaymentBtn = document.querySelector('#edit-payment-btn');
    const deletePaymentBtn = document.querySelector('#delete-payment-btn');

    //Payment table buttons
    const addUserBtn = document.querySelector('#add-user-btn');
    const editUserBtn = document.querySelector('#edit-user-btn');

    async function renderTables(){
        const responseUsers = await Database.queryDatabase('get', `
            SELECT * FROM users_id;
            `);
        const responsePayments = await Database.queryDatabase('get', `
            SELECT * FROM payment_records;
            `);
        console.log('Users:', responseUsers);
        console.log('Payments:', responsePayments);

        //Empty table contents if existent
        usersTable.children.item(1).innerHTML = '';
        paymentsTable.children.item(1).innerHTML = '';

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
    };

    function renderAddPaymentForm(){
        const body = document.querySelector('body');
        const dialog = document.createElement('dialog');
        const form = document.createElement('form');
        form.action = 'dialog';
        form.noValidate = true;

        dialog.appendChild(form);
        
        const amountPaidLabel = document.createElement('label');
        amountPaidLabel.htmlFor = 'amount-paid-input';
        amountPaidLabel.textContent = 'Cantidad pagada:';
        form.appendChild(amountPaidLabel);

        const amountPaidInput = document.createElement('input');
        amountPaidInput.id = 'amount-paid-input';
        amountPaidInput.type = 'number';
        amountPaidInput.required = true;
        amountPaidInput.step = '100';
        form.appendChild(amountPaidInput);

        const paymentDateLabel = document.createElement('label');
        paymentDateLabel.htmlFor = 'payment-date-input';
        paymentDateLabel.textContent = 'Fecha de pago(Solo seleccionar si no es ahora):';
        form.appendChild(paymentDateLabel);

        const paymentDateInput = document.createElement('input');
        paymentDateInput.id = 'payment-date-input';
        paymentDateInput.required = true;
        paymentDateInput.type = 'datetime-local';
        form.appendChild(paymentDateInput);

        const userIdLabel = document.createElement('label');
        userIdLabel.htmlFor = 'user-id-input';
        userIdLabel.textContent = 'ID de usuario';
        form.appendChild(userIdLabel);

        const userIdInput = document.createElement('input');
        userIdInput.id = 'user-id-input';
        userIdInput.type = 'number';
        userIdInput.required = true;
        userIdInput.step = '1';
        form.appendChild(userIdInput);

        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'accept-btn';
        acceptBtn.type = 'submit';
        acceptBtn.textContent = 'Aceptar';
        form.appendChild(acceptBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancelar';
        form.appendChild(cancelBtn);

        eventMaster.resolveForm('payment',acceptBtn,form,dialog, renderTables);
        eventMaster.closeDialog(cancelBtn, dialog);
        eventMaster.checkForm(form);

        body.appendChild(dialog);
        dialog.showModal();
    };

    function renderAddUserForm(){
        const body = document.querySelector('body');
        const dialog = document.createElement('dialog');
        const form = document.createElement('form');
        form.action = 'dialog';
        form.noValidate = true;

        dialog.appendChild(form);
        
        const nameLabel = document.createElement('label');
        nameLabel.htmlFor = 'name-input';
        nameLabel.textContent = 'Nombre:';
        form.appendChild(nameLabel);

        const nameInput = document.createElement('input');
        nameInput.id = 'name-input';
        nameInput.required = true;
        nameInput.minLength = 15;
        form.appendChild(nameInput);

        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'accept-btn';
        acceptBtn.type = 'submit';
        acceptBtn.textContent = 'Aceptar';
        form.appendChild(acceptBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancelar';
        form.appendChild(cancelBtn);

        eventMaster.resolveForm('user',acceptBtn,form,dialog, renderTables);
        eventMaster.closeDialog(cancelBtn, dialog);
        eventMaster.checkForm(form);

        body.appendChild(dialog);
        dialog.showModal();
    };

    function renderEditForm(field){
        const dialog = document.createElement('dialog');
        const form = document.createElement('form');
        form.noValidate = true;

        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'accept-btn';
        acceptBtn.textContent = 'Aceptar';
        form.appendChild(acceptBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancelar';
        form.appendChild(cancelBtn);

        eventMaster.resolveForm('edit',acceptBtn,form,dialog, renderTables);
        eventMaster.closeDialog(cancelBtn, dialog);
        eventMaster.checkForm(form);

        if (field.dataset.name !== undefined){
            const nameLabel = document.createElement('label');
            nameLabel.htmlFor = 'name-input';
            nameLabel.textContent = 'Nuevo nombre:';
            form.insertBefore(nameLabel, acceptBtn);

            const nameInput = document.createElement('input');
            nameInput.id = 'name-input';
            nameInput.required = true;
            nameInput.minLength = 15;
            form.insertBefore(nameInput, acceptBtn);

            body.appendChild(dialog);
            dialog.showModal();

        } else if (field.dataset.amountPaid !== undefined){
            const amountPaidLabel = document.createElement('label');
            amountPaidLabel.htmlFor = 'amount-paid-input';
            amountPaidLabel.textContent = 'Nueva cantidad pagada:';
            form.insertBefore(amountPaidLabel, acceptBtn);

            const amountPaidInput = document.createElement('input');
            amountPaidInput.id = 'amount-paid-input';
            amountPaidInput.type = 'number';
            amountPaidInput.required = true;
            amountPaidInput.step = '100';
            form.insertBefore(amountPaidInput, acceptBtn);

            body.appendChild(dialog);
            dialog.showModal();

        } else if (field.dataset.paymentDate !== undefined){
            const paymentDateLabel = document.createElement('label');
            paymentDateLabel.htmlFor = 'payment-date-input';
            paymentDateLabel.textContent = 'Nueva fecha de pago:';
            form.insertBefore(paymentDateLabel, acceptBtn);

            const paymentDateInput = document.createElement('input');
            paymentDateInput.id = 'amount-paid-input';
            paymentDateInput.type = 'datetime-local';
            paymentDateInput.required = true;
            form.insertBefore(paymentDateInput, acceptBtn);

            body.appendChild(dialog);
            dialog.showModal();

        } else if (field.dataset.userId !== undefined){
            const userIdLabel = document.createElement('label');
            userIdLabel.htmlFor = 'user-id-input';
            userIdLabel.textContent = 'Nuevo ID de usuario:';
            form.insertBefore(userIdLabel, acceptBtn);

            const userIdInput = document.createElement('input');
            userIdInput.id = 'user-id-input';
            userIdInput.type = 'number';
            userIdInput.step = '1';
            userIdInput.required = true;
            form.insertBefore(userIdInput, acceptBtn);

            body.appendChild(dialog);
            dialog.showModal();

        }else if (field.dataset.active !== undefined){
            const activeLabel = document.createElement('label');
            activeLabel.htmlFor = 'active-input';
            activeLabel.textContent = 'Nuevo estado de usuario:';
            form.insertBefore(activeLabel, acceptBtn);

            const activeInput = document.createElement('select');
            activeInput.id = 'active-input';
            activeInput.required = true;
            form.insertBefore(activeInput, acceptBtn);
            const activeOpt = document.createElement('option');
            activeOpt.value = '1';
            activeOpt.textContent = 'Activo';
            activeInput.appendChild(activeOpt);
            const inactiveOpt = document.createElement('option');
            inactiveOpt.value = '0';
            inactiveOpt.textContent = 'Inactivo';
            activeInput.appendChild(inactiveOpt);

            body.appendChild(dialog);
            dialog.showModal();
            
        }else{
            return;
        }
    };

    eventMaster.addClickEventListener(addPaymentBtn, renderAddPaymentForm);
    eventMaster.addClickEventListener(addUserBtn, renderAddUserForm);
    eventMaster.editTableFields(usersTable, renderEditForm);
    eventMaster.editTableFields(paymentsTable, renderEditForm);

    return {renderTables};
};