/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
http://docs.botframework.com/builder/node/guides/understanding-natural-language/
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

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
dialog.matches('Greeting', [

    function(session) {
        
            builder.Prompts.text(session, "Hello, what is your name?");
        
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
dialog.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
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