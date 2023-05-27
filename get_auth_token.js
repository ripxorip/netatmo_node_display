const express = require('express');
const request = require('request');
const querystring = require('querystring');
const fs = require('fs');

CLIENT_ID = '';
CLIENT_SECRET = '';

// Read client id and secret from file
fs.readFile('client_id.txt', 'utf8', function(err, data) {
  if (err) throw err;
  CLIENT_ID = data;
});
fs.readFile('client_secret.txt', 'utf8', function(err, data) {
  if (err) throw err;
  CLIENT_SECRET = data;
});

const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPE = 'read_station';

const app = express();

app.get('/', function(req, res) {
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const params = querystring.stringify({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    state: state
  });
  const url = `https://api.netatmo.com/oauth2/authorize?${params}`;
  res.redirect(url);
});

app.get('/callback', function(req, res) {
  const code = req.query.code;
  const state = req.query.state;
  const params = {
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    code: code,
    state: state
  };
  request.post('https://api.netatmo.com/oauth2/token', {form: params}, function(error, response, body) {
    const var_body = JSON.parse(body);
    const ACCESS_TOKEN = JSON.parse(body).access_token;
    var REFRESH_TOKEN = JSON.parse(body).refresh_token;

    // Write the new token to token.txt
    fs.writeFile('token.txt', ACCESS_TOKEN, function (err) {
      if (err) throw err;
      console.log('Saved!');
    });
    // Writhe the new refresh token to refresh_token.txt
    fs.writeFile('refresh_token.txt', REFRESH_TOKEN, function (err) {
      if (err) throw err;
      console.log('Saved!');
    });
  });
});

app.listen(3000);
