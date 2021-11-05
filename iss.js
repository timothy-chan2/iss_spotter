const request = require('request');
const { geoAPIKey } = require('./constants/constants');

/**
 * Makes a single API request to retrieve the user's IP address.
 * Input:
 *   - A callback (to pass back an error or the IP string)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The IP address as a string (null if error). Example: "162.245.144.188"
 */
const fetchMyIP = function(callback) {
  request('https://api.ipify.org?format=json', (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }

    if (response.statusCode !== 200) {
      callback(Error(`Status Code ${response.statusCode} when fetching IP: ${body}`), null);
      return;
    }

    const ip = JSON.parse(body).ip;
    callback(null, ip);
  });
};


const fetchCoordsByIP = (ip, callback) => {
  request(`https://api.freegeoip.app/json/${ip}?apikey=${geoAPIKey}`, (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }

    if (response.statusCode !== 200) {
      callback(Error(`Status Code ${response.statusCode} when fetching coordinates: ${body}`), null);
      return;
    }
    
    const { latitude, longitude } = JSON.parse(body);
    callback(null, { latitude, longitude });
  });
};

const fetchISSFlyOverTimes = (coords, callback) => {
  if (coords.latitude > 80 || coords.latitude < -80 || coords.longitude > 180 || coords.longitude < -180) {
    callback('Coordinates are invalid', null);
    return;
  }
  
  request(`https://iss-pass.herokuapp.com/json/?lat=${coords.latitude}&lon=${coords.longitude}`, (error, response, body) => {
    if (error) {
      callback(error, null);
      return;
    }

    if (response.statusCode !== 200) {
      callback(Error(`Status Code ${response.statusCode} when fetching ISS pass times: ${body}`), null);
      return;
    }
    
    const data = JSON.parse(body).response;
    callback(null, data);
  });
};

/**
 * Orchestrates multiple API requests in order to determine the next 5 upcoming ISS fly overs for the user's current location.
 * Input:
 *   - A callback with an error or results.
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly-over times as an array (null if error):
 *     [ { risetime: <number>, duration: <number> }, ... ]
 */
const nextISSTimesForMyLocation = function() {
  // Fetch the IP address
  fetchMyIP((error, ip) => {
    if (error) {
      console.log("It didn't work!" , error);
      return;
    }

    // console.log('It worked! Returned IP:' , ip);

    // Fetch geo coordinates from IP
    fetchCoordsByIP(ip, (error, coord) => {
      if (error) {
        console.log("It didn't work!" , error);
        return;
      }
      
      // console.log('It worked! Returned coordinates:', coord);

      // Fetch flyover times for ISS
      fetchISSFlyOverTimes(coord, (error, flyover) => {
        if (error) {
          console.log("It didn't work!" , flyover);
          return;
        }
        
        for (let obj of flyover) {
          console.log(`Next pass on ${new Date(obj.risetime * 1000)} for ${obj.duration} seconds!`);
        }

      });
    });
  });
  
};

module.exports = {
  nextISSTimesForMyLocation
};