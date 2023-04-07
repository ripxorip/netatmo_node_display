const request = require('request');
const express = require('express');
const fs = require('fs');

ACCESS_TOKEN = '';
REFRESH_TOKEN = '';

// Read the access token from token.txt
fs.readFile('token.txt', 'utf8', function (err, data) {
  if (err) throw err;
  ACCESS_TOKEN = data;
});

// Read the refresh token from refresh_token.txt
fs.readFile('refresh_token.txt', 'utf8', function (err, data) {
  if (err) throw err;
  REFRESH_TOKEN = data;
});

CLIENT_ID = '';
CLIENT_SECRET = '';

// Read the client id from client_id.txt
fs.readFile('client_id.txt', 'utf8', function (err, data) {
  if (err) throw err;
  CLIENT_ID = data;
});

// Read the client secret from client_secret.txt
fs.readFile('client_secret.txt', 'utf8', function (err, data) {
  if (err) throw err;
  CLIENT_SECRET = data;
});

const app = express();

app.use(express.static('.'));

function refresh_access_token() {
  const params = {
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN
  };

  request.post('https://api.netatmo.com/oauth2/token', { form: params }, function (error, response, body) {
    ACCESS_TOKEN = JSON.parse(body).access_token;
    REFRESH_TOKEN = JSON.parse(body).refresh_token;
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
}

// Run function every hour
setInterval(refresh_access_token, 3600000);

function parse_station_data(devices, modules) {
  var station_data = [];
  //console.log(devices);
  //console.log(modules);
  station_data.push(`<b>Kök Temp:</b> ${devices[0].dashboard_data.Temperature}°C`);
  station_data.push(`<b>Kök Hum:</b> ${devices[0].dashboard_data.Humidity}%`);
  station_data.push(`<b>Kök Tryck:</b> ${devices[0].dashboard_data.Pressure}hPa`);

  station_data.push(`<b>Ute Temp:</b> ${modules[0].dashboard_data.Temperature}°C`);
  station_data.push(`<b>Ute Regn:</b> ${modules[1].dashboard_data.Rain}mm`);

  station_data.push(`<b>Vind:</b> ${modules[2].dashboard_data.WindStrength}m/s`);

  station_data.push(`<b>Sovrum Temp:</b> ${modules[3].dashboard_data.Temperature}°C`);

  return station_data;
}

app.get('/weather_data', function (req, res) {
  request.get({
    url: 'https://api.netatmo.com/api/getstationsdata',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`
    }
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const data = JSON.parse(body);
      const modules = data.body.devices[0].modules;
      var station_data = parse_station_data(data.body.devices, modules);

      res.json(station_data);
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


app.listen(3137, function() {
  console.log('Server publishing on port 3137');
});
