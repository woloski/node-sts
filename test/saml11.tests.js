var assert = require('assert'),
    fs = require('fs'),
    utils = require('./utils'),
    moment = require('moment'),
    should = require('should'),
    saml11 = require('../lib/saml11');

describe('saml 1.1', function () {

  it('should create a saml 1.1 signed assertion', function () {
    // cert created with:
    // openssl req -x509 -new -newkey rsa:2048 -nodes -subj '/CN=auth0.auth0.com/O=Auth0 LLC/C=US/ST=Washington/L=Redmond' -keyout auth0.key -out auth0.pem

    var options = {
      cert: fs.readFileSync(__dirname + '/test-auth0.pem'),
      key: fs.readFileSync(__dirname + '/test-auth0.key')
    };

    var signedAssertion = saml11.create(options);
    var isValid = utils.isValidSignature(signedAssertion, options.cert);
    assert.equal(true, isValid);
  });

  it('should support specifying Issuer property', function () {
    var options = {
      cert: fs.readFileSync(__dirname + '/test-auth0.pem'),
      key: fs.readFileSync(__dirname + '/test-auth0.key'),
      issuer: 'urn:issuer'
    };

    var signedAssertion = saml11.create(options);
    assert.equal('urn:issuer', utils.getIssuer(signedAssertion));
  });

  it('should create IssueInstant property', function () {
    var options = {
      cert: fs.readFileSync(__dirname + '/test-auth0.pem'),
      key: fs.readFileSync(__dirname + '/test-auth0.key')
    };

    var signedAssertion = saml11.create(options);
    // 2012-12-17T01:59:14.782Z
    var now = moment.utc();
    var issueInstant = moment(utils.getIssueInstant(signedAssertion)).utc();
    assert.equal(now.year(), issueInstant.year());
    assert.equal(now.month(), issueInstant.month());
    assert.equal(now.day(), issueInstant.day());
    assert.equal(now.hours(), issueInstant.hours());
    assert.equal(now.minutes(), issueInstant.minutes());
  });

  it('should create NotBefore and NotOnOrAfter properties', function () {
    var options = {
      cert: fs.readFileSync(__dirname + '/test-auth0.pem'),
      key: fs.readFileSync(__dirname + '/test-auth0.key'),
      lifetimeInSeconds: 600
    };

    var signedAssertion = saml11.create(options);
    var conditions = utils.getConditions(signedAssertion);
    assert.equal(1, conditions.length);
    var notBefore = conditions[0].getAttribute('NotBefore');
    var notOnOrAfter = conditions[0].getAttribute('NotOnOrAfter');
    should.ok(notBefore);
    should.ok(notOnOrAfter);

    var lifetime = Math.round((moment(notOnOrAfter).utc() - moment(notBefore).utc()) / 1000);
    assert.equal(600, lifetime);
  });

  it('should set audience restriction', function () {
    var options = {
      cert: fs.readFileSync(__dirname + '/test-auth0.pem'),
      key: fs.readFileSync(__dirname + '/test-auth0.key'),
      audiences: 'urn:myapp'
    };

    var signedAssertion = saml11.create(options);
    var audiences = utils.getAudiences(signedAssertion);
    assert.equal(1, audiences.length);
    assert.equal('urn:myapp', audiences[0].textContent);
  });

  it('should set multiple audience restriction', function () {
    var options = {
      cert: fs.readFileSync(__dirname + '/test-auth0.pem'),
      key: fs.readFileSync(__dirname + '/test-auth0.key'),
      audiences: ['urn:myapp', 'urn:myapp2']
    };

    var signedAssertion = saml11.create(options);
    var audiences = utils.getAudiences(signedAssertion);
    assert.equal(2, audiences.length);
    assert.equal('urn:myapp', audiences[0].textContent);
    assert.equal('urn:myapp2', audiences[1].textContent);
  });

  it('should set attributes', function () {
    var options = {
      cert: fs.readFileSync(__dirname + '/test-auth0.pem'),
      key: fs.readFileSync(__dirname + '/test-auth0.key'),
      attributes: {
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'foo@bar.com',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'Foo Bar'
      }
    };

    var signedAssertion = saml11.create(options);
    var attributes = utils.getAttributes(signedAssertion);
    assert.equal(2, attributes.length);
    assert.equal('emailaddress', attributes[0].getAttribute('AttributeName'));
    assert.equal('http://schemas.xmlsoap.org/ws/2005/05/identity/claims', attributes[0].getAttribute('AttributeNamespace'));
    assert.equal('foo@bar.com', attributes[0].firstChild.textContent);
    assert.equal('name', attributes[1].getAttribute('AttributeName'));
    assert.equal('http://schemas.xmlsoap.org/ws/2005/05/identity/claims', attributes[1].getAttribute('AttributeNamespace'));
    assert.equal('Foo Bar', attributes[1].firstChild.textContent);
  });

  it('should set attributes with multiple values', function () {
    var options = {
      cert: fs.readFileSync(__dirname + '/test-auth0.pem'),
      key: fs.readFileSync(__dirname + '/test-auth0.key'),
      attributes: {
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role': ['admin','contributor']
      }
    };

    var signedAssertion = saml11.create(options);
    var attributes = utils.getAttributes(signedAssertion);
    assert.equal(1, attributes.length);
    assert.equal('role', attributes[0].getAttribute('AttributeName'));
    assert.equal('http://schemas.xmlsoap.org/ws/2005/05/identity/claims', attributes[0].getAttribute('AttributeNamespace'));
    assert.equal('admin', attributes[0].childNodes[0].textContent);
    assert.equal('contributor', attributes[0].childNodes[1].textContent);
  });

  it('should set NameIdentifier', function () {
    var options = {
      cert: fs.readFileSync(__dirname + '/test-auth0.pem'),
      key: fs.readFileSync(__dirname + '/test-auth0.key'),
      nameIdentifier: 'foo'
    };

    var signedAssertion = saml11.create(options);
    var nameIdentifier = utils.getNameIdentifier(signedAssertion);
    assert.equal('foo', nameIdentifier.textContent);
  });

  it('should test the whole thing', function () {
    var options = {
      cert: fs.readFileSync(__dirname + '/test-auth0.pem'),
      key: fs.readFileSync(__dirname + '/test-auth0.key'),
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
    var isValid = utils.isValidSignature(signedAssertion, options.cert);
    assert.equal(true, isValid);

    var nameIdentifier = utils.getNameIdentifier(signedAssertion);
    assert.equal('foo', nameIdentifier.textContent);

    var attributes = utils.getAttributes(signedAssertion);
    assert.equal(2, attributes.length);
    assert.equal('emailaddress', attributes[0].getAttribute('AttributeName'));
    assert.equal('http://schemas.xmlsoap.org/ws/2005/05/identity/claims', attributes[0].getAttribute('AttributeNamespace'));
    assert.equal('foo@bar.com', attributes[0].firstChild.textContent);
    assert.equal('name', attributes[1].getAttribute('AttributeName'));
    assert.equal('http://schemas.xmlsoap.org/ws/2005/05/identity/claims', attributes[1].getAttribute('AttributeNamespace'));
    assert.equal('Foo Bar', attributes[1].firstChild.textContent);

    assert.equal('urn:issuer', utils.getIssuer(signedAssertion));

    var conditions = utils.getConditions(signedAssertion);
    assert.equal(1, conditions.length);
    var notBefore = conditions[0].getAttribute('NotBefore');
    var notOnOrAfter = conditions[0].getAttribute('NotOnOrAfter');
    should.ok(notBefore);
    should.ok(notOnOrAfter);

    var lifetime = Math.round((moment(notOnOrAfter).utc() - moment(notBefore).utc()) / 1000);
    assert.equal(600, lifetime);

  });

});
