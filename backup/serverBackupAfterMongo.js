var morgan					= require('morgan');
var express         = require('express');
var mysql           = require('mysql');
var cors            = require('cors');
var path 						= require('path');
var getPics       	= require(__dirname + '/apis/getPics');
var bodyParser 			= require('body-parser');

var urlencodedParser = bodyParser.urlencoded({ extended: true });

var app = express();

app.use(cors());
app.use(morgan('dev'));

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

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("mydb");
	dbo.collection("uploads").find({}).toArray(function(err, result){
		if (err) throw err;
		console.log(result);
	});
	db.close();
});


var storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, './uploads/'); // set the destination
    },
    filename: function(req, file, callback){
        callback(null, file.originalname); // set the file name and extension
    }
});

var upload = multer({storage: storage}).array('photo',100);

app.post('/upload', function(req,res){
	upload(req, res, function(err) {
		if(err) {
        return res.end("Error uploading file.");
    }
    res.end("File is uploaded");

		var myobjs = [];
		for(i=0;i<req.files.length;i++){
			var image = req.files[i];
			var myobj = {'name':image.originalname, 'size': image.size, 'destination':image.destination,'timeOfUpload': new Date().getTime()};
			myobjs.push(myobj);
		}
  	MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  var dbo = db.db("mydb");
			dbo.collection("uploads").insertMany(myobjs, function(err, result){
				if (err) throw err;
				console.log('==> Docs inserted <==');
				db.close();
				res.end('uploaded ' + req.files.length + ' files');
			});
		});
	})
});
//////////////////////////////////////////////

app.listen(3000, '0.0.0.0');
