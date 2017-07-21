module.exports = function () {
    global.restify = require('restify');
    global.builder = require('botbuilder');
    global.request = require('request');
    global.async = require('async');
    global.google = require('google');

    require('dotenv').load();

    // create chat connector for communicating bot framework service
    var connector = new builder.ChatConnector({
        appId: process.env.MICROSOFT_APP_ID,
        appPassword: process.env.MICROSOFT_APP_PASSWORD
    });

    // bot declaration
    global.bot = new builder.UniversalBot(connector, function (session) {
        session.userData.about = {
            'name': "Aadyaa",
            'moduleNames': ["CS1020", "CS2100", "GER1000"],
            // TODO: use IVLE data, currently using default data
            'modules': {
                'CS1020': {
                },
                'CS2100': {
                },
                'GER1000': {
                }
            },
            'moduleQueries': {
                'CS1020': {
                    // query object with links (helpful/unhelpful flag)
                },
                'CS2100': {
                },
                'GER1000': {
                }
            }
        };

        // TODO: get info from IVLE instead of NUSMods
        // TODO: replace URLs to IVLE compatible ones by using User.getToken()
        // https://wiki.nus.edu.sg/display/ivlelapi/Timetable
        // https://wiki.nus.edu.sg/display/ivlelapi/Module

        // var numMods = about.moduleNames.length, url, count = 0;
        //
        // async.whilst(
        //     function () { return count < numMods; },
        //     function (callback) {
        //         url = 'http://api.nusmods.com/2017-2018/modules/' + session.userData.about.moduleNames[count] + '/index.json';
        //         request(url, function(error, response, body){
        //             if(!error  && response.statusCode === 200){
        //                 var importedJSON = JSON.parse(body);
        //                 session.userData.about.modules.push(importedJSON);
        //                 count++;
        //                 callback();
        //             }
        //         });
        //     },
        //     function (err) {
        //         session.save();
        //     }
        // );

        session.replaceDialog('rootDialog');
    });

    // setup the restify server
    var server = restify.createServer();
    server.listen(process.env.port || process.env.PORT || 3978, function () {
        console.log('%s listening to %s', server.name, server.url);
    });

    // listen for messages from users
    server.post('/api/messages', connector.listen());

    // LUIS recognizer
    var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
    bot.recognizer(recognizer);
    global.intents = new builder.IntentDialog({ recognizers:[recognizer] });

    // middleware
    bot.use(
        builder.Middleware.sendTyping()
    );
};