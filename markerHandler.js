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
        var paymentButton = document.getElementById('pay-button');
        paymentButton.addEventListener('click',()=>{
            this.handlePayment();
        });
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
            var ratingButton = document.getElementById('ratingButton');
            var orderButton = document.getElementById('orderButton');
            var orderSummaryButton = document.getElementById('orderSummaryButton');
            // summaryButton.addEventListener('click',()=>{
            //     swal({
            //         icon: 'warning',
            //         title: 'Summary of toy',
            //         text: toy.description
            //     });
            // });
            ratingButton.addEventListener('click',()=>{
                this.handleRating(toy);
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
            orderSummaryButton.addEventListener('click',()=>{
                this.handleOrderSummary();
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
    },
    getOrderSummary: async function(currentUser) {
        return await firebase.firestore().collection('users').doc(`U${currentUser}`).get().then((doc)=>doc.data());
    },
    handleOrderSummary: async function() {
        var user;
        currentUser<=9?user='0'+currentUser.toString():user=currentUser.toString();
        var orderSummary = this.getOrderSummary(user);
        var modalDiv = document.getElementById('modal-div');
        modalDiv.style.display = 'flex';
        var billTableBody = document.getElementById('bill-table-body');
        billTableBody.innerHTML = '';
        var currentOrder = Object.keys(orderSummary.currentOrder);
        currentOrder.map(i=>{
            var tr = document.createElement('tr');
            var item = document.createElement('td');
            var price = document.createElement('td');
            var quantity = document.createElement('td');
            var subtotal = document.createElement('td');
            item.innerHTML = orderSummary.currentOrder[i].item;
            price.innerHTML = `$${(orderSummary.currentOrder[i].price).toFixed(2)}`;
            price.setAttribute('class','text-center');
            quantity.innerHTML = orderSummary.currentOrder[i].quantity;
            quantity.setAttribute('class','text-center');
            subtotal.innerHTML = `$${(orderSummary.currentOrder[i].subtotal).toFixed(2)}`;
            subtotal.setAttribute('class','text-center');
            tr.appendChild(item);
            tr.appendChild(price);
            tr.appendChild(quantity);
            tr.appendChild(subtotal);
            billTableBody.appendChild(tr);
        });
    },
    handlePayment: function() {
        firebase.firestore().collection('users').doc(`U${currentUser}`).get().then((doc)=>{
            var data = doc.data();
            data.currentOrder = {};
            data.id = "";
            data.totalBill = 0;
            firebase.firestore().collection('users').doc(doc.id).update(data);
        });
    },
    handleRating: async function(toy) {
        var user;
        currentUser<=9?user='0'+currentUser.toString():user=currentUser.toString();
        var orderSummary = await this.getOrderSummary(user);
        var currentOrder = Object.keys(orderSummary.currentOrder);
        if(currentOrder.length>0 && currentOrder == toy.id) {
            document.getElementById('rating-modal-div').style.display = 'flex';
            document.getElementById('rating-input').value = '0';
            document.getElementById('feedback-input').value = '';
            var saveRating = document.getElementById('save-rating-button');
            saveRating.addEventListener('click',()=>{
                document.getElementById('rating-modal-div').style.display = 'none';
                var rating = document.getElementById('rating-input').value;
                var feedback = document.getElementById('feedback-input').value;
                var id = parseInt(toy.id.slice(toy.id.length-1,toy.id.length));
                // var docId = '';
                // id<=9?docId='0'+id.toString():docId=id.toString();
                firebase.firestore().collection('toys').doc(`toy${id}`).update({
                    lastReview: feedback,
                    lastRating: rating
                }).then(()=>{
                    swal({
                        icon: 'success',
                        title: 'Thanks for rating!',
                        text: 'We hope you enjoyed your toy!',
                        timer: 2500,
                        buttons: false
                    });
                });
            });
        } else {
            swal({
                icon: 'warning',
                title: 'Oops',
                text: 'No toy found to give rating.',
                timer: 2500,
                buttons: false
            });
        }
    }
});