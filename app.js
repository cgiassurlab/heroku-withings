
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

//var config = require('config');
//var config = require('load-env');
var dotenv = require('dotenv');
dotenv.config({silent: true});
dotenv.load();

var cookieParser = require('cookie-parser');
var session = require('express-session');

// our db model
var Models = require("./models/model.js");
var User = Models.user;
var Person = Models.person;

// the ExpressJS App
var app = express();



// configuration of expressjs settings for the web server.



// server port number
app.set('port', process.env.PORT || 8080);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());

app.use(cookieParser());
app.use(session({secret: 'bigSecret'}));


app.set('views', __dirname + '/views');
//app.engine('.html', require('jade').__express);
app.set('view engine', 'jade');
//app.use(express.static(path.join(__dirname, 'public')));


// Routes

var routePartials = function (req, res) {
  var name = req.params.name;
  //res.render('html/' + name +".html");
  var fileUrl = __dirname + '/html/'+name+'.html';
    console.log("dir:"+fileUrl);
     res.sendFile(fileUrl);
};
//app.get('/', routes.index);
app.get('/html/:name', routePartials);





// connecting to database
//app.db = mongoose.connect(config.app.dbConfig.mongoDB_URI);
//ew Mongo('mongodb://USERNAME:PASSWORD@mongo1.db.koding.com/DBNAME')

//process.env
app.db = mongoose.connect(process.env.MONGOLAB_URI);
console.log("connected to database");

/**
 * CORS support for AJAX requests
 */

app.all('*', function(req, res, next){

  console.log("app.all");
  if (!req.get('Origin')) return next();
  console.log("app.all with Origin");
  // use "*" here to accept any origin
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'PUT');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  // res.set('Access-Control-Allow-Max-Age', 3600);
  if ('OPTIONS' == req.method) return res.send(200);
  console.log("app.all with Options");
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

var routesMain = require('./routes/index.js');
var routesPerson = require('./routes/person.js');
var routesUser = require('./routes/user.js');


// home route is not really an API route, but does respond back
app.get('/', routesMain.index); // calls index function in /routes/index.js

// API routes
app.post('/person/create', routesPerson.create);
app.get('/person/get/:id', routesPerson.getOne);
app.get('/person/get', routesPerson.getAll);
app.post('/person/update/:id', routesPerson.update);
app.get('/person/delete/:id', routesPerson.remove);
app.post('/user/create', routesUser.create);
app.get('/user/get/:id', routesUser.getOne);
app.get('/user/get', routesUser.getAll);
app.post('/user/update/:id', routesUser.update);
app.get('/user/delete/:id', routesUser.remove);




var Withings = require('withings-lib');
var appOauth = {};//process.env.WITHINGS_OAUTH;//config.get('app.oauth');
var gUserID = 0;

// OAuth flow
app.get('/withings', function (req, res) {
    // Create an API client and start authentication via OAuth


    var options = {
        consumerKey: process.env.WITHINGS_CONSUMER_KEY,
        consumerSecret: process.env.WITHINGS_CONSUMER_SECRET,
        callbackUrl: process.env.WITHINGS_CALLBACK_URL
    };
    var client = new Withings(options);

    console.log("withings : key:"+options.consumerKey+" secret:"+options.consumerSecret+" callback:"+options.callbackUrl);

    client.getRequestToken(function (err, token, tokenSecret) {
        if (err) {
            // Throw error
            return;
        }

        console.log("withings : token:"+token+" tokenSecret:"+tokenSecret);

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
    req.session.gUserID = gUserID;

    console.log("req: "+gUserID);

    var options = {
        consumerKey: process.env.WITHINGS_CONSUMER_KEY,
        consumerSecret: process.env.WITHINGS_CONSUMER_SECRET,
        callbackUrl: process.env.WITHINGS_CALLBACK_URL,
        userID: gUserID
    };
    var client = new Withings(options);

    //return;
    //res.simpleText(200, "Hello World!"+req.query.userid);
    //res.send('<p>some html</p>');
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

                //TODO store userID, token + secret

                	  var user = User({
                	  	name: "createdByApp",
                    	withingsToken : token,
                    	withingsTokenSecret : secret,
                    	withingsUserID : gUserID
                    });

                	  // now, save that person to the database
                		// mongoose method, see http://mongoosejs.com/docs/api.html#model_Model-save
                	  user.save(function(err,data){
                	  	// if err saving, respond back with error
                	  	if (err){
                	  		var jsonDataErr = {status:'ERROR', message: 'Error saving user'};
                	  		return res.json(jsonDataErr);
                	  	}

                	  	//console.log('saved a new person!');
                	  	//console.log(data);

                	  	// now return the json data of the new person
                	  	var jsonData = {
                	  		status: 'OK',
                	  		person: data
                	  	};


                	  	//return res.json(jsonData);
                      return res.redirect('/withings/activity/weight');

                	  });


                //res.json(token);
            }
        );
    }
});

// Display today's steps for a user
app.get('/withings/activity/steps', function (req, res) {
	
    if (!gUserID)
      gUserID =req.session.gUserID;

    var options = {
        consumerKey: process.env.WITHINGS_CONSUMER_KEY,
        consumerSecret: process.env.WITHINGS_CONSUMER_SECRET,
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
	
		
	
	//res.sendFile(path.join(__dirname + '/weight.html'));
	

    if (!gUserID)
        if (req.session) gUserID =req.session.gUserID;

    if (!req.session || !req.session.oauth || !gUserID) {
      res.send("Please relog to your app.");
      return;
    }

    /*
    	// mongoose method, see http://mongoosejs.com/docs/api.html#model_Model.findById
    	User.findById(requestedId, function(err,data){

    		// if err or no user found, respond with error
    		if(err || data === null){
      		var jsonDataErr = {status:'ERROR', message: 'Could not find that person'};
      		 return res.json(jsonDataErr);
      	}

      	// otherwise respond with JSON data of the user
      	var jsonData = {
      		status: 'OK',
      		person: data
      	};

      	return res.json(jsonData);

    	});

      */

    var options = {
        consumerKey: process.env.WITHINGS_CONSUMER_KEY,
        consumerSecret: process.env.WITHINGS_CONSUMER_SECRET,
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
        //res.json(data);
        //var html = "";
		//html += "<div style='background-color:#4C4C4C;height:50px;margin-top:150px;margin-left:5%;width:90%'></div>"
        //html += "<div style='width:90%;background-color:#d8d8d8;margin-left:5%;margin-top:20px;height:300px'><h1 style='padding:20px;font-family:Leelawadee;font-size:45px;margin-top:25px;margin-left:20px'>Votre poids :</h1> <ul style='font-size:20px;font-family:Arial;margin-left: 10px'>";
		
        for (var i = 0; i < data.length; i++ ) {
          var point = data[i];
		  var views = point.measures[0].value*0.01
		  res.render('view', {views: JSON.stringify(point.measures[0].value*0.01)});
		  
          //html += "<li style='margin-bottom:10px'>"+JSON.stringify(point.measures[0].value*0.01)+" Kilos</li>";
		 
		  
        }
		


		
		//html += "</ul>";
		//html += "</div>";

	
        //res.send(html);
	//});
    });
	
});


// if route not found, respond with 404
app.use(function(req, res, next){

	var jsonData = {
		status: 'ERROR',
		message: 'Sorry, we cannot find the requested URI'
	};
	// set status as 404 and respond with data
  res.status(404).send(jsonData);

});



// create NodeJS HTTP server using 'app'
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
