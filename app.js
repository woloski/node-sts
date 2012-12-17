
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
  app.set('port', process.env.PORT || 4567);
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
  var publicKey = 'MIIFCjCCA/KgAwIBAgIRAP2pOwLkPcbXUS1QvXLGq2IwDQYJKoZIhvcNAQEFBQAwcjELMAkGA1UEBhMCR0IxGzAZBgNVBAgTEkdyZWF0ZXIgTWFuY2hlc3RlcjEQMA4GA1UEBxMHU2FsZm9yZDEaMBgGA1UEChMRQ09NT0RPIENBIExpbWl0ZWQxGDAWBgNVBAMTD0Vzc2VudGlhbFNTTCBDQTAeFw0xMjA2MDMwMDAwMDBaFw0xMzA2MDMyMzU5NTlaMFoxITAfBgNVBAsTGERvbWFpbiBDb250cm9sIFZhbGlkYXRlZDEeMBwGA1UECxMVRXNzZW50aWFsU1NMIFdpbGRjYXJkMRUwEwYDVQQDFAwqLmF1dGgxMC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDFo/j8q3r3KJ1rKHoUofkJNWH3bFedryACTXHo+V2PX1sLJn9KZmDnw60yA+edUCtBTtWKuzNzBvF8Xmg3iWcXoaqb1d7QxN5XrDvXIN8IozojMu0pmlvn42V/BC8iQ45YIombmHGcGlAehBakE5Gr+CR8VuoPcROfLqy0pU63N0QxlyVANNAtXKOHRhTbfg1UxWWX8iVUb+O7q1i4u1f7GDZmErvCAMSqiRjA5qRjvB/kOvRcPr57doGmfysVxOpI93yOAm0Rn3/DHp4JV5axCQQKQL8QVCHKRWcrUjlbcmrBWDKsKPVJv79rairuMNSodQ4Jfs1DeWhv/fGE5rBrAgMBAAGjggGxMIIBrTAfBgNVHSMEGDAWgBTay+qtWwhdzP/8JlTOSeVVxjj0+DAdBgNVHQ4EFgQUO0++VR+mzKhJKhlCr+8P3i8CROwwDgYDVR0PAQH/BAQDAgWgMAwGA1UdEwEB/wQCMAAwNAYDVR0lBC0wKwYIKwYBBQUHAwEGCCsGAQUFBwMCBgorBgEEAYI3CgMDBglghkgBhvhCBAEwRQYDVR0gBD4wPDA6BgsrBgEEAbIxAQICBzArMCkGCCsGAQUFBwIBFh1odHRwczovL3NlY3VyZS5jb21vZG8uY29tL0NQUzA7BgNVHR8ENDAyMDCgLqAshipodHRwOi8vY3JsLmNvbW9kb2NhLmNvbS9Fc3NlbnRpYWxTU0xDQS5jcmwwbgYIKwYBBQUHAQEEYjBgMDgGCCsGAQUFBzAChixodHRwOi8vY3J0LmNvbW9kb2NhLmNvbS9Fc3NlbnRpYWxTU0xDQV8yLmNydDAkBggrBgEFBQcwAYYYaHR0cDovL29jc3AuY29tb2RvY2EuY29tMCMGA1UdEQQcMBqCDCouYXV0aDEwLmNvbYIKYXV0aDEwLmNvbTANBgkqhkiG9w0BAQUFAAOCAQEAoJG0rkJg8vml1k+a6Yd/Mt5ZZwzAwDS47ZS3u5tsD25eXZhNywThwFr0PSv5v7CG1RdDNtvrIcX5z8QNpNZ1WFIJXsTTTrmroG635L5slNUZwMSwhBtF+0eckeBwABOQS5iSPstB8S/hmiwFR7OkXa8cM0GJPgQwLwRTb6LrI4TMiaGnP6qEmNoBzqJL2Um5eedM0n4iyuOQEIWG/4mMakpuqdIeK3FTtDGN5BAW/+H7NFpTFNzd/zBKXF5eh8IaZGwj9SLlCxCdHgwKBtkvL3QwguALYEFec1r2r6ChaqpuivjFe8xPFclEOp77WWD04tkOyYOMm9EWnq/ltX62qQ==';
    var sig = new SignedXml(null, { signatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256", idAttribute: 'AssertionID' })
    sig.addReference("//*[local-name(.)='Assertion']", 
                    ["http://www.w3.org/2000/09/xmldsig#enveloped-signature", "http://www.w3.org/2001/10/xml-exc-c14n#"], 
                    "http://www.w3.org/2001/04/xmlenc#sha256");
    sig.signingKey = fs.readFileSync(__dirname + "/test-cert.pem")
    sig.keyInfoProvider = {
      getKeyInfo: function (key) {
        return "<X509Data><X509Certificate>" +publicKey+ "</X509Certificate></X509Data>"
      }
    };
    sig.computeSignature(token);

    var signed = sig.getSignedXml();
    fs.writeFileSync("signed.xml", signed);

    var Saml = require('./node_modules/passport-wsfed-saml2/lib/passport-wsfed-saml2/saml').SAML;
    var saml = new Saml({cert: publicKey, realm: 'urn:a10-test-company:sharepoint-intranet'});
    saml.validateResponse(signed, function(err, profile) {
      if (err) return console.error(err);
      
      console.log(profile);
    });

    res.send('ok');
  //res.render('issue2', { appEndpoint: 'http://sp-auth10/_trust/', token: token})
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
