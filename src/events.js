export const eventMaster = function(Data){
    const Database = Data;

    function addClickEventListener(DOMElement, fun){
        DOMElement.addEventListener('click', (e)=>{fun()});
    }

    function closeDialog(DOMElement, dialog){
        DOMElement.addEventListener('click', (e)=>{
            dialog.close();
            dialog.remove();
        });
    }

    function checkForm(DOMElement){
        DOMElement.addEventListener('input', (e)=>{
            const target = e.target;
            if(target.id === 'amount-paid-input' && target.validity.valueMissing){
                target.setCustomValidity('El monto a pagar no puede estar vacío');
                target.reportValidity();
            } else if (target.id === 'amount-paid-input' && target.validity.stepMismatch){
                target.setCustomValidity('El monto pagado tiene que ser un múltiplo de 100');
                target.reportValidity();
            } else if(target.id === 'payment-date-input' && target.validity.valueMissing){
                target.setCustomValidity('La fecha no puede estar vacía');
                target.reportValidity();
            } else if (target.id === 'payment-date-input' && target.validity.valid === false){
                target.setCustomValidity('Formato de fecha inválido');
                target.reportValidity();
            } else if (target.id === 'user-id-input' && target.validity.valueMissing){
                target.setCustomValidity('Escriba el ID del usuario');
                target.reportValidity();
            } else if (target.id === 'user-id-input' && target.validity.stepMismatch){
                target.setCustomValidity('El ID tiene que ser un número entero positivo');
                target.reportValidity();
            } else if (target.id === 'name-input' && target.validity.valueMissing){
                target.setCustomValidity('El nombre de usuario no puede estar vacío');
                target.reportValidity();
            } else if (target.id === 'name-input' && target.validity.tooShort){
                target.setCustomValidity('El nombre de usuario ha de tener al menos 15 letras');
                target.reportValidity();
            } else {
                target.setCustomValidity('');
                target.reportValidity();
            }
        });
    }

    function resolveForm(type, DOMElement, form, dialog, renderFunc=function(){}, field=[],){
        DOMElement.addEventListener('click', async (e)=>{
            e.preventDefault();
            if(!form.checkValidity()){
                form.reportValidity();
                return;
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
                const input = form.querySelector('#name-input');
                await Database.queryDatabase('set', `INSERT INTO users_id(name) VALUES ($1)`, [input.value]);
                dialog.close();
                dialog.remove();
                renderFunc();
            }else if (type === 'edit'){
                console.log('edition func reached', field.dataset);
                if(field.dataset.name !== undefined){
                    await Database.queryDatabase('set', 
                        `UPDATE users_id SET name = $1 WHERE id = $2`, 
                        [form.querySelector('#name-input').value, field.dataset.id]);
                    dialog.close();
                    dialog.remove();
                    renderFunc();
                }else if(field.dataset.amountPaid !== undefined){
                    await Database.queryDatabase('set', 
                        `UPDATE payment_records SET amount_paid = $1 WHERE id = $3;
                        UPDATE users_id SET amount_paid = amount_paid + ($1 - $2) WHERE id = $4`, 
                        [form.querySelector('#amount-paid-input').value, field.dataset.amountPaid, field.dataset.id, field.dataset.userId]);
                    dialog.close();
                    dialog.remove();
                    renderFunc();
                }else if(field.dataset.paymentDate !== undefined){
                    //TODO
                    dialog.close();
                    dialog.remove();
                    renderFunc();
                }else if(field.dataset.active !== undefined){
                    await Database.queryDatabase('set', 
                        `UPDATE users_id SET active = $1 WHERE id = $2`, 
                        [form.querySelector('#active-input').value, field.dataset.id]);
                    dialog.close();
                    dialog.remove();
                    renderFunc();
                }else if(field.dataset.userId !== undefined){
                    //TODO
                    dialog.close();
                    dialog.remove();
                    renderFunc();
                }
            }else{
                return;
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

    return {addClickEventListener, closeDialog, checkForm, resolveForm, editTableFields};
};