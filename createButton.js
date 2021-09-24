AFRAME.registerComponent('create-button',{
    init: function() {
        var button1 = document.createElement('button');
        button1.innerHTML = 'Order summary';
        button1.setAttribute('id','summaryButton');
        button1.setAttribute('class','btn-warning');
        var button2 = document.createElement('button');
        button2.innerHTML = 'Order Now';
        button2.setAttribute('id','orderButton');
        button2.setAttribute('class','btn-warning');
        var buttonDiv = document.getElementById('button-div');
        buttonDiv.appendChild(button1);
        buttonDiv.appendChild(button2);
    }
});