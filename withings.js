

var express = require('express');
var config = require('config');
var app = express();
var Withings = require('withings-lib');
var cookieParser = require('cookie-parser');
var session = require('express-session');

app.use(cookieParser());
app.use(session({secret: 'bigSecret'}));
app.listen(3000);


var appOauth = config.get('app.oauth');
var gUserID = 0;

// OAuth flow
app.get('/', function (req, res) {
    // Create an API client and start authentication via OAuth


    var options = {
        consumerKey: appOauth.CONSUMER_KEY,
        consumerSecret: appOauth.CONSUMER_SECRET,
        callbackUrl: appOauth.CALLBACK_URL
    };
    var client = new Withings(options);

    client.getRequestToken(function (err, token, tokenSecret) {
        if (err) {
            // Throw error
            return;
        }

        req.session.oauth = {
            requestToken: token,
            requestTokenSecret: tokenSecret
        };

        res.redirect(client.authorizeUrl(token, tokenSecret));
    });
});

// On return from the authorization
app.get('/oauth_callback', function (req, res) {
    var verifier = req.query.oauth_verifier;
    var oauthSettings = req.session.oauth;

    gUserID = req.query.userid;

    console.log("req: "+gUserID);

    var options = {
        consumerKey: appOauth.CONSUMER_KEY,
        consumerSecret: appOauth.CONSUMER_SECRET,
        callbackUrl: appOauth.CALLBACK_URL,
        userID: gUserID
    };
    var client = new Withings(options);

    //return;
    //res.simpleText(200, "Hello World!"+req.query.userid);
   // res.send('<p>some html</p>');
    //res.send(options);
    //res.send(client);

    if (true) {

        // Request an access token
        client.getAccessToken(oauthSettings.requestToken, oauthSettings.requestTokenSecret, verifier,
            function (err, token, secret) {
                if (err) {
                    // Throw error
                    return;
                }

                oauthSettings.accessToken = token;
                oauthSettings.accessTokenSecret = secret;

                res.redirect('/activity/weight');

                //res.json(token);
            }
        );
    }
});

// Display today's steps for a user
app.get('/activity/steps', function (req, res) {
    var options = {
        consumerKey: appOauth.CONSUMER_KEY,
        consumerSecret: appOauth.CONSUMER_SECRET,
        accessToken: req.session.oauth.accessToken,
        accessTokenSecret: req.session.oauth.accessTokenSecret,
        userID: gUserID
    };
    var client = new Withings(options);

    console.log("req 2 : "+gUserID);

    client.getDailySteps(new Date(), function(err, data) {
        if (err) {
            res.send(err);
        }
        res.json(data);
    });
});




// Display today's steps for a user
app.get('/activity/weight', function (req, res) {
    var options = {
        consumerKey: appOauth.CONSUMER_KEY,
        consumerSecret: appOauth.CONSUMER_SECRET,
        accessToken: req.session.oauth.accessToken,
        accessTokenSecret: req.session.oauth.accessTokenSecret,
        userID: gUserID
    };
    var client = new Withings(options);

    console.log("req 2 : "+gUserID);

    client.getWeightMeasures(new Date(2013, 5, 1), new Date(),function(err, data) {
        if (err) {
            res.send(err);
        }
        res.json(data);
    });
});
