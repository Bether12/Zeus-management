import { Database } from "./db.js";

export const eventMaster = (function(){
    function clickEvent(DOMElement, func){
        DOMElement.addEventListener('click', ()=>{
            func();
        });
    }

    async function addEntry(DOMElement, formToValidate, dialogToClose, userIdInput, amountPaidInput, paymentDateInput){
        DOMElement.addEventListener('click', async function(e){
            console.log('event fired!');
            if (userIdInput.validity.stepMismatch || userIdInput.validity.rangeUnderflow || userIdInput.validity.badInput || userIdInput.validity.valueMissing){
                userIdInput.setCustomValidity('Ingrese un número de identificación correcto mayor o igual a 1');
                userIdInput.reportValidity();
                return;
            } else if (amountPaidInput.validity.stepMismatch || amountPaidInput.validity.rangeUnderflow || amountPaidInput.validity.badInput || amountPaidInput.validity.valueMissing){
                amountPaidInput.setCustomValidity('Ingrese una cantidad de dinero mayor o igual a 100 pesos');
                amountPaidInput.reportValidity();
                return;
            } else {
                try {
                    await Database.queryDatabase(`INSERT INTO payment_record (user_id, amount_paid) VALUES ($1, $2)`,[userIdInput, amountPaidInput]);
                } catch (error) {
                   console.log('Error:', error); 
                }
            }
        });
    }

    return { clickEvent, addEntry };
})();