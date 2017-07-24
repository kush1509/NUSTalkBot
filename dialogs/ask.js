module.exports = function () {
    bot.dialog('askDialog', [
        function (session) {
            builder.Prompts.choice(session, "Choose a module:", session.userData.moduleNames, builder.ListStyle.button);
        },
        function(session, results) {
            session.sendTyping();
            if(results.response) {
                session.dialogData.currModule = results.response.entity;
                var promptText = "You chose " + results.response.entity + ". Ask me a question.";
                builder.Prompts.text(session, promptText);
            }
        },
        function(session, results) {
            session.sendTyping();
            if(results.response) {
                session.beginDialog('queryDialog', results.response);
            }
        },
        function(session, results) {
            // after user comes out of query dialog
            if(results.response.entity) {
                builder.Prompts.choice(session, "I knew it. I truly am awesome. Do you have another question?", "Yes|No", builder.ListStyle.button);
            } else {
                builder.Prompts.choice(session, "Sorry...do you want to try again?", "Yes|No", builder.ListStyle.button);
            }
        },
        function (session, results) {
            switch (results.response.entity.toLowerCase()) {
                case "yes":
                    session.beginDialog('askDialog');
                    break;
                case "no":
                    session.endDialog("Okay, see you!");
                    break;
            }
        }
    ]).triggerAction({
        matches: 'Ask'
    }).beginDialogAction('askHelp', 'helpDialog', { matches: 'Help'});

    bot.dialog('queryDialog', [
        function(session, args) {
            var searchQuery = args, currLink;
            session.dialogData.searchQuery = searchQuery;
            if(!doesQueryExistFunc(session, searchQuery, session.dialogData.currModule)) {
                // if query doesn't already exist, make a new search
                session.dialogData.linksObj = doSearch(session, searchQuery);
                session.userData.moduleQueries[session.dialogData.currModule][searchQuery] = session.dialogData.linksObj;
            } else {
                // query exists
                session.dialogData.linksObj = getExistingLinks(session, searchQuery, session.dialogData.currModule);
            }

            // get first link
            currLink = session.dialogData.linksObj[0];

            // show link card
            session.dialogData.currentLink = currLink;
            var card = createLinkCard(session, currLink);
            var msg = new builder.Message(session).addAttachment(card);
            session.send(msg);

            // ask if link is helpful
            builder.Prompts.choice(session, "Was the link helpful?", "Yes|No", builder.ListStyle.button);
        },
        function (session, results) {
            session.dialogData.success = false;
            switch (results.response.entity.toLowerCase()) {
                case "yes":
                    session.dialogData.currLink.helpful = true;
                    session.dialogData.success = true;
                    break;
                case "no":
                    session.dialogData.success = false;
                    deleteLink(session, session.dialogData.currModule, session.dialogData.searchQuery);
                    break;
            }

            session.endDialogWithResult(session.dialogData.success);
        }
    ]);

    function doSearch(searchQuery) {
        var linksObj = {};
        google.resultsPerPage = 21; // get the first 20 links
        google(searchQuery,
            function (err, res) {
                if(err) {
                    console.error(err);
                }

                res.links.splice(0, 1); // remove null object at index 0
                linksObj = res.links;
            });

        for(var i = 0; i < Object.keys(linksObj).length; i++) {
            linksObj[i].helpful = false;
        }

        return linksObj;
    }

    function doesQueryExistFunc(session, searchQuery, currModule) {
        return (searchQuery in session.userData.moduleQueries[currModule]);
    }

    function getExistingLinks(session, searchQuery, currModule) {
        return session.userData.moduleQueries[currModule][searchQuery];
    }

    // create hero card to display results of search query
    function createLinkCard(session, currLink) {
        return new builder.HeroCard(session)
            .title(currLink.title)
            .text(currLink.description)
            .buttons([
                builder.CardAction.openUrl(session, currLink.link, 'Open URL')
            ]);
    }

    // delete link if not helpful
    // if links become 0 then delete the searchQuery
    function deleteLink(session, currModule, searchQuery) {
        if(Object.keys(session.dialogData.linksObj).length === 0) {
            delete session.userData.moduleQueries[currModule][searchQuery];
        } else {
            session.dialogData.linksObj.splice(0, 1);
        }
    }
};



