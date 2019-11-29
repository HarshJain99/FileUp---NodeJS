//var morgan					= require('morgan');
var express         = require('express');
var mysql           = require('mysql');
var cors            = require('cors');
var path 						= require('path');
var getPics       	= require(__dirname + '/apis/getPics');
var bodyParser 			= require('body-parser');
var fs						  = require('fs');

var urlencodedParser = bodyParser.urlencoded({ extended: true });

var app = express();

app.use(cors());
//app.use(morgan('dev'));

app.get('/',function(req,res){
		res.sendFile(__dirname + '/html/index.html');
});

app.get('/index.html',function(req,res){
  	res.sendFile(__dirname + '/html/index.html');
});

app.get('/css/:file',function(req,res){
  	res.sendFile(__dirname + '/CSS/' + req.params.file);
});

app.get('/html/:file',function(req,res){
  	res.sendFile(__dirname + '/html/' + req.params.file);
});

app.get('/js/:file',function(req,res){
  	res.sendFile(__dirname + '/JS/' + req.params.file);
});

app.get('/uploads/:file',function(req,res){
  	res.sendFile(__dirname + '/uploads/' + req.params.file);
});

app.get('/modified/:file',function(req,res){
  	res.sendFile(__dirname + '/modified/' + req.params.file);
});

app.get('/*', function(req, res) {
		res.redirect('/')
});

app.post('/getFileNames/*', urlencodedParser, function(req,res){
	res.end(getPics(app, req));
})

app.post('/execPython', urlencodedParser, function(req,res){
	var spawn 	= require("child_process").spawn;
	var pth   	= (req.body.src).split('/')[4];
	var pythonProcess = spawn('python',["./python/test.py", pth]);

	pythonProcess.stdout.on('data', (data) => {
		res.end(JSON.stringify(data.toString()));
	});

	pythonProcess.stderr.on('data', (data) => {
		res.end(JSON.stringify(data.toString()));
	});
})


//////////////////////////////////////////////
var multer = require("multer");
var storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, './uploads/'); // set the destination
    },
    filename: function(req, file, callback){
        callback(null, file.originalname); // set the file name and extension
    }
});
var upload = multer({storage: storage});//.array('photo',100);

var mongoose = require('mongoose');
var uploadSchema = new mongoose.Schema({
	name: String,
	size: Number,
	title : [String],
	destination  : String,
	timeOfUpload : Number,
});
var Uploads = mongoose.model('Uploads', uploadSchema, 'Uploads');

/////////FETCH ALL DOCS/////////
mongoose.connect('mongodb://localhost/mydb', {useNewUrlParser: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	// Uploads.deleteMany({}).exec(function(err, users) {
	//   if (err) throw err;
	//   console.log(users);
	// });
	Uploads.find().exec(function(err, users) {
	  if (err) throw err;
	  console.log(users);
	});
});
////////////////////////////////

app.post('/upload', upload.array('photo',100), function(req,res){
 	  var title = req.body.title + '';
		title = title.split(',');
		for(i=0;i<title.length;i++){
			title[i] = title[i].trim().toLowerCase();
		}

		mongoose.connect('mongodb://localhost/mydb', {useNewUrlParser: true});
		var db = mongoose.connection;
		db.on('error', console.error.bind(console, 'connection error:'));
		db.once('open', function() {
			var myobjs = [];
			for(i=0;i<req.files.length;i++){
				var image = req.files[i];
				var myobj = {
											'name':image.originalname,
											'size': image.size,
											'destination':image.destination,
											'timeOfUpload': new Date().getTime(),
											'title': title
										};
				myobjs.push(myobj);
			}

			Uploads.collection.insertMany(myobjs, function(err, docs){
				if (err){
						 return console.error(err);
				}
				else {
					 console.log("Multiple documents inserted to Collection");
				}
			});
			res.end("File is uploaded");
		})
});
/////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

app.post('/delImage', urlencodedParser, function(req,res){
	var file = req.body.src;
	fs.unlink(path.join('./uploads', file), function (err) {
	    if (err) throw err;
	    console.log('File deleted! ' + file);
	});
	mongoose.connect('mongodb://localhost/mydb', {useNewUrlParser: true});
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		Uploads.collection.deleteOne({'name':file}, function(err){
			if (err){
					 return console.error(err);
			}
			res.end(JSON.stringify('Deleted'));
		});
	});
})

app.post('/getTextForImage', urlencodedParser, function(req,res){
	var file = req.body.src;
	mongoose.connect('mongodb://localhost/mydb', {useNewUrlParser: true});
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		Uploads.collection.findOne({'name':file}, function(err, result){
			if (err){
					 return console.error(err);
			}
			res.end(JSON.stringify(result.title));
		});
	});
})

app.post('/saveTextForImage', urlencodedParser, function(req,res){
	var file  = req.body.src;
	var title = req.body.title + '';
	title = title.split(',');
	for(i=0;i<title.length;i++){
		title[i] = title[i].trim().toLowerCase();
	}

	mongoose.connect('mongodb://localhost/mydb', {useNewUrlParser: true});
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		Uploads.collection.updateOne({name:file}, { $set: { title: title } });
		res.end(JSON.stringify('Successfully Updated'));
	});
})

app.post('/filterImages', urlencodedParser, function(req,res){
	var filter = req.body.filter.toLowerCase() + '';
	var fi = filter.split(',');
	var f = [];
	for(i=0;i<fi.length;i++){
		f.push(fi[i].trim());
	}

	mongoose.connect('mongodb://localhost/mydb', {useNewUrlParser: true});
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		// Uploads.find({title:{ $elemMatch : {'$eq':filter} } }).exec(function(err, users) {
		Uploads.find({title:{ $elemMatch : {'$in' : f} } }).exec(function(err, users) {
			if (err) throw err;
			var results = [];
			for(i=0;i<users.length;i++){
				results.push(users[i].destination + users[i].name);
			}
			res.end(JSON.stringify(results));
		});
	});
})


//////////////////////////////////////////////
app.listen(3000, '0.0.0.0');
