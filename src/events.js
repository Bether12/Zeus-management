import { exportBackup, importBackup, restoreToPreviousBackup } from "./backup.js";

export const eventMaster = function(Data){
    const Database = Data;

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    window.__TAURI__.event.listen('tauri://back', ()=>{
        const openDialog = document.querySelector('dialog');

        if (openDialog){
            openDialog.close();
            openDialog.remove();
        }
    });

    function exportEventListener(DOMElement){
        DOMElement.addEventListener('click', async () => {
            DOMElement.disabled = true;
            const result = await exportBackup(Database);
            if(result.success){
                alert(result.message);
            }else {
                alert(`Error: ${result.message}`);
            }
            DOMElement.disabled = false;
        });
    }

    function importEventListener(DOMElement){
        DOMElement.addEventListener('click', async () => {
            DOMElement.disabled = true;
            const result = await importBackup(Database);

            if (result.success) {
                alert(result.message);
                setTimeout(()=>{
                    window.__TAURI__.process.relaunch();}, 
                    3000
                );
            } else if (result.message !== 'Operación cancelada.') {
                alert(`Error: ${result.message}`);
            }
            DOMElement.disabled = false;
        });
    }
    
    function restoreEventListener(DOMElement){
        DOMElement.addEventListener('click', async () =>{
            DOMElement.disabled = true;

            const result = await restoreToPreviousBackup();

            if (result.success) {
                alert(result.message);
                setTimeout(()=>{
                    window.__TAURI__.process.relaunch();}, 
                    3000
                );
            } else if (result.message !== 'Operación cancelada.') {
                alert(`Error: ${result.message}`);
            }

            DOMElement.disabled = false;
        });
    }

    function addClickEventListener(DOMElement, fun, generateResume = false, dateInput=undefined){
        DOMElement.addEventListener('click', (e)=>{
            if(generateResume){
                e.preventDefault();
                fun(dateInput.value);
            }else{
                fun();
            }});
    }

    function addChangeEventListener(DOMElement, fun, params=[]){
        DOMElement.addEventListener('change', e=>{
            if(params.length > 0){
                fun(...params);
            }else{
                fun();
            }
        });
    }

    function closeDialog(DOMElement, dialog){
        DOMElement.addEventListener('click', (e)=>{
            dialog.close();
            dialog.remove();
        });

        dialog.addEventListener('close', (e)=>{
            dialog.remove();
        });
    }

    function checkForm(DOMElement){
        DOMElement.addEventListener('input', (e) => {
            e.target.setCustomValidity('');
        });
        
        DOMElement.addEventListener('focusout', (e) => {
            validateField(e.target);
        });

        DOMElement.addEventListener('keydown', (e)=>{
            if(e.key === 'Enter' && e.target.tagName === 'INPUT'){
                e.preventDefault();
                
                const inputs = DOMElement.querySelectorAll('input');
                let isFormValid = true;

                for (let input of inputs) {
                    validateField(input);
                    if (!input.checkValidity()) {
                        isFormValid = false;
                        break;
                    }
                }
                
                if (isFormValid) {
                    const submitBtn = DOMElement.querySelector('.accept-btn, .log-in-btn');
                    if (submitBtn) {
                        submitBtn.click();
                    }
                }
            }
        });
    }

    function validateField(target){
        if (target.id === 'amount-paid-input'){
            if (target.validity.valueMissing){
                target.setCustomValidity('El monto a pagar no puede estar vacío');
            } else if (target.validity.stepMismatch || Number(target.value) <= 0){
                target.setCustomValidity('El monto pagado tiene que ser un múltiplo positivo de 100');
            }
        } else if (target.id === 'payment-date-input' || target.id === 'date-input'){
            if (target.validity.valueMissing){
                target.setCustomValidity('La fecha no puede estar vacía');
            } else if (target.validity.rangeOverflow){
                target.setCustomValidity('La fecha seleccionada no puede ser futura');
            } else if (!target.validity.valid){
                target.setCustomValidity('Formato de fecha inválido');
            }
        } else if (target.id === 'user-id-input'){
            if (target.validity.valueMissing){
                target.setCustomValidity('Escriba el ID del usuario');
            } else if (target.validity.stepMismatch || Number(target.value) <= 0){
                target.setCustomValidity('El ID tiene que ser un número entero positivo');
            }
        } else if (target.id === 'name-input' || target.id === 'user-name-input'){
            if (target.validity.valueMissing){
                target.setCustomValidity('El nombre de usuario no puede estar vacío');
            } else if (target.validity.tooShort){
                target.setCustomValidity('El nombre de usuario ha de tener al menos 3 letras');
            }
        } else if (target.id === 'ci-input'){
            if (target.validity.valueMissing){
                target.setCustomValidity('El CI no puede estar vacío');
            }else if (target.validity.patternMismatch){
                target.setCustomValidity('El CI tiene que ser un número de 11 dígitos');
            }
        } else if (target.id === 'payment-id-input'){
            if (target.validity.stepMismatch || Number(target.value) <= 0){
                target.setCustomValidity('El ID tiene que ser un número entero positivo');
            } else if (target.validity.valueMissing){
                target.setCustomValidity('Escriba el ID de pago');
            }
        }else if (target.id === 'user-password-input'){
            if(target.validity.valueMissing){
                target.setCustomValidity('La contraseña no puede estar vacía');
            } else if (target.validity.tooShort){
                target.setCustomValidity('La contraseña no puede tener menos de 8 caracteres');
            }
        }

        if(!target.checkValidity()){
            target.reportValidity();
        }
    }

    /**
     * 
     * @param {String} type - Action to be done. It can be add-user, add-trainer, delete-user, login, add-payment, add-client, delete-payment and edit.
     * If its edit, the provided form must have the name of the edition to be performed
     * @param {HTMLElement} DOMElement 
     * @param {HTMLFormElement} form 
     * @param {HTMLDialogElement} dialog 
     * @param {Function} renderFunc 
     * @param {HTMLElement} field 
     * @param {Function} renderErrorMsg 
     */
    function resolveForm(type, DOMElement, form, dialog, renderFunc=function(){}, field=[], renderErrorMsg=function(e){}){
        DOMElement.addEventListener('click', async (e)=>{
            e.preventDefault();
            const text = DOMElement.textContent;
            try{
                if(!form.checkValidity()){
                    form.reportValidity();
                    return;
                }

                DOMElement.disabled = true;
                DOMElement.textContent = 'Procesando...';

                const formData = getFormData(form);
                
                if (type === 'add-user'){
                    const hash = await hashPassword(formData.password);
                    await Database.addUserSession(
                        formData.username, 
                        hash, 
                        formData.role
                    );

                    dialog.close();
                    dialog.remove();
                }else if (type === 'add-trainer') {
                    await Database.addTrainer(
                        formData.name, 
                        formData.ci
                    );

                    dialog.close();
                    dialog.remove();
                    renderFunc();
                }else if(type === 'delete-user'){
                    await Database.deleteUserSession(formData.username);

                    dialog.close();
                    dialog.remove();
                }else if (type === 'login'){
                    const hash = await hashPassword(formData.password);
                    const user = await Database.verifyLogin(
                        formData.username, 
                        hash
                    );
                    Database.setCurrentUser(user);
                    
                    dialog.close();
                    dialog.remove();
                    renderFunc[0]();
                    renderFunc[1]();
                }else if (type === 'add-payment'){
                    await Database.setPayment(
                        formData.userId, 
                        formData.amountPaid, 
                        formData.paymentDate
                    );

                    dialog.close();
                    dialog.remove();
                    renderFunc();
                }else if (type === 'add-client'){
                    await Database.addUser(
                        formData.name, 
                        formData.ci
                    );

                    dialog.close();
                    dialog.remove();
                    renderFunc();
                }else if (type === 'edit'){
                    if(form.edit === 'client-name'){
                        console.log(formData.userId);
                        await Database.changeUserName(
                            formData.name, 
                            formData.userId
                        );

                        dialog.close();
                        dialog.remove();
                        renderFunc();
                    }else if(form.edit === 'client-ci'){
                        await Database.changeUserCI(
                            formData.ci, 
                            formData.userId
                        );

                        dialog.close();
                        dialog.remove();
                        renderFunc();
                    }else if(form.edit === 'amount-paid'){
                        await Database.changeAmountPaid(
                            formData.amountPaid, 
                            formData.prevAmountPaid, 
                            formData.paymentId, 
                            formData.userId
                        );
                        
                        dialog.close();
                        dialog.remove();
                        renderFunc();
                    }else if(form.edit === 'payment-date'){
                        await Database.changePaymentDate(
                            formData.paymentDate, 
                            formData.paymentId, 
                            formData.userId
                        );
                        
                        dialog.close();
                        dialog.remove();
                        renderFunc();
                    }else if(form.edit === 'client-active'){
                        await Database.changeUserStatus(
                            formData.active, 
                            formData.userId
                        );
                        
                        dialog.close();
                        dialog.remove();
                        renderFunc();
                    }else if(form.edit === 'client-payment-id'){
                        await Database.changePaymentUser(
                            formData.prevUserId, 
                            formData.userId, 
                            formData.paymentDate
                        );

                        dialog.close();
                        dialog.remove();
                        renderFunc();
                    }
                }else if (type === 'delete-payment'){
                    await Database.deletePayment(
                        formData.paymentId
                    );

                    dialog.close();
                    dialog.remove();
                    renderFunc();
                }else{
                    DOMElement.disabled = false;
                    DOMElement.textContent = text;
                    return;
                }
            }catch(error){
                renderErrorMsg(error);
                DOMElement.disabled = false;
                DOMElement.textContent = text;
            }
        });
    }

    function editTableFields(DOMElement, func){
        //PC
        DOMElement.addEventListener('click', (e)=>{
            const target = e.target;
            if (e.ctrlKey === true && target.tagName === 'TD'){
                func(target);
            }else{
                return;
            }
        });

        //Mobile
        let touchTimer;

        DOMElement.addEventListener('touchstart', (e) =>{
            if (e.target.tagName === 'TD'){
                touchTimer = setTimeout(() => {
                    func(e.target);
                }, 600);
            }
        }, {passive: true});

        DOMElement.addEventListener('touchmove', () => {
            clearTimeout(touchTimer);
        });

        DOMElement.addEventListener('touchend', () => {
            clearTimeout(touchTimer);
        });

        DOMElement.addEventListener('touchcancel', () => {
            clearTimeout(touchTimer);
        });
    }

    /**
     * 
     * @param {HTMLFormElement} form - A form element
     * @returns {Object} 
     */
    function getFormData(form){
        let data = {};
        const formData = new FormData(form);
        for( let [key, value] of formData){
            data[key] = value;
        }
        console.log('Form Data:', data);
        return data;
    }

    return {
        addClickEventListener, 
        addChangeEventListener, 
        closeDialog, 
        checkForm, 
        resolveForm, 
        editTableFields,
        exportEventListener,
        importEventListener,
        restoreEventListener
    };
};