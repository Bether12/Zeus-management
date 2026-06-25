export const eventMaster = function(Data){
    const Database = Data;

    function addClickEventListener(DOMElement, fun){
        DOMElement.addEventListener('click', (e)=>{fun()});
    }

    function closeDialog(DOMElement, dialog){
        DOMElement.addEventListener('click', (e)=>{
            dialog.close();
        });
    }

    function checkAddPaymentForm(DOMElement){
        DOMElement.addEventListener('input', (e)=>{
            const target = e.target;
            if(target.id === 'amount-paid-input' && target.validity.valueMissing){
                target.setCustomValidity('El monto a pagar no puede estar vacío');
                target.reportValidity();
            } else if (target.id === 'amount-paid-input' && target.validity.stepMismatch){
                target.setCustomValidity('El monto pagado tiene que ser un múltiplo de 100');
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
                target.setCustomValidity('El nombre de usuario ha de tener al menos 3 letras');
                target.reportValidity();
            } else {
                target.setCustomValidity('');
                target.reportValidity();
            }
        });
    }

    function resolveForm(type, DOMElement, form, dialog){
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

                if  (inputs[1].value.trim().length === 0){
                    await Database.queryDatabase('set',`
                            INSERT INTO payment_records (amount_paid, user_id) 
                            VALUES ($1, $2)
                        ;`, [inputs[0].value, inputs[2].value]);
                    dialog.close();
                }else {
                    await Database.queryDatabase('set',`
                            INSERT INTO payment_records (amount_paid, payment_date, user_id) 
                            VALUES ($1, $2, $3)
                        ;`, [inputs[0].value, inputs[1].value, inputs[2].value]);
                    dialog.close();
                }
            }else if (type === 'user'){
                const input = form.querySelector('#name-input');
                await Database.queryDatabase('set', `INSERT INTO users_id(name) VALUES ($1)`, [input.value]);
                dialog.close();
            }else{
                return;
            }
        });
    }

    return {addClickEventListener, closeDialog, checkAddPaymentForm, resolveForm};
};