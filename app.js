
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , fs = require('fs')
  , passport = require('passport')
  , wsfedsaml2 = require('passport-wsfed-saml2').Strategy
  , saml11 = require('./lib/saml11')
  , path = require('path');

  var SignedXml = require('xml-crypto').SignedXml;  


var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 4567);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/wsfed', function(req, res) {
  var options = {
    cert: fs.readFileSync(__dirname + '/test-cert.pem'),
    key: fs.readFileSync(__dirname + '/test-cert.key'),
    issuer: 'urn:issuer',
    lifetimeInSeconds: 600,
    audiences: 'urn:myapp',
    attributes: {
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'foo@bar.com',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'Foo Bar'
    },
    nameIdentifier: 'foo'
  };

  var signedAssertion = saml11.create(options);
  console.log(signedAssertion);  
  var rstr = '<t:RequestSecurityTokenResponse Context="/" xmlns:t="http://schemas.xmlsoap.org/ws/2005/02/trust"><t:RequestedSecurityToken>' +
              signedAssertion + '</t:RequestedSecurityToken></t:RequestSecurityTokenResponse>';

  var postTo = req.query.postTo || '/sharepoint/_trust';
  res.render('issue', { appEndpoint: postTo, token: rstr});
});


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new wsfedsaml2(
  {
    realm: 'urn:myapp',
    thumbprint: 'b538e6f6a188677ab209abc0eb3e43e0b529f716'
  },
  function(profile, done) {
      return done(null, profile);
  })
);

app.post('/sharepoint/_trust',
  passport.authenticate('wsfed-saml2', { failureRedirect: '/', failureFlash: true }),
  function(req, res) {
    res.render('user', { user: JSON.stringify(req.user, 0, 2) });
  }
);


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
