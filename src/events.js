export const eventMaster = function(Data){
    const Database = Data;

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
    }

    function checkForm(DOMElement){
        DOMElement.addEventListener('input', (e) => {
            e.target.setCustomValidity('');
        });

        DOMElement.addEventListener('focusout', (e) => {
            validateField(e.target);
        });
    }

    function validateField(target){
        if (target.id === 'amount-paid-input'){
            if (target.validity.valueMissing){
                target.setCustomValidity('El monto a pagar no puede estar vacío');
            } else if (target.validity.stepMismatch || Number(target.value) <= 0){
                target.setCustomValidity('El monto pagado tiene que ser un múltiplo positivo de 100');
            }
        } else if (target.id === 'payment-date-input'){
            if (target.validity.valueMissing){
                target.setCustomValidity('La fecha no puede estar vacía');
            } else if (target.validity.valid === false){
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
        } else if (target.id === 'date-input'){
            if (target.validity.rangeOverflow){
                target.setCustomValidity('La fecha seleccionada no puede ser mayor que la fecha actual');
            } else if (target.validity.valueMissing){
                target.setCustomValidity('La fecha no puede estar vacía');
            }
        }else if (target.id === 'user-password-input'){
            if(target.validity.valueMissing){
                target.setCustomValidity('La contraseña no puede estar vacía');
            }
        }

        if(!target.checkValidity()){
            target.reportValidity();
        }
    }

    function resolveForm(type, DOMElement, form, dialog, renderFunc=function(){}, field=[], renderErrorMsg=function(e){}){
        DOMElement.addEventListener('click', async (e)=>{
            e.preventDefault();
            try{
                if(!form.checkValidity()){
                    form.reportValidity();
                    return;
                }else if (type === 'login'){
                    const inputs = [
                        form.querySelector('#user-name-input'),
                        form.querySelector('#user-password-input')
                    ];
                    
                    const hash = await hashPassword(inputs[1].value);
                    
                    const user = await Database.verifyLogin(inputs[0].value, hash);
                    
                    Database.setCurrentUser(user);
                    
                    dialog.close();
                    dialog.remove();
                    renderFunc[0]();
                    renderFunc[1]();
                }else if (type === 'payment'){
                    const inputs = [
                        form.querySelector('#amount-paid-input'),
                        form.querySelector('#payment-date-input'),
                        form.querySelector('#user-id-input')
                    ];
                    await Database.setPayment(inputs[2].value, inputs[0].value, inputs[1].value);
                    dialog.close();
                    dialog.remove();
                    renderFunc();
                }else if (type === 'user'){
                    const inputs = [
                        form.querySelector('#name-input'),
                        form.querySelector('#ci-input')
                    ];
                    await Database.addUser(inputs[0].value, inputs[1].value);
                    dialog.close();
                    dialog.remove();
                    renderFunc();
                }else if (type === 'edit'){
                    if(field.dataset.name !== undefined){
                        await Database.changeUserName(form.querySelector('#name-input').value, field.dataset.id);
                        dialog.close();
                        dialog.remove();
                        renderFunc();
                    }else if(field.dataset.ci !== undefined){
                        await Database.changeUserCI(form.querySelector('#ci-input').value, field.dataset.id);
                        dialog.close();
                        dialog.remove();
                        renderFunc();
                    }else if(field.dataset.amountPaid !== undefined){
                        await Database.changeAmountPaid(form.querySelector('#amount-paid-input').value, field.dataset.amountPaid, field.dataset.id, field.dataset.userId);
                        dialog.close();
                        dialog.remove();
                        renderFunc();
                    }else if(field.dataset.paymentDate !== undefined){
                        await Database.changePaymentDate(form.querySelector('#payment-date-input').value, field.dataset.id, field.dataset.userId);
                        dialog.close();
                        dialog.remove();
                        renderFunc();
                    }else if(field.dataset.active !== undefined){
                        await Database.changeUserStatus(form.querySelector('#active-input').value, field.dataset.id);
                        dialog.close();
                        dialog.remove();
                        renderFunc();
                    }else if(field.dataset.userId !== undefined){
                        await Database.changePaymentUser(field.dataset.userId, form.querySelector('#user-id-input').value, field.dataset.id);
                        dialog.close();
                        dialog.remove();
                        renderFunc();
                    }
                }else if (type === 'delete'){
                    await Database.deletePayment(form.querySelector('#payment-id-input').value);
                    dialog.close();
                    dialog.remove();
                    renderFunc();
                }else{
                    return;
                }
            }catch(error){
                renderErrorMsg(error);
            }
        });
    }

    function editTableFields(DOMElement, func){
        DOMElement.addEventListener('click', (e)=>{
            const target = e.target;
            if (e.ctrlKey === true && target.tagName === 'TD'){
                func(target);
            }else{
                return;
            }
        });
    }

    return {addClickEventListener, addChangeEventListener, closeDialog, checkForm, resolveForm, editTableFields};
};