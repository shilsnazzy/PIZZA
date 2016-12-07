/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
http://docs.botframework.com/builder/node/guides/understanding-natural-language/
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var lib = require("./lib.js");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

// gloabl pizza object to store order
var pizza = null;

// flag to identify redirection for profile menu option
var isFromProfile = false;

// flag to manage confirmation dialog flow
var isInConfirmationDialog = false;

// flag to manage welsome dialog flow
var isInWelcomeDialog = false;

//
var isFromCancelDialog = false;


var bot = new builder.UniversalBot(connector);

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'api.projectoxford.ai';

const LuisModelUrl = 'https://api.projectoxford.ai/luis/v2.0/apps/476cdbb7-2a92-4082-b89e-7a956236b047?subscription-key=274a03130a9141a3b10eba6a0b617cd6&verbose=true&q=';

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var dialog= new builder.IntentDialog({ recognizers: [recognizer] });
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
/*dialog.matches('None', (session, args) => {
    session.send('Hi! This is the None intent handler. You said: \'%s\'.', session.message.text);
session.send(JSON.stringify(session));
session.send(args)
});*/

// Add intent handlers
dialog.matches('Greeting', [

    function(session) {
        // if user is redirected from profile menu
        if (isFromProfile) {
            builder.Prompts.text(session, "Ok " + session.userData.userName + ". Enter your new user name.");
            session.userData.userName = "";
        }
        // user name is not set
        else if (!session.userData.userName || session.userData.userName == "" || session.userData.userName == undefined) {
            // user is visiting first time, ask user his name
            builder.Prompts.text(session, "Hello, what is your name?");
        } else {
            // user has visited earlier, begin welcome dialog
            session.replaceDialog('/Welcome');
        }
    },
    //save user name to json file and set dialog data
    function(session, results) {
        // store user name in user profile
        session.userData.userName = results.response;
        // rest flag
        isFromProfile = false;
        // begin welcome dialog
        session.replaceDialog('/Welcome');
    }
]);

// welcome the user and introduce the bot
bot.dialog('/Welcome', [

    function(session) {
        if(isFromCancelDialog && !isInWelcomeDialog){
            // user has cancelled some dialog
            // show appropriate message
            builder.Prompts.text(session, "Your order has been cancelled. Please type menu or profile for options.");
            isFromCancelDialog = false;
        }
        else if (!isInWelcomeDialog) {
            // welcome user and introduce bot
            var prompt = "Hello " + session.userData.userName + ", I am a pizza bot. I can help you place your order.\n\nPlease type menu or profile for options.";
            builder.Prompts.text(session, prompt);
        } else if (isInWelcomeDialog) {
            builder.Prompts.text(session, "Hey I didn\'t catch that, Please type menu or profile for options.");
            isInWelcomeDialog = false;
        }
    },
    function(session, results) {
        if (results.response.toUpperCase() == "MENU") {
            session.beginDialog('/Menu');
        } else if (results.response.toUpperCase() == "PROFILE") {
            // set flag, that user is redirected from profile menu
            isFromProfile = true;
            session.replaceDialog('/Profile');
        } else {
            isInWelcomeDialog = true;
            session.replaceDialog("/Welcome");
        }
    }
]);

// Display menu to user
bot.dialog('/Menu', [

    function(session) {
        session.send("Toppings: Beef, Bacon, Cheese, Olives, Chicken, Jalapeno, Mushroom, Onions, Pepperoni, Peppers, Pineapple, Tomatoes.\n\nSauce: Alfredo, Marinara, Traditional.\n\nCrust: Thin, Pan, Regular.\n\nNow, build your own pizza.");
        session.replaceDialog('/');
    }
]);

// user profile dialog
bot.dialog('/Profile', [

    function(session) {
        // if user is redirected from profile menu
        if (isFromProfile) {
            builder.Prompts.text(session, "Your current user name is " + session.userData.userName + "\n\nEnter your new user name.");
            session.userData.userName = "";
        }
        // user name is not set
        else if (!session.userData.userName || session.userData.userName == "" || session.userData.userName == undefined) {
            // user is visiting first time, ask user his name
            builder.Prompts.text(session, "Hello, what is your name?");
        } else {
            // user has visited earlier, begin welcome dialog
            session.replaceDialog('/Welcome');
        }
    },
    //save user name to json file and set dialog data
    function(session, results) {
        // store user name in user profile
        session.userData.userName = results.response;
        // rest flag
        isFromProfile = false;
        // begin welcome dialog
        session.replaceDialog('/Welcome');
    }
]);


// Add intent handlers
dialog.matches('OrderPizza', function(session, args, next) {
    // if pizza is null, create empty pizza
    if (!pizza)
        pizza = lib.getEmptyPizza();
    pizza = lib.parsePizza(pizza, args.entities);
    pizza = lib.polishPizza(pizza);
    lib.newLine();
    console.log(pizza);
    //session.send(lib.userReadablePizzaString(pizza));
    session.replaceDialog('/VerifyOrder');
});

// verify the order if something is missing
bot.dialog('/VerifyOrder', [

    function(session, args, next) {
        if (!pizza.size || pizza.size == "" || pizza.size == '') {
            console.log("pizza.size : " + pizza.size);
            var prompt = "Do you want small, medium or large pizza?";
            session.send(prompt);
            // call root dialog, so that we can parse user response with LUIS
            session.beginDialog('/');
        } else if (!pizza.crust || pizza.crust == "" || pizza.crust == '') {
            console.log("pizza.crust : " + pizza.crust);
            var prompt = "Would you like thin crust, pan or hand tossed pizza?";
            session.send(prompt);
            // call root dialog, so that we can parse user response with LUIS
            session.beginDialog('/');
        } else if (!pizza.sauce || pizza.sauce == "" || pizza.sauce == '') {
            console.log("pizza.sauce : " + pizza.sauce);
            var prompt = "What sauce would you like?";
            session.send(prompt);
            // call root dialog, so that we can parse user response with LUIS
            session.beginDialog('/');
        } else if (!pizza.toppings || pizza.toppings == "" || pizza.toppings == '') {
            console.log("pizza.toppings : " + pizza.toppings);
            var prompt = "Do you like to add some toppings?";
            session.send(prompt);
            // call root dialog, so that we can parse user response with LUIS
            session.beginDialog('/');
        } else {
            // Everything is OKAY.
            // Phewwww....
            // ask for user address
            session.replaceDialog('/Address');
        }
    }
]);

// user address dialog
bot.dialog('/Address', [

    function(session) {
        builder.Prompts.text(session, "Where should we deliever your pizza?");
    },
    function(session, results) {
        session.userData.userAddress = results.response;
        // ask for user confirmation
        session.replaceDialog('/Confirmation');
    }

]);

// user confirmation dialog
bot.dialog('/Confirmation', [

    function(session) {
        if (isInConfirmationDialog == false) {
            session.send(lib.userReadablePizzaString(pizza) + "\nYour pizza will be delievered at " + session.userData.userAddress + ".");
            builder.Prompts.text(session, "Do you want to place your order?");
        } else if (isInConfirmationDialog) {
            builder.Prompts.text(session, "Sorry, I didn\'t catch that, Please respond in yes or no");
            isInConfirmationDialog = false;
        }
    },
    function(session, results) {
        // user agreed
        if (results.response.toUpperCase() == "YES" || results.response.toUpperCase() == "Y") {
            session.endDialog("Thank you for your order. You will recieve your delicious pizza within 25 minutes.");
            lib.saveToDB(session.userData.userName, session.userData.userAddress, pizza);
	    //session.beginDialog('/Welcome');
            pizza = null;
        }
        // user cancelled order
        else if (results.response.toUpperCase() == "NO" || results.response.toUpperCase() == "N") {
            session.replaceDialog('/CancelOrder');
        }
        // user enterd something that we don't understand
        else {
            isInConfirmationDialog = true;
            session.replaceDialog('/Confirmation');
        }
    }
]);

bot.dialog('/CancelOrder', [

    function(session) {
        pizza = null;
        isFromProfile = false;
        isInConfirmationDialog = false;
        isInWelcomeDialog = false;
        isFromCancelDialog = true;
        // return to root
        session.replaceDialog("/Welcome");
    }

]);

dialog.onDefault(function(session, args, next) {
    console.log(args);
    isInWelcomeDialog = true;
    session.beginDialog("/Welcome");
});
bot.dialog('/', dialog);

// Add intent handlers

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}