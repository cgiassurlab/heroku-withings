
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var config = require('config');
var cookieParser = require('cookie-parser');
var session = require('express-session');


// the ExpressJS App
var app = express();

// configuration of expressjs settings for the web server.



// server port number
app.set('port', config.app.env.PORT || 5000);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());

app.use(cookieParser());
app.use(session({secret: 'bigSecret'}));


// connecting to database
app.db = mongoose.connect(config.app.dbConfig.mongoDB_URI);
//ew Mongo('mongodb://USERNAME:PASSWORD@mongo1.db.koding.com/DBNAME')

console.log("connected to database");

/**
 * CORS support for AJAX requests
 */

app.all('*', function(req, res, next){
  if (!req.get('Origin')) return next();
  // use "*" here to accept any origin
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'PUT');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  // res.set('Access-Control-Allow-Max-Age', 3600);
  if ('OPTIONS' == req.method) return res.send(200);
  next();
});

// api baseURI is at /api/

// API Routes

// CREATE - http://appname.com/api/create (POST)
// RETRIEVE 1 - http://appname.com/api/get/:id (GET)
// RETRIEVE ALL - http://appname.com/api/get (GET)
// UPDATE - http://appname.com/api/update/:id (PUT)
// DELETE - http://appname.com/api/delete/:id (DELETE)

// ROUTES, logic is in routes/index.js

var routes = require('./routes/index.js');


// home route is not really an API route, but does respond back
app.get('/', routes.index); // calls index function in /routes/index.js

// API routes
app.post('/api/create', routes.create); // API create route and callback (see /routes/index.js)
app.get('/api/get/:id', routes.getOne); // API retrieve 1 route and callback (see /routes/index.js)
app.get('/api/get', routes.getAll); // API retrieve all route and callback (see /routes/index.js)
app.post('/api/update/:id', routes.update); // API update route and callback (see /routes/index.js)
app.get('/api/delete/:id', routes.remove); // API delete route and callback (see /routes/index.js)

// if route not found, respond with 404
app.use(function(req, res, next){

	var jsonData = {
		status: 'ERROR',
		message: 'Sorry, we cannot find the requested URI'
	};
	// set status as 404 and respond with data
  res.status(404).send(jsonData);

});



var Withings = require('withings-lib');
var appOauth = config.get('app.oauth');
var gUserID = 0;

// OAuth flow
app.get('/withings', function (req, res) {
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
app.get('/withings/oauth_callback', function (req, res) {
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

                res.redirect('/withings/activity/weight');

                //res.json(token);
            }
        );
    }
});

// Display today's steps for a user
app.get('/withings/activity/steps', function (req, res) {
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
app.get('/withings/activity/weight', function (req, res) {
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








// create NodeJS HTTP server using 'app'
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
