var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// See http://mongoosejs.com/docs/schematypes.html

var userSchema = new Schema({
	name: String,
	locationGeo : { type: [Number], index: { type: '2dsphere', sparse: true } },
	locationName : String,
	dateAdded : { type: Date, default: Date.now },
	withingsToken : String,
	withingsTokenSecret : String,
	withingsUserID : String,
});


var personSchema = new Schema({
	name: String,
	locationGeo : { type: [Number], index: { type: '2dsphere', sparse: true } },
	locationName : String,
	dateAdded : { type: Date, default: Date.now },
});

var profil = new Profil({
	id: String,
	name: String,
	//inactivityTime : 
});

// export 'Person' model so we can interact with it in other files
module.exports = {
						user : mongoose.model('User',userSchema),
						person : mongoose.model('Person',personSchema)
			};
