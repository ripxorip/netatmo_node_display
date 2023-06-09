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

function utcToLocal(utcTimestamp) {
  var date = new Date(utcTimestamp);
  return date.toLocaleString();
}

// Run function every hour
setInterval(refresh_access_token, 3600000);

function parse_station_data(devices, modules) {
  var weather_data = [];
  var station_data = {};
  //console.log(devices);
  //console.log(modules);

  var localTimeString = utcToLocal(modules[0].dashboard_data.time_utc*1000);

  weather_data.push(`<b>Ute Temp:</b> ${modules[0].dashboard_data.Temperature}°C`);
  weather_data.push(`<b>Kök Temp:</b> ${devices[0].dashboard_data.Temperature}°C`);
  weather_data.push(`<b>Hum:</b> ${devices[0].dashboard_data.Humidity}%`);
  weather_data.push(`<b>Tryck:</b> ${devices[0].dashboard_data.Pressure}hPa`);

  weather_data.push(`<b>Regn:</b> ${modules[1].dashboard_data.sum_rain_1}mm`);
  weather_data.push(`<b>Regn (24h):</b> ${modules[1].dashboard_data.sum_rain_24}mm`);

  weather_data.push(`<b>Vind:</b> ${(modules[2].dashboard_data.WindStrength/3.6).toFixed(2)}m/s`);
  weather_data.push(`<b>Byvind:</b> ${(modules[2].dashboard_data.GustStrength/3.6).toFixed(2)}m/s`);
  weather_data.push(`<b>Riktning:</b> ${modules[2].dashboard_data.WindAngle}°`);

  weather_data.push(`<b>Sovrum Temp:</b> ${modules[3].dashboard_data.Temperature}°C`);

  station_data['weather_data'] = weather_data;
  station_data['time_updated'] = localTimeString;
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
