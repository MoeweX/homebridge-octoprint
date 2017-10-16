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
  this.name = config["name"];
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
            .getCharacteristic(Characteristic.On)
            .on('get', this.getPrintingState.bind(this))
            .on('set', this.setPrintingState.bind(this));

        controlService
            .getCharacteristic(Characteristic.Brightness)
            .on('get', this.getProgress.bind(this))
            .on('set', this.setProgress.bind(this));

        // set name
        controlService.setCharacteristic(Characteristic.Name, this.name);

        return [informationService, controlService];
    },

    // This function gets the current printing state (1 = printing, 0 = not printing)
    getPrintingState(callback) {
        this.log('Getting current printing state: GET ' + this.server + '/api/printer');

        var options = {
            method: 'GET',
            uri: this.server + '/api/printer',
            headers: {
                "X-Api-Key": this.apiKey
            },
            json: true
        };

        ReqP(options).then(function(printState) {
            var state = printState.state.flags.printing;
            console.log("Printer is printing: " + state)
            if (state == false) {
                callback(null, 0);
            } else {
                callback(null, 1);
            }
        })
        .catch(function(error) {
            callback(error);
        });
    },

    /*
        This function sets the current printing state. It is only allowed to shut down the printer
    */
    setPrintingState(value, callback) {
        if (value == 1) {
            console.log("You cannot start a print with homekit.");
            callback(1);
        } else {
            console.log("Stopping print.");
            var options = {
                method: 'POST',
                uri: this.server + '/api/job',
                headers: {
                    "X-Api-Key": this.apiKey
                },
                body: {
                    "command": "cancel"
                },
                json: true
            };
            ReqP(options).then(function(printState) {
                console.log("Print stopped successfully.")
                callback(null);
            })
            .catch(function(error) {
                callback(error);
            });
        }
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

       ReqP(options).then(function(printState) {
           var completion = printState.progress.completion;
           if (completion == null) {
               console.log("Printer currently not printing.")
               callback(null, 0);
           } else {
               console.log("Current completion: " + JSON.stringify(completion));
               completionInt = Math.round(parseFloat(completion));
               callback(null, completionInt);
           }
       })
       .catch(function(error) {
           callback(error);
       });
   },

   /*
        Not allowed.
   */
   setProgress(value, callback) {
       console.log("Cannot set progress with homekit!");
       callback(1);
   }
}
