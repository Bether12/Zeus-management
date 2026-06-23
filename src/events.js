export const eventMaster = (function(){
    function addClickEventListener(DOMElement, fun){
        DOMElement.addEventListener('click', (e)=>{fun()});
    }

    function closeDialog(DOMElement, dialog){
        DOMElement.addEventListener('click', (e)=>{
            dialog.close();
        });
    }

    return {addClickEventListener, closeDialog};
})();