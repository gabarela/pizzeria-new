import {
  Product
} from './components/Product.js';
import {
  Cart
} from './components/Cart.js';
import {
  select,
  settings
} from './settings.js';

const app = {
  initMenu: function() {
    const thisApp = this;
    //console.log('thisApp.data:', thisApp.data);

    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },
  initCart: function() {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function(event) {
      app.cart.add(event.detail.product);
    });
  },

  initData: function() {
    const thisApp = this;
    thisApp.data = {};

    const url = settings.db.url + '/' + settings.db.product; // w stałej zapisany adres endpointa

    fetch(url) // wysyłamy zapytanie do serwera pod podany adres endpointu
      .then(function(rawResponse) {
        return rawResponse.json(); // odpowiedż z serwera
      })
      .then(function(parsedResponse) { // otrzymaną odpowiedż konwertujemy z JSON na tablicę // kod w tej f wykona sie dopiero jak otrzyma odp z serwera
        console.log('parsedResponse', parsedResponse);

        /* save parsedResponse as thisApp.data.products */
        thisApp.data.products = parsedResponse;

        /* execute initMenu method */
        thisApp.initMenu();
      });

    console.log('thisApp.data', JSON.stringify(thisApp.data));
  },

  init: function() {
    const thisApp = this;
    //console.log('*** App starting ***');
    //console.log('thisApp:', thisApp);
    //console.log('classNames:', classNames);
    //console.log('settings:', settings);
    //console.log('templates:', templates);

    thisApp.initData();
    // wywołanie f initMenu przenosimy na górę do f (parsedResponse) która wykonuje się dopiero po otrzymaniu odp z serwera // czyli wykona sie gdy skrpt otrzyma już liste produktów
    thisApp.initCart();
  },
};

app.init();
