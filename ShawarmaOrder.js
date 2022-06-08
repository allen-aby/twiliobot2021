const Order = require("./Order");
const Shawarma = 5,Pizza = 3,ChickenWings = 4, Large = 3,Medium = 2, Small = 1;

const OrderState = Object.freeze({
    WELCOMING:   Symbol("welcoming"),
    SELECT: Symbol("select"),
    ADMIN: Symbol("admin"),
    SIZE:   Symbol("size"),
    TOPPINGS:   Symbol("toppings"),
    DRINKS:  Symbol("drinks"),
    PAYMENT: Symbol("payment"),
    ANYTHING: Symbol("anything")
});

let OrderList = [];

module.exports = class ShwarmaOrder extends Order{
    constructor(sNumber, sUrl){
        super(sNumber, sUrl);
        this.stateCur = OrderState.WELCOMING;
        this.sSize = "";
        this.sToppings = "";
        this.sDrinks = "";
        this.sAnythingElse = "";
        this.sItem = "";
    }
    Total=1;
    handleInput(sInput){
        let aReturn = [""];
        
        switch(this.stateCur){
            case OrderState.WELCOMING:
                this.Total = 1;
                this.stateCur = OrderState.SELECT;
                if(sInput.toLowerCase() == "adminportal"){
                    this.stateCur = OrderState.ADMIN;
                }
                aReturn.push("Welcome to Richard's Bistro.");
                aReturn.push("What would you like to eat?");
                aReturn.push("1. Shawarma\n2. Pizza\n3. Chicking Wings\nPlease enter the number:\n");
                break;
            case OrderState.ADMIN:
                this.stateCur = OrderState.WELCOMING;
                aReturn.push("Orders");
                OrderList.forEach(element => {
                    aReturn.push(element);
                });
                break;
            case OrderState.SELECT:
                if (sInput=="1")
                {
                    this.sItem="Shawarma";
                    this.Total = this.Total * Shawarma;
                }
                else if (sInput=="2")
                {
                    this.sItem="Pizza";
                    this.Total = this.Total * Pizza;
                }
                else if (sInput=="3")
                {
                    this.sItem="Chicken Wings";
                    this.Total = this.Total * ChickenWings;
                }
                else{
                    aReturn.push("Invalid Option");
                    aReturn.push("1. Shawarma\n2. Pizza\n3. Chicking Wings\nPlease enter the number:\n");
                    this.stateCur = OrderState.SELECT;
                    this.Total = 0;
                }
                this.stateCur = OrderState.SIZE;
                aReturn.push("What size would you like?");
                aReturn.push("1. Large\n2. Medium\n3. Small\nPlease enter the number:\n");
                break;
            case OrderState.SIZE:
                if (sInput=="1")
                {
                    this.sSize = "Large";
                    this.Total = this.Total * Large;
                }
                else if (sInput=="2")
                {
                    this.sSize = "Medium";
                    this.Total = this.Total * Medium;
                }
                else if (sInput=="3")
                {
                    this.sSize = "Small";
                    this.Total = this.Total * Shawarma;
                }
                else{
                    aReturn.push("Invalid Option");
                    this.Total = 0;
                }
                this.stateCur = OrderState.TOPPINGS
                aReturn.push("What toppings would you like?\n (Tomatoes,Mushrooms,Jalapenos,Feta Cheese,Bacon,Chicken,Ground Beef,Sausage)");
                break;
            case OrderState.TOPPINGS:
                this.stateCur = OrderState.DRINKS;
                this.sToppings = sInput;
                aReturn.push("Would you like drinks with that?\n(Enter Soda Name or No)");
                break;
            case OrderState.DRINKS:
                if(sInput.toLowerCase() != "no"){
                    this.sDrinks = sInput;
                    this.Total+=2;
                }
                this.stateCur = OrderState.ANYTHING;
                aReturn.push("Would you like anything else with that? (Fries / Onion Rings / Curry)");
                break;
            case OrderState.ANYTHING:
                this.isDone(true);
                this.stateCur = OrderState.PAYMENT;
                if(sInput.toLowerCase() != "no"){
                    this.sAnythingElse = sInput;
                    this.Total+=5;
                }
                var myOrder = "";
                aReturn.push(`Thank-you for your order of: \n1. ${this.sSize} ${this.sItem} with ${this.sToppings}`);
                myOrder+=`1.${this.sSize} ${this.sItem} with ${this.sToppings}`;
                if(this.sDrinks){
                    aReturn.push("2. Soda: "+this.sDrinks);
                    myOrder+="\n2. Soda: "+this.sDrinks;
                }
                if(this.sAnythingElse){
                    myOrder+="\n3. Extra Items: "+this.sDrinks;
                    aReturn.push("3. "+this.sAnythingElse);
                }
                OrderList.push(myOrder); 
                aReturn.push("Your total amount is $"+this.Total);
                aReturn.push(`Please pay for your order here`);
                aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);
                break;
            case OrderState.PAYMENT:
                console.log(sInput);
                this.isDone(true);
                let d = new Date();
                d.setMinutes(d.getMinutes() + 20);
                aReturn.push(`Your order will be delivered at ${d.toTimeString()}`);
                break;
        }
        return aReturn;
    }
    renderForm(sTitle = "-1", sAmount = "-1"){
      // your client id should be kept private
      if(sTitle != "-1"){
        this.sItem = sTitle;
      }
      if(sAmount != "-1"){
        this.nOrder = sAmount;
      }
      const sClientID = process.env.SB_CLIENT_ID || 'put your client id here for testing ... Make sure that you delete it before committing'
      return(`
      <!DOCTYPE html>
  
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- Ensures optimal rendering on mobile devices. -->
        <meta http-equiv="X-UA-Compatible" content="IE=edge" /> <!-- Optimal Internet Explorer compatibility -->
      </head>
      
      <body>
        <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
        <script
          src="https://www.paypal.com/sdk/js?client-id=${sClientID}"> // Required. Replace SB_CLIENT_ID with your sandbox client ID.
        </script>
        Thank you ${this.sNumber} for your ${this.sItem} order of $${this.nOrder}.
        <div id="paypal-button-container"></div>
  
        <script>
          paypal.Buttons({
              createOrder: function(data, actions) {
                // This function sets up the details of the transaction, including the amount and line item details.
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: '${this.nOrder}'
                    }
                  }]
                });
              },
              onApprove: function(data, actions) {
                // This function captures the funds from the transaction.
                return actions.order.capture().then(function(details) {
                  // This function shows a transaction success message to your buyer.
                  $.post(".", details, ()=>{
                    window.open("", "_self");
                    window.close(); 
                  });
                });
              }
          
            }).render('#paypal-button-container');
          // This function displays Smart Payment Buttons on your web page.
        </script>
      
      </body>
          
      `);
  
    }
}