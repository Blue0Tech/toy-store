AFRAME.registerComponent('marker-handler',{
    init: async function() {
        this.el.addEventListener('markerFound',this.handleMarkerFound);
        this.el.addEventListener('markerLost',this.handleMarkerLost);
    },
    handleMarkerFound: function() {
        var buttonDiv = document.getElementById('button-div');
        buttonDiv.style.display = 'flex';
        var summaryButton = document.getElementById('summaryButton');
        var orderButton = document.getElementById('orderButton');
        summaryButton.addEventListener('click',()=>{
            swal({
                icon: 'warning',
                title: 'Summary of toy',
                text: 'Work in progress'
            });
        });
        orderButton.addEventListener('click',()=>{
            swal({
                icon: 'https://i.imgur.com/4NZ6uLY.jpeg',
                title: 'Thanks for ordering',
                text: 'Your order will arrive soon'
            });
        });
    },
    handleMarkerLost: function() {
        var buttonDiv = document.getElementById('button-div');
        buttonDiv.style.display = 'none';
    }
});