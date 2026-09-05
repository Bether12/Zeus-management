export const GUI = function(Data, Event){
    const Database = Data;
    const eventMaster = Event;

    //State variables
    let currentUserSearchTerm = '';
    let currentPaymentSearchTerm = '';
    let currentUser = {};
    let currentPaymentPage = 1;
    let currentUsersPage = 1;
    let currentDuePayPage = 1;
    const rowsPerPage = 50;

    const body = document.querySelector('body');
    const attendanceInput = document.querySelector('#attendance-input');
    const attendanceStatus = document.querySelector('#attendance-status');
    const attendanceTableBody = document.querySelector('#attendance-table tbody');
    const attendanceCount = document.querySelector('#attendance-count');
    const userSearchInput = document.querySelector('#user-search-input');
    const usersTable = document.querySelector('#users-id');
    const usersHeader = document.querySelector('.users-header');
    const usersCount = document.querySelector('#users-count');
    const paySearchInput = document.querySelector('#payment-search-input');
    const paymentsTable = document.querySelector('#payment-records');
    const paymentHeader = document.querySelector('.payment-header');
    const paymentCount = document.querySelector('#payment-count');
    const duePayTable = document.querySelector('#due-pay-users');
    const userDisplay = document.querySelector('.user');
    const changeCurrentUserBtn = document.querySelector('#change-user');
    const addUserSessionBtn = document.createElement('button');
    addUserSessionBtn.id = 'add-user';
    addUserSessionBtn.textContent = 'Añadir usuario';
    const deleteUserSessionBtn = document.createElement('button');
    deleteUserSessionBtn.id = 'delete-user';
    deleteUserSessionBtn.textContent = 'Eliminar usuario';

    //Payments table page controls
    const payPrevBtn = document.querySelector('#pay-prev-page-btn');
    const payNextBtn = document.querySelector('#pay-next-page-btn');
    const payPageIndicator = document.querySelector('#pay-page-indicator');

    //Users table page controls
    const usersPrevBtn = document.querySelector('#users-prev-page-btn');
    const usersNextBtn = document.querySelector('#users-next-page-btn');
    const usersPageIndicator = document.querySelector('#users-page-indicator');

    //Due pays table page controls
    const duePaysPrevBtn = document.querySelector('#due-prev-page-btn');
    const duePaysNextBtn = document.querySelector('#due-next-page-btn');
    const duePaysPageIndicator = document.querySelector('#due-page-indicator');

    //Payment table btn
    const addPaymentBtn = document.querySelector('#add-payment-btn');
    const deletePaymentBtn = document.querySelector('#delete-payment-btn');

    //Users table buttons
    const addUserBtn = document.querySelector('#add-user-btn');
    const generateResumeBtn = document.querySelector('#generate-resume-btn');

    function showAttendanceStatus(message, type) {
        attendanceStatus.textContent = message;
        attendanceStatus.className = `status-banner ${type}`;
        
        setTimeout(() => {
            attendanceStatus.className = 'status-banner hidden';
        }, 3500);
    }

    async function refreshTodayAttendance() {
        const records = await Database.getTodayAttendance();
        console.log(`Attendance: `, records);
        attendanceCount.textContent = records.length;
        
        attendanceTableBody.innerHTML = records.map(r => `
            <tr>
                <td><strong>${r.check_in_time}</strong></td>
                <td>${r.user_id}</td>
                <td>${r.name}</td>
                <td>${r.ci}</td>
            </tr>
        `).join('');
    }

    async function renderPaymentsTable() {
        try {
            const paymentsOffset = (currentPaymentPage - 1) * rowsPerPage;
            let responsePayments;
            if(currentPaymentSearchTerm.trim() !== ''){
                responsePayments = await Database.getSearchPayment(currentPaymentSearchTerm, rowsPerPage, paymentsOffset);
            }else{
                responsePayments = await Database.getPaginatedPayments(rowsPerPage, paymentsOffset);
            }
            console.log(responsePayments);
            paymentCount.textContent = `Número de pagos: (${await Database.getTotalPaymentsCount()})`;
            console.log(paymentCount);
            paymentsTable.querySelector('tbody').innerHTML = '';
            responsePayments.forEach(element => {
                let row = document.createElement('tr');
                let id = document.createElement('td');
                id.dataset.id =  element.id;
                id.textContent = element.id;
                row.appendChild(id);
                let amountPaid = document.createElement('td');
                amountPaid.dataset.amountPaid = element.amount_paid;
                amountPaid.dataset.id = element.id;
                amountPaid.dataset.userId = element.user_id;
                amountPaid.textContent = currentUser.role === 'admin'? '✏️ ' + element.amount_paid : element.amount_paid;
                row.appendChild(amountPaid);
                let paymentDate = document.createElement('td');
                paymentDate.dataset.paymentDate = element.payment_date;
                paymentDate.dataset.userId = element.user_id;
                paymentDate.dataset.id = element.id;
                paymentDate.textContent = currentUser.role === 'admin'? '✏️ ' + element.payment_date : element.payment_date;
                row.appendChild(paymentDate);
                let userId = document.createElement('td');
                userId.dataset.userId = element.user_id;
                userId.dataset.id = element.id;
                userId.textContent = currentUser.role === 'admin'? '✏️ ' + element.user_id : element.user_id;
                row.appendChild(userId);
                let registeredBy = document.createElement('td');
                registeredBy.textContent = element.registered_by;
                row.appendChild(registeredBy);
                paymentsTable.querySelector('tbody').appendChild(row);
            });
        } catch (error) {
            renderErrorMsg(error);
        }
    }

    async function renderUsersTable() {
        try {
            const usersOffset = (currentUsersPage - 1) * rowsPerPage;
            let responseUsers;
            if (currentUserSearchTerm.trim() !== '') {
                responseUsers = await Database.getSearchUsers(currentUserSearchTerm, rowsPerPage, usersOffset);
            } else {
                responseUsers = await Database.getPaginatedUsers(rowsPerPage, usersOffset);
            }
            console.log(responseUsers);
            usersCount.textContent = `Número de clientes: (${await Database.getTotalUsersCount()})`;
            console.log(usersCount);
            usersTable.querySelector('tbody').innerHTML = '';
            responseUsers.forEach(element => {
                let row = document.createElement('tr');
                let id = document.createElement('td');
                id.dataset.id =  element.id;
                id.textContent = element.id;
                row.appendChild(id);
                let name = document.createElement('td');
                name.dataset.name = element.name;
                name.dataset.id = element.id;
                name.textContent = currentUser.role === 'admin'? '✏️ ' + element.name : element.name;
                row.appendChild(name);
                let ci = document.createElement('td');
                ci.dataset.ci = element.ci;
                ci.dataset.id = element.id;
                ci.textContent = currentUser.role === 'admin'? '✏️ ' + element.ci : element.ci;
                row.appendChild(ci);
                let amountPaid = document.createElement('td');
                amountPaid.dataset.totalPaid = element.amount_paid;
                amountPaid.textContent = element.amount_paid;
                row.appendChild(amountPaid);
                let lastAmountPaid = document.createElement('td');
                lastAmountPaid.dataset.lastAmountPaid = element.last_amount_paid;
                lastAmountPaid.textContent = element.last_amount_paid;
                row.appendChild(lastAmountPaid);
                let lastPayment = document.createElement('td');
                lastPayment.dataset.lastPayment = element.last_payment;
                lastPayment.textContent = element.last_payment !== null ? element.last_payment : 'Nunca';
                row.appendChild(lastPayment);
                let active = document.createElement('td');
                active.dataset.active = element.active;
                active.dataset.id = element.id;
                if(element.active === 1){
                    active.textContent = currentUser.role === 'admin'? '✏️ ' + 'Sí' : 'Sí';
                }else{
                    active.textContent = currentUser.role === 'admin'? '✏️ ' + 'No' : 'No';
                }
                row.appendChild(active);
                let registeredBy = document.createElement('td');
                registeredBy.textContent = element.registered_by;
                row.appendChild(registeredBy);
                usersTable.querySelector('tbody').appendChild(row);
            });
        } catch (error) {
            renderErrorMsg(error);
        }
    }

    async function renderDuePayTable() {
        try {
            const duePaysOffset = (currentDuePayPage - 1) * rowsPerPage;
            const responseDuePay = await Database.getPaginatedDuePay(rowsPerPage, duePaysOffset);
            console.log(responseDuePay);
            duePayTable.querySelector('tbody').innerHTML = '';
            responseDuePay.forEach(element => {
                let row = document.createElement('tr');
                let id = document.createElement('td');
                id.textContent = element.id
                row.appendChild(id);
                let name = document.createElement('td');
                name.textContent = element.name;
                row.appendChild(name);
                let lastPayment = document.createElement('td');
                lastPayment.textContent = element.last_payment !== null ? element.last_payment : 'Nunca';
                row.appendChild(lastPayment);
                duePayTable.querySelector('tbody').appendChild(row);
            });
        } catch (error) {
            renderErrorMsg(error);
        }
    }

    async function renderTables(){
        await renderUsersTable();
        await renderPaymentsTable();
        await renderDuePayTable();
        await refreshTodayAttendance();
    };

    function renderAddPaymentForm(){
        try{
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
            amountPaidInput.autofocus = true;
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
            userIdLabel.textContent = 'ID de cliente';
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

            eventMaster.resolveForm('payment',acceptBtn,form,dialog, renderTables, [], renderErrorMsg);
            eventMaster.closeDialog(cancelBtn, dialog);
            eventMaster.checkForm(form);

            body.appendChild(dialog);
            dialog.showModal();
        }catch(error){
            renderErrorMsg(error);
        }
    };

    function renderAddUserForm(){
        try{
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
            nameInput.autofocus = true;
            nameInput.id = 'name-input';
            nameInput.required = true;
            nameInput.minLength = 3;
            form.appendChild(nameInput);

            const ciLabel = document.createElement('label');
            ciLabel.htmlFor = 'ci-input';
            ciLabel.textContent = 'CI:';
            form.appendChild(ciLabel);

            const ciInput = document.createElement('input');
            ciInput.id = 'ci-input';
            ciInput.required = true;
            ciInput.pattern = '[0-9]{11}';
            form.appendChild(ciInput);

            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'accept-btn';
            acceptBtn.type = 'submit';
            acceptBtn.textContent = 'Aceptar';
            form.appendChild(acceptBtn);

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'cancel-btn';
            cancelBtn.textContent = 'Cancelar';
            form.appendChild(cancelBtn);

            eventMaster.resolveForm('user',acceptBtn,form,dialog, renderTables, [], renderErrorMsg);
            eventMaster.closeDialog(cancelBtn, dialog);
            eventMaster.checkForm(form);

            body.appendChild(dialog);
            dialog.showModal();
        }catch(error){
            renderErrorMsg(error);
        }
    };

    function renderEditForm(field){
        try{
            const dialog = document.createElement('dialog');
            const form = document.createElement('form');
            form.noValidate = true;
            dialog.appendChild(form);

            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'accept-btn';
            acceptBtn.textContent = 'Aceptar';
            form.appendChild(acceptBtn);

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'cancel-btn';
            cancelBtn.textContent = 'Cancelar';
            form.appendChild(cancelBtn);

            eventMaster.resolveForm('edit',acceptBtn,form,dialog, renderTables, field, renderErrorMsg);
            eventMaster.closeDialog(cancelBtn, dialog);
            eventMaster.checkForm(form);

            if (field.dataset.name !== undefined){
                const nameLabel = document.createElement('label');
                nameLabel.htmlFor = 'name-input';
                nameLabel.textContent = 'Nuevo nombre:';
                form.insertBefore(nameLabel, acceptBtn);

                const nameInput = document.createElement('input');
                nameInput.autofocus = true;
                nameInput.id = 'name-input';
                nameInput.value = field.dataset.name;
                nameInput.required = true;
                nameInput.minLength = 3;
                form.insertBefore(nameInput, acceptBtn);

                body.appendChild(dialog);
                dialog.showModal();

            } else if (field.dataset.ci !== undefined){
                const ciLabel = document.createElement('label');
                ciLabel.htmlFor = 'ci-input';
                ciLabel.textContent = 'Nuevo CI:';
                form.insertBefore(ciLabel, acceptBtn);

                const ciInput = document.createElement('input');
                ciInput.autofocus = true;
                ciInput.id = 'ci-input';
                ciInput.value = field.dataset.ci;
                ciInput.required = true;
                ciInput.pattern = '[0-9]{11}';
                form.insertBefore(ciInput, acceptBtn);

                body.appendChild(dialog);
                dialog.showModal();

            } else if (field.dataset.amountPaid !== undefined){
                const amountPaidLabel = document.createElement('label');
                amountPaidLabel.htmlFor = 'amount-paid-input';
                amountPaidLabel.textContent = 'Nueva cantidad pagada:';
                form.insertBefore(amountPaidLabel, acceptBtn);

                const amountPaidInput = document.createElement('input');
                amountPaidInput.autofocus = true;
                amountPaidInput.id = 'amount-paid-input';
                amountPaidInput.type = 'number';
                amountPaidInput.value = field.dataset.amountPaid;
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
                paymentDateInput.autofocus = true;
                paymentDateInput.id = 'payment-date-input';
                paymentDateInput.type = 'datetime-local';
                paymentDateInput.value = field.dataset.paymentDate;
                paymentDateInput.required = true;
                form.insertBefore(paymentDateInput, acceptBtn);

                body.appendChild(dialog);
                dialog.showModal();

            }else if (field.dataset.active !== undefined){
                const activeLabel = document.createElement('label');
                activeLabel.htmlFor = 'active-input';
                activeLabel.textContent = 'Nuevo estado de cliente:';
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
                activeInput.value = field.dataset.active;
                activeInput.autofocus = true;

                body.appendChild(dialog);
                dialog.showModal();
                
            } else if (field.dataset.userId !== undefined){
                const userIdLabel = document.createElement('label');
                userIdLabel.htmlFor = 'user-id-input';
                userIdLabel.textContent = 'Nuevo ID de cliente:';
                form.insertBefore(userIdLabel, acceptBtn);

                const userIdInput = document.createElement('input');
                userIdInput.autofocus = true;
                userIdInput.id = 'user-id-input';
                userIdInput.type = 'number';
                userIdInput.value = field.dataset.userId;
                userIdInput.step = '1';
                userIdInput.required = true;
                form.insertBefore(userIdInput, acceptBtn);

                body.appendChild(dialog);
                dialog.showModal();

            }else{
                return;
            }
        }catch(error){
            renderErrorMsg(error);
        }
    };

    function renderDeletePaymentForm(){
        try{
            const form = document.createElement('form');
            const dialog = document.createElement('dialog');
            form.noValidate = true;

            const paymentIdLabel = document.createElement('label');
            paymentIdLabel.htmlFor = 'payment-id-input';
            paymentIdLabel.textContent = 'ID de pago:';
            form.appendChild(paymentIdLabel);

            const paymentIdInput = document.createElement('input');
            paymentIdInput.autofocus = true;
            paymentIdInput.id = 'payment-id-input';
            paymentIdInput.type = 'number';
            paymentIdInput.placeholder = 'Ej. 1 o 2';
            paymentIdInput.step = '1';
            paymentIdInput.required = true;
            form.appendChild(paymentIdInput);

            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'accept-btn';
            acceptBtn.textContent = 'Aceptar';
            form.appendChild(acceptBtn);

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'cancel-btn';
            cancelBtn.textContent = 'Cancelar';
            form.appendChild(cancelBtn);

            eventMaster.resolveForm('delete', acceptBtn, form, dialog, renderTables, [], renderErrorMsg);
            eventMaster.closeDialog(cancelBtn, dialog);
            eventMaster.checkForm(form);

            dialog.appendChild(form);
            body.appendChild(dialog);
            dialog.showModal();
        }catch(error){
            renderErrorMsg(error);
        }
    }

    function renderErrorMsg(error){
        const dialog = document.createElement('dialog');

        const text = document.createElement('p');
        text.textContent = 'Ha ocurrido un error: ';
        dialog.appendChild(text);

        const div = document.createElement('div');
        div.textContent = error.message || String(error);
        dialog.appendChild(div);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Cerrar';
        dialog.appendChild(closeBtn);
        eventMaster.closeDialog(closeBtn, dialog);

        body.appendChild(dialog);
        dialog.showModal();
    }

    function renderResumeForm(){
        try{
            const dialog = document.createElement('dialog');
            const form = document.createElement('form');
            form.noValidate = true;
            dialog.appendChild(form);

            //Element generation
            const selectLabel = document.createElement('label');
            selectLabel.htmlFor = 'select-input';
            selectLabel.textContent = 'Tipo de resumen:';
            form.appendChild(selectLabel);

            const selectInput = document.createElement('select');
            selectInput.id = 'select-input';
            selectInput.required = true;
            selectInput.autofocus = true;
            form.appendChild(selectInput);

            const dayOption = document.createElement('option');
            dayOption.value = 'day';
            dayOption.textContent = 'Diario';
            selectInput.appendChild(dayOption);

            const monthOption = document.createElement('option');
            monthOption.value = 'month';
            monthOption.textContent = 'Mensual';
            selectInput.appendChild(monthOption);

            const yearOption = document.createElement('option');
            yearOption.value = 'year';
            yearOption.textContent = 'Anual';
            selectInput.appendChild(yearOption);

            const dateLabel = document.createElement('label');
            dateLabel.htmlFor = 'date-input';
            form.appendChild(dateLabel);

            const dateInput = document.createElement('input');
            dateInput.id = 'date-input';
            dateInput.required = true;
            form.appendChild(dateInput);

            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'accept-btn';
            acceptBtn.textContent = 'Generar Resumen';
            form.appendChild(acceptBtn);

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'cancel-btn';
            cancelBtn.textContent = 'Cancelar';
            form.appendChild(cancelBtn);

            eventMaster.addChangeEventListener(selectInput, generateDatePicker, [selectInput, dateInput, dateLabel]);
            eventMaster.addClickEventListener(acceptBtn, generateResume, true, dateInput);
            eventMaster.closeDialog(cancelBtn, dialog);
            eventMaster.checkForm(form);

            generateDatePicker(selectInput, dateInput, dateLabel);

            body.appendChild(dialog);
            dialog.showModal();
        }catch(error){
            renderErrorMsg(error);
        }
    }

    function generateDatePicker(select, input, label){
        const value = select.value;
        const date = new Date();
        
        if(value === 'day'){
            label.textContent = 'Seleccione el día deseado:';
            input.type = 'date';
            input.max = date.toISOString().split('T')[0];
        }else if(value === 'month'){
            label.textContent = 'Seleccione el mes deseado:';
            input.type = 'month';
            input.max = date.toISOString().substring(0, 7);
        }else if(value === 'year'){
            label.textContent = 'Seleccione el año deseado:';
            input.type = 'number';
            input.max = date.getFullYear();
        }else{
            return;
        }
    }

    async function generateResume(date){
        /*
        De tener:
        Total de pagos, (numero de clientes en el espacio de tiempo que entraron) y los que pagaron
        */
        try{
            const resume = await Database.getDateResume(date);
            console.log(resume);
            //Generate GUI elements
            const dialog = document.createElement('dialog');

            const numberOfUsersLabel = document.createElement('label');
            numberOfUsersLabel.htmlFor = 'number-of-users-text';
            numberOfUsersLabel.textContent = 'Número de clientes que pagaron:';
            dialog.appendChild(numberOfUsersLabel);

            const numberOfUsersText = document.createElement('p');
            numberOfUsersText.id = 'number-of-users-text';
            numberOfUsersText.textContent = resume.resume[0].users_total;
            dialog.appendChild(numberOfUsersText);

            const paymentRecordsLabel = document.createElement('label');
            paymentRecordsLabel.htmlFor = 'payment-records-table';
            paymentRecordsLabel.textContent = 'Registro de pagos:';
            dialog.appendChild(paymentRecordsLabel);

            const paymentRecordsTable = document.createElement('table');
            paymentRecordsTable.id = 'payment-records-table';
            const tbody = document.createElement('tbody');
            const fragment = document.createDocumentFragment();
            const hRow = document.createElement('tr');
            const thId = document.createElement('th');
            thId.textContent = 'ID';
            hRow.appendChild(thId);
            const thPaid = document.createElement('th');
            thPaid.textContent = 'Pago';
            hRow.appendChild(thPaid);
            tbody.appendChild(hRow);
            resume.usersResume.forEach(element =>{
                let row = document.createElement('tr');

                let id = document.createElement('td');
                id.textContent = element.user_id;
                row.appendChild(id);

                let paid = document.createElement('td');
                paid.textContent = element.amount_paid;
                row.appendChild(paid);

                fragment.appendChild(row);
            });

            tbody.appendChild(fragment);
            paymentRecordsTable.appendChild(tbody);
            dialog.appendChild(paymentRecordsTable);

            const totalPaidLabel = document.createElement('label');
            totalPaidLabel.htmlFor = 'total-paid-text';
            totalPaidLabel.textContent = 'Total pagado:';
            dialog.appendChild(totalPaidLabel);

            const totalPaidText = document.createElement('p');
            totalPaidText.id = 'total-paid-text';
            totalPaidText.textContent = resume.resume[0].paid_total !== null ? resume.resume[0].paid_total : 0;
            dialog.appendChild(totalPaidText);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.textContent = 'Cerrar';
            dialog.appendChild(closeBtn);

            eventMaster.closeDialog(closeBtn, dialog);

            body.appendChild(dialog);
            dialog.showModal();
        }catch(error){
            throw error;
        }
    }

    function logIn(){
        const dialog = document.createElement('dialog');
        dialog.addEventListener('cancel', (e) => e.preventDefault());
        const form = document.createElement('form');
        dialog.appendChild(form);
        form.noValidate = true;

        const userNameLabel = document.createElement('label');
        userNameLabel.htmlFor = 'user-name-input';
        userNameLabel.textContent = 'Usuario:';
        form.appendChild(userNameLabel);

        const userNameInput = document.createElement('input');
        userNameInput.id = 'user-name-input';
        userNameInput.required = true;
        userNameInput.autofocus = true;
        userNameInput.minLength = 3;
        form.appendChild(userNameInput);

        const userPasswordLabel = document.createElement('label');
        userPasswordLabel.htmlFor = 'user-password-input';
        userPasswordLabel.textContent = 'Contraseña:';
        form.appendChild(userPasswordLabel);

        const userPasswordInput = document.createElement('input');
        userPasswordInput.id = 'user-password-input';
        userPasswordInput.required = true;
        userPasswordInput.type = 'password';
        form.appendChild(userPasswordInput);

        const logInBtn = document.createElement('button');
        logInBtn.className = 'log-in-btn';
        logInBtn.textContent = 'Iniciar Sesión';
        form.appendChild(logInBtn);

        eventMaster.resolveForm('login', logInBtn, form, dialog, [renderCurrentUser, renderTables], [], renderErrorMsg);
        eventMaster.checkForm(form);

        body.appendChild(dialog);
        dialog.showModal();
    }

    function renderCurrentUser(){
        currentUser = Database.getCurrentUserData();

        userDisplay.querySelector('p').textContent = `Usuario: ${currentUser.username}, Rol: ${currentUser.role}`;

        if(currentUser.role === 'admin'){
            userDisplay.appendChild(addUserSessionBtn);
            userDisplay.appendChild(deleteUserSessionBtn);
            usersHeader.querySelector('h3').textContent += '-(Tip: Ctrl + Click en una celda con ✏️ para editar)';
            paymentHeader.querySelector('h3').textContent += '-(Tip: Ctrl + Click en una celda con ✏️ para editar)';
        }else{
            if(userDisplay.querySelector('#add-user')){userDisplay.querySelector('#add-user').remove()};
            if(userDisplay.querySelector('#delete-user')){userDisplay.querySelector('#delete-user').remove()};
            usersHeader.querySelector('h3').textContent = usersHeader.querySelector('h3').textContent.split('-')[0];
            paymentHeader.querySelector('h3').textContent = paymentHeader.querySelector('h3').textContent.split('-')[0];
        }
    }

    function renderAddUserSessionForm(){
        const dialog = document.createElement('dialog');
        const form = document.createElement('form');
        form.noValidate = true;
        dialog.appendChild(form);

        const userNameLabel = document.createElement('label');
        userNameLabel.htmlFor = 'user-name-input';
        userNameLabel.textContent = 'Nombre de usuario:';
        form.appendChild(userNameLabel);

        const userNameInput = document.createElement('input');
        userNameInput.id = 'user-name-input';
        userNameInput.autofocus = true;
        userNameInput.required = true;
        userNameInput.minLength = 3;
        form.appendChild(userNameInput);

        const userPasswordLabel = document.createElement('label');
        userPasswordLabel.htmlFor = 'user-password-input';
        userPasswordLabel.textContent = 'Contraseña:';
        form.appendChild(userPasswordLabel);

        const userPasswordInput = document.createElement('input');
        userPasswordInput.id = 'user-password-input';
        userPasswordInput.required = true;
        userPasswordInput.minLength = 8;
        userPasswordInput.type = 'password';
        form.appendChild(userPasswordInput);

        const userRoleLabel = document.createElement('label');
        userRoleLabel.htmlFor = 'user-role-input';
        userRoleLabel.textContent = 'Rol:';
        form.appendChild(userRoleLabel);

        const userRoleInput = document.createElement('select');
        userRoleInput.id = 'user-role-input';
        const adminOpt = document.createElement('option');
        adminOpt.value = 'admin';
        adminOpt.textContent = 'Administrador';
        userRoleInput.appendChild(adminOpt);
        const dependentOpt = document.createElement('option');
        dependentOpt.value = 'dependiente';
        dependentOpt.textContent = 'Dependiente';
        userRoleInput.appendChild(dependentOpt);
        form.appendChild(userRoleInput);

        const addUserBtn = document.createElement('button');
        addUserBtn.className = 'accept-btn';
        addUserBtn.textContent = 'Añadir';
        form.appendChild(addUserBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancelar';
        form.appendChild(cancelBtn);

        eventMaster.checkForm(form);
        eventMaster.resolveForm('add-user', addUserBtn, form, dialog, [], [], renderErrorMsg);
        eventMaster.closeDialog(cancelBtn, dialog);

        body.appendChild(dialog);
        dialog.showModal();
    }

    function renderDeleteUserSessionForm(){
        const dialog = document.createElement('dialog');
        const form = document.createElement('form');
        form.noValidate = true;
        dialog.appendChild(form);

        const userNameLabel = document.createElement('label');
        userNameLabel.htmlFor = 'user-name-input';
        userNameLabel.textContent = 'Nombre de usuario a eliminar:';
        form.appendChild(userNameLabel);

        const userNameInput = document.createElement('input');
        userNameInput.id = 'user-name-input';
        userNameInput.autofocus = true;
        userNameInput.required = true;
        userNameInput.minLength = 3;
        form.appendChild(userNameInput);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'accept-btn';
        deleteBtn.textContent = 'Eliminar';
        form.appendChild(deleteBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancelar';
        form.appendChild(cancelBtn);

        eventMaster.checkForm(form);
        eventMaster.resolveForm('delete-user', deleteBtn, form, dialog, [], [], renderErrorMsg);
        eventMaster.closeDialog(cancelBtn, dialog);

        body.appendChild(dialog);
        dialog.showModal();
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }

    const handleUserSearch = async (event)=>{
        currentUserSearchTerm = event.target.value;
        currentUsersPage = 1;
        usersPageIndicator.textContent = `Página 1`;
        await renderUsersTable();
    };

    const handlePaymentSearch = async (event) =>{
        currentPaymentSearchTerm = event.target.value;
        currentPaymentPage = 1;
        payPageIndicator.textContent = `Página 1`;
        await renderPaymentsTable();
    };

    const debouncedUserSearch = debounce(handleUserSearch, 200);

    const debouncedPaymentSearch = debounce(handlePaymentSearch, 200);

    userSearchInput.addEventListener('input', debouncedUserSearch);

    paySearchInput.addEventListener('input', debouncedPaymentSearch);

    attendanceInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const value = attendanceInput.value.trim();
            if (!value) return;

            try {
                const result = await Database.recordAttendance(value);
                showAttendanceStatus(`✅ Entrada registrada: ${result.name} (${result.time})`, 'success');
                attendanceInput.value = '';
                await refreshTodayAttendance();
            } catch (err) {
                if (err.type === 'DUPLICATE') {
                    showAttendanceStatus(`⚠️ ${err.message}`, 'warning');
                } else if (err.type === 'NOT_FOUND' || err.type === 'DUE_PAY') {
                    showAttendanceStatus(`❌ ${err.message}`, 'error');
                } else {
                    showAttendanceStatus(`❌ Error en el registro.`, 'error');
                }
                attendanceInput.value = '';
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            e.preventDefault();
            attendanceInput.focus();
        }
    });

    eventMaster.addClickEventListener(addPaymentBtn, renderAddPaymentForm);
    eventMaster.addClickEventListener(addUserBtn, renderAddUserForm);
    eventMaster.editTableFields(usersTable, renderEditForm);
    eventMaster.editTableFields(paymentsTable, renderEditForm);
    eventMaster.addClickEventListener(deletePaymentBtn, renderDeletePaymentForm);
    eventMaster.addClickEventListener(generateResumeBtn, renderResumeForm);
    eventMaster.addClickEventListener(changeCurrentUserBtn, logIn);
    eventMaster.addClickEventListener(addUserSessionBtn, renderAddUserSessionForm);
    eventMaster.addClickEventListener(deleteUserSessionBtn, renderDeleteUserSessionForm);

    //Pagination controls event listeners
    //Payments
    eventMaster.addClickEventListener(payPrevBtn, () => {
        if (currentPaymentPage > 1) {
            currentPaymentPage--;
            payPageIndicator.textContent = `Página ${currentPaymentPage}`;
            renderPaymentsTable();
        }
    });
    eventMaster.addClickEventListener(payNextBtn, async () => {
        let totalPayments;
        if(currentPaymentSearchTerm.trim() !== ''){
            totalPayments = await Database.getSearchPaymentCount(currentPaymentSearchTerm);
        }else{
            totalPayments = await Database.getTotalPaymentsCount();
        }
        const maxPages = Math.ceil(totalPayments / rowsPerPage) || 1;

        if(currentPaymentPage < maxPages){
            currentPaymentPage++;
            payPageIndicator.textContent = `Página ${currentPaymentPage}`;
            renderPaymentsTable();
        };
    });
    //Users
    eventMaster.addClickEventListener(usersPrevBtn, () => {
        if (currentUsersPage > 1) {
            currentUsersPage--;
            usersPageIndicator.textContent = `Página ${currentUsersPage}`;
            renderUsersTable();
        }
    });
    eventMaster.addClickEventListener(usersNextBtn, async () => {
        let totalUsers;
        if (currentUserSearchTerm.trim() !== '') {
            totalUsers = await Database.getSearchUsersCount(currentUserSearchTerm);
        } else {
            totalUsers = await Database.getTotalUsersCount();
        }
        const maxPages = Math.ceil(totalUsers / rowsPerPage) || 1;

        if (currentUsersPage < maxPages){
            currentUsersPage++;
            usersPageIndicator.textContent = `Página ${currentUsersPage}`;
            renderUsersTable();
        }
    });
    //Due Payments
    eventMaster.addClickEventListener(duePaysPrevBtn, () => {
        if (currentDuePayPage > 1) {
            currentDuePayPage--;
            duePaysPageIndicator.textContent = `Página ${currentDuePayPage}`;
            renderDuePayTable();
        }
    });
    eventMaster.addClickEventListener(duePaysNextBtn, async () => {
        const totalDuePays = await Database.getTotalDuePayCount();
        const maxPages = Math.ceil(totalDuePays / rowsPerPage) || 1;

        if (currentDuePayPage < maxPages){
            currentDuePayPage++;
            duePaysPageIndicator.textContent = `Página ${currentDuePayPage}`;
            renderDuePayTable();
        }
    });

    return {logIn, renderTables, renderErrorMsg};
};