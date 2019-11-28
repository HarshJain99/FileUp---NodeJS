module.exports = function(app, req){

  var glob = require('glob').sync;
  var path = require('path');
  var url  = req.originalUrl;

  var patt = new RegExp("/getFileNames/.*");
  var res  = patt.test(url);
  if(patt.test(url)){
    var mg = new glob(path.join("./uploads","/*.*"), {});
    return JSON.stringify(mg);
  }

};
