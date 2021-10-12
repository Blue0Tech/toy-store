var currentUser = null;
AFRAME.registerComponent('marker-handler',{
    init: async function() {
        if(currentUser==null) {
            this.askCurrentUser();
        }
        var toys = await this.getToys();
        var markerId = this.el.id;
        this.el.addEventListener('markerFound',()=>{
            if(currentUser) {
                this.handleMarkerFound(toys,markerId);
            }
        });
        this.el.addEventListener('markerLost',this.handleMarkerLost);
    },
    askCurrentUser: function() {
        var iconUrl = "https://img.icons8.com/material-outlined/50/000000/user--v1.png";
        swal({
            title: 'Welcome to our toy store!',
            icon: iconUrl,
            content: {
                element: 'input',
                attributes: {
                    placeholder: 'Please enter your user id',
                    type: 'number',
                    min: 1
                }
            },
            closeOnClickOutside: false
        }).then((inputValue)=>{
            currentUser = inputValue;
        });
    },
    getToys: async function() {
        return await firebase.firestore().collection('toys').get().then(snapshot=>{
            return snapshot.docs.map(doc=>doc.data());
        }).catch(error=>{
            console.log(error);
        });
    },
    handleMarkerFound: function(toys,markerId) {
        var toy = toys.filter(toy=>toy.id===markerId)[0];
        if(toy.isOutOfStock) {
            swal({
                icon: 'warning',
                title: toy.toyName.toUpperCase(),
                text: 'This toy is out of stock',
                timer: 2500,
                buttons: false
            });
        } else {
            var model = document.querySelector(`#model-${toy.id}`);
            model.setAttribute('position',toy.modelGeometry.position);
            model.setAttribute('rotation',toy.modelGeometry.rotation);
            model.setAttribute('scale',toy.modelGeometry.scale);
            model.setAttribute('visible',true);
            var mainPlane = document.querySelector(`#main-plane-${toy.id}`);
            mainPlane.setAttribute('visible',true);
            var pricePlane = document.querySelector(`#price-plane-${toy.id}`);
            pricePlane.setAttribute('visible',true);
            var buttonDiv = document.getElementById('button-div');
            buttonDiv.style.display = 'flex';
            var summaryButton = document.getElementById('summaryButton');
            var orderButton = document.getElementById('orderButton');
            summaryButton.addEventListener('click',()=>{
                swal({
                    icon: 'warning',
                    title: 'Summary of toy',
                    text: toy.description
                });
            });
            orderButton.addEventListener('click',()=>{
                var user;
                currentUser<=9?user='0'+currentUser.toString():user=currentUser.toString();
                this.handleOrder(user,toy);
                swal({
                    icon: 'https://i.imgur.com/4NZ6uLY.jpeg',
                    title: 'Thanks for ordering',
                    text: 'Your order will arrive soon'
                });
            });
        }
    },
    handleMarkerLost: function() {
        var buttonDiv = document.getElementById('button-div');
        buttonDiv.style.display = 'none';
    },
    handleOrder: function(currentUser,toy) {
        firebase.firestore().collection('users').doc(`U${currentUser}`).get().then((doc)=>{
            var data = doc.data();
            if(data['currentOrder'][toy.id]) {
                data['currentOrder'][toy.id]['quantity']+=1;
                var currentQuantity = data['currentOrder'][toy.id]['quantity'];
                data['currentOrder'][toy.id]['subtotal'] = currentQuantity*toy.price;
            } else {
                data['currentOrder'][toy.id] = {
                    item: toy.toyName,
                    price: toy.price,
                    quantity: 1,
                    subtotal: toy.price*1
                };
            };
            data.totalBill += toy.price;
            firebase.firestore().collection('users').doc(doc.id).update(data);
        });
    }
});