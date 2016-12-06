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

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var dialog= new builder.IntentDialog({ recognizers: [recognizer] })
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
.matches('None', (session, args) => {
    session.send('Hi! This is the None intent handler. You said: \'%s\'.', session.message.text);
})
.onDefault((session) => {
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', dialog);

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