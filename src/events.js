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
            } else if (target.id === 'payment-date-input' && target.validity.valid){
                //TODO: needs fixing because it causes english validity messages appear
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

    function resolveForm(type, DOMElement, form, dialog, renderFunc=function(){}){
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
                const fields = {

                };
            } else{
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