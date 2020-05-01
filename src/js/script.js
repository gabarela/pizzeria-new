/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: '.cart__total-number', 
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data; // data to są wszystkie właściwości produktu - gdzie w kodzie, w którym pliku znajduje się informacja ze ten obiekt data to dokładnie dataSource.products z data.js???

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      console.log('new Product:', thisProduct);
    }

    renderInMenu() { // odpowiada za wyświetlanie produktów w menu
      const thisProduct = this;

      /* generate HTML based on template */ // generuje kod produktu
      const generatedHTML = templates.menuProduct(thisProduct.data);

      /*create elment using utils.createElementFromHTML */ // elem DOM czyli obiekt wygenerowany przez przeglądarkę na podstawie kodu HTML
      thisProduct.element = utils.createDOMFromHTML(generatedHTML); // element DOM zapisany jest jako właściwość instancji by był do niego dostap w innych w innych metodach

      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);

      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }

    // dlaczego w renderInMenu nie ma pętli jakiejś która by szła przez wszystkie skoro generuje to wszystkie produkty???
    // odp na powyższe: renderInMenu jest uruchamia w konstruktorze klasy, to przy tworzeniu każdej nowej instancji dla danego produktu, od razu renderuje się on na stronie.

    getElements() { // odniesienia do poszczególnych elementów DOM stworzonych na podstawie szablonu handlebars; metoda która w jednym miejscu odnajduje poszczególne elementy w kontenerze produktu
      const thisProduct = this; // czyli te wszystkie lementy powstały dzieki zastosowaniu handlebara w renderInMenu linia 100???

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion() { // odpowaiada za wyswietlanie pełnych opcji produktu po kliknięciu; nadaje i odbiera klasę active
      const thisProduct = this;

      /* find the clickable trigger (the element that should react to clicking) */ // przeniesiony do f getElement
      // const accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);

      /* START: click event listener to trigger */
      thisProduct.accordionTrigger.addEventListener('click', function() {

        /* prevent default action for event */
        event.preventDefault();

        /* toggle active class on element of thisProduct */
        thisProduct.element.classList.toggle('active'); // thisProduct.element to element bieżącego produktu czyli tego który wybieramy

        /* find all active products */
        const activeProducts = document.querySelectorAll('article.active');

        /* START LOOP: for each active product */
        for (let activeProduct of activeProducts) {
          /* START: if the active product isn't the element of thisProduct */
          if (activeProduct != thisProduct.element) {
            /* remove class active for the active product */
            activeProduct.classList.remove('active');
            /* END: if the active product isn't the element of thisProduct */
          }
          /* END LOOP: for each active product */
        }
        /* END: click event listener to trigger */
      });
    }

    initOrderForm() { // uruchamiana raz dla każdego produktu; odpowiedzialna za dodanie listenerów eventu do formularza, kontrolek, guzika dodania do koszyka; gdy będą kliknięte wywoła f przelicz zamówienie na nowo
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function() {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });

    }

    processOrder() {
      const thisProduct = this;
      //console.log('processOrder');

      /* read all data from the form (using utils.serializeFormToObject) and save it to const formData */ // ta f serialize pokazuje które opcje są wybrane
      const formData = utils.serializeFormToObject(thisProduct.form);
      //console.log('formData', formData);

      thisProduct.params = {};

      /* set variable price to equal thisProduct.data.price */
      let price = thisProduct.data.price;

      /* START LOOP: for each paramId in thisProduct.data.params */
      for (let paramId in thisProduct.data.params) {

        /* save the element in thisProduct.data.params with key paramId as const param */
        const param = thisProduct.data.params[paramId];

        /* START LOOP: for each optionId in param.options */
        for (let optionId in param.options) {

          /* save the element in param.options with key optionId as const option */
          const option = param.options[optionId];

          const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;
          // czy istnieje formData[paramId] jeśli tak to wykona się dalszy kod (po &&) czy ta tablica zawiera klucz równy wartości optionId

          /* START IF: if option is selected and option is not default */
          if (optionSelected && !option.default) {

            /* add price of option to variable price */
            price += option.price;

            /* END IF: if option is selected and option is not default */
            /* START ELSE IF: if option is not selected and option is default */
          } else if (!optionSelected && option.default) {

            /* deduct price of option from price */
            price -= option.price;

          }
          /* END ELSE IF: if option is not selected and option is default */
          // blok if/else - obrazki
          const optionImages = thisProduct.imageWrapper.querySelectorAll('.' + paramId + '-' + optionId);

          if (optionSelected) {
            if (!thisProduct.params[paramId]) { // jeśli parametr nie został dodany do parametrów
              thisProduct.params[paramId] = {
                label: param.label,
                options: {},
              };
            }
            thisProduct.params[paramId].options[optionId] = option.label; // do obiektu options dodajemy zaznaczoną opcję - klucz option, wartosc label

            for (let image of optionImages) {
              image.classList.add(classNames.menuProduct.imageVisible);
            }
          } else {
            for (let image of optionImages) {
              image.classList.remove(classNames.menuProduct.imageVisible);
            }
          }

        }
      } /* END LOOP: for each optionId in param.options */

      /* END LOOP: for each paramId in thisProduct.data.params */
      /* multiply price by amount */
      thisProduct.priceSingle = price;
      thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;

      /* set the contents of thisProduct.priceElem to be the value of variable price */
      thisProduct.priceElem.innerHTML = thisProduct.price;

      //console.log('thisProduct.params', thisProduct.params);
    } // zamknięcie processOrder

    initAmountWidget() {
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

      thisProduct.amountWidgetElem.addEventListener('updated', function() {
        thisProduct.processOrder();
      });
    }

    addToCart() {
      const thisProduct = this;

      thisProduct.name = thisProduct.data.name;
      thisProduct.amount = thisProduct.amountWidget.value;

      app.cart.add(thisProduct);
    }

  } // ten nawias powinien zamykać klasę Product

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.value = settings.amountWidget.defaultValue;
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();

      //console.log('AmountWidget:', thisWidget);
      //console.log('constructor arguments:', element);
    }

    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value) {
      const thisWidget = this;

      const newValue = parseInt(value);

      /* validation */
      if (newValue != thisWidget.value && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {

        thisWidget.value = newValue;
        thisWidget.announce();
      }

      thisWidget.input.value = thisWidget.value; // CZEMU TO NIE MOZE BYC ZAPISANE NARAZ z tym w 307?
    }

    initActions() {

      const thisWidget = this;

      thisWidget.input.addEventListener('change', function() {
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function(event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function(event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });

    }

    announce() {
      const thisWidget = this;

      const event = new CustomEvent('updated', {
        bubbles: true // dzieki właściwości bubles którą włączyliśmy po wykonaniu eventu na jakimś elemencie będzie on przekazywany rodzicowi i rodzicowi rodzica aż do body, document i window
      });
      thisWidget.element.dispatchEvent(event);
    }

  } // zamkniecie klasy AmountWidget

  class Cart {
    constructor(element) {
      const thisCart = this;

      thisCart.products = [];

      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;

      thisCart.getElements(element);
      thisCart.initActions();


      //console.log('new Cart', thisCart);
    }

    getElements(element) {
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;

      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger); // ?

      thisCart.dom.productList = document.querySelector(select.cart.productList); // ? z tym miałam problem

      thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee']; // Tworzymy tutaj tablicę, która zawiera cztery stringi (ciągi znaków). Każdy z nich jest kluczem w obiekcie select.cart

      for (let key of thisCart.renderTotalsKeys) { //  Wykorzystamy tę tablicę, aby szybko stworzyć cztery właściwości obiektu thisCart.dom o tych samych kluczach. Każda z nich będzie zawierać kolekcję elementów znalezionych za pomocą odpowiedniego selektora.
        thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
      }

      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);

      thisCart.dom.phone = document.querySelector(select.cart.phone);
      thisCart.dom.address = document.querySelector(select.cart.address);
    }

    initActions() {
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function() {
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener('updated', function() {
        thisCart.update();
      });

      thisCart.dom.productList.addEventListener('remove', function() {
        thisCart.remove(event.detail.cartProduct);
      });

      thisCart.dom.form.addEventListener('submit', function() {
        event.preventDefault();
        thisCart.sendOrder();
      });
    }

    add(menuProduct) {
      const thisCart = this;

      const generatedHTML = templates.cartProduct(menuProduct);

      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      thisCart.dom.productList.appendChild(generatedDOM);

      //console.log('adding product', menuProduct);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      //console.log('thisCart.products', thisCart.products);

      thisCart.update();
    }

    update() {
      const thisCart = this;

      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;

      for (let thisCartProduct of thisCart.products) {
        thisCart.subtotalPrice = thisCart.subtotalPrice + thisCartProduct.price;
        thisCart.totalNumber = thisCart.totalNumber + thisCartProduct.amount;

      }

      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;

      for (let key of thisCart.renderTotalsKeys) {
        for (let elem of thisCart.dom[key]) {
          elem.innerHTML = thisCart[key]; // dla każdego z elementów ustawiamy właściwość która ma taki sam klucz
        }
      }

    }

    remove(cartProduct) {
      const thisCart = this;

      const index = thisCart.products.indexOf(cartProduct);

      thisCart.products.splice(index, 1); // usuwamy element o tym indeksie z tablicy thisCart.products

      cartProduct.dom.wrapper.remove();

      thisCart.update();
    }

    sendOrder() {
      const thisCart = this;

      const url = settings.db.url + '/' + settings.db.order; // adres endpointu zamówienia

      const payload = { // ładunek - dane wysyłane do serwera
        phone: thisCart.dom.phone,
        address: thisCart.dom.address,
        totalPrice: thisCart.totalPrice,
        totalNumber: thisCart.totalNumber,
        subtotalPrice: thisCart.subtotalPrice,
        deliveryFee: thisCart.deliveryFee,
        products: [], // pusta tablica
      };

      for (let singleProduct of thisCart.products) {
        singleProduct.getData();
        console.log(singleProduct);

        payload.products.push(singleProduct); // zwrucony wnika dodany do tablicy payload.products
        console.log(payload.products);

      }

      const options = { // opcje które skonfigurują zapytanie
        method: 'POST', // zmiana domyślnej metody GEt na POST czyli wysylanie
        headers: { // zmiana nagłówka by serwer wiedział że wysyłamy dane w frmacie json
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // body czyli treść kt wysyłamy // metoda JSON.stringify kt konwertuje obiekt payload na ciąg znaków w formacie json
      };

      fetch(url, options)
        .then(function(response) {
          return response.json();
        }).then(function(parsedResponse) {
          console.log('parsedResponse', parsedResponse);
        });
    }

  } // zamkniecie Cart

  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.params = JSON.parse(JSON.stringify(menuProduct.params));

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();

      //console.log('new CartProduct', thisCartProduct);
      //console.log('productData', menuProduct);
    }

    getElements(element) {
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initAmountWidget() {
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);

      thisCartProduct.dom.amountWidget.addEventListener('updated', function() {

        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;

        thisCartProduct.dom.price.innerHTML = thisCartProduct.price; // wyświetlenie ceny w koszyku
      });
    }

    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initActions() {

      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event) {
        event.preventDefault();
      });


      thisCartProduct.dom.remove.addEventListener('click', function(event) {
        event.preventDefault();
        thisCartProduct.remove();
      });
    }

    getData() {
      const thisCartProduct = this;

      const productData = {
        id: thisCartProduct.id,
        amount: thisCartProduct.amount,
        price: thisCartProduct.price,
        priceSingle: thisCartProduct.priceSingle,
        params: thisCartProduct.params,
      };

      return productData;
    }

  } // zamknięcie CartProduct

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
}
