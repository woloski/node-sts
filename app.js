
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , fs = require('fs')
  , path = require('path');

  var SignedXml = require('xml-crypto').SignedXml;  


var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/wsfed', function(req, res) {
  //var token = fs.readFileSync(__dirname +  '/token.xml');
  var token = fs.readFileSync(__dirname +  '/assertion.xml', "utf8");

    var sig = new SignedXml({signatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"})
    sig.addReference("//*[local-name(.)='Assertion']")    
    sig.signingKey = fs.readFileSync(__dirname + "/auth10.pem")
    sig.computeSignature(token)
    fs.writeFileSync("signed.xml", sig.getSignedXml())

    res.send('ok');
  //res.render('issue2', { appEndpoint: 'http://sp-auth10/_trust/', token: token})
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
