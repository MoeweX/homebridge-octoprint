var Service, Characteristic;
var ReqP = require("request-promise");

module.exports = function(homebridge){
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    // registration of each accessory
    homebridge.registerAccessory("homebridge-octoprint","OctoPrint",OctoPrint);
}

//**************************************************************************************************
// General Functions
//**************************************************************************************************



//**************************************************************************************************
// Bricklet Remote Switch
//**************************************************************************************************

function OctoPrint(log, config) {
  this.log = log;

  // parse config
  this.server = config["server"] || 'http://octopi.local';
  this.apiKey = config["api_key"];

  log.info("Initialized OctoPrint Accessory at " + this.server);
}

OctoPrint.prototype = {
    getServices: function() {

        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "Guy Sheffer and the Community")
            .setCharacteristic(Characteristic.Model, "OctoPrint");

        var controlService = new Service.Lightbulb();

        controlService
            .getCharacteristic(Characteristic.Brightness)
            .on('get', this.getProgress.bind(this));

        // set name
        controlService.setCharacteristic(Characteristic.Name, "OctoPrint");

        return [informationService, controlService];
    },

    /*
        This function gets the current progress of the print job and stores it as a
        lightbulb's brightness value.
    */
    getProgress(callback) {
       this.log('Getting current job data: GET ' + this.server + '/api/job');

       var options = {
           method: 'GET',
           uri: this.server + '/api/job',
           headers: {
               "X-Api-Key": this.apiKey
           },
           json: true
       };

       ReqP(options).then(function(printerState) {
           console.log('Retrieved current job data: ' + JSON.stringify(printerState));
           // TODO set to actual value
           callback(null, 50);
       })
       .catch(function(error) {
           callback(error);
       });
   }
}
