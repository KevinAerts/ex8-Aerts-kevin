// >$ npm install request --save 
var request = require("request");
var dal = require('./storage.js');

// http://stackoverflow.com/questions/10888610/ignore-invalid-self-signed-ssl-certificate-in-node-js-with-https-request
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


var BASE_URL = "https://web-ims.thomasmore.be/datadistribution/API/2.0";
var Settings = function(url) {
    this.url = BASE_URL + url;
    this.method = "GET";
    this.qs = {
        format: 'json'
    };
    this.headers = {
        authorization: "Basic aW1zOno1MTJtVDRKeVgwUExXZw=="
    };
};

var Drone = function(id, name, mac_address, location, date, files, files_count) {
    this._id = id;
    this.name = name;
    this.mac_address = mac_address;
    this.location = location;
    this.date = date;
    this.files = files;
    this.files_count = files_count;
};

var File = function(f_id, date_load, date_first_r, date_last_r, f_url, ref_link, content, count_content) {
    this.file_id = f_id;
    this.date_loaded = date_load;
    this.date_first_record = date_first_r;
    this.date_last_record = date_last_r;
    this.url = f_url;
    this.ref = ref_link;
    this.contents = content;
    this.contents_count = count_content;
};

var Content = function(c_id, mac_address, date, rssi, c_url, ref, droneid, fileid) {
    this.id = c_id;
    this.mac_address = mac_address;
    this.datetime = date;
    this.rssi = rssi;
    this.url = c_url;
    this.ref = ref;
};

var dronesSettings = new Settings("/drones?format=json");

dal.clearDrone();
dal.clearFile();
dal.clearContent();

request(dronesSettings, function(error, response, dronesString) {
            var drones = JSON.parse(dronesString);
            /*console.log(drones);
            console.log("***************************************************************************");*/
            drones.forEach(function(drone) {
                        var droneSettings = new Settings("/drones/" + drone.id + "?format=json");
                        request(droneSettings, function(error, response, droneString) {
                                    var drone = JSON.parse(droneString);
                                    dal.insertDrone(
                                        new Drone(drone.id, drone.name, drone.mac_address, drone.location, drone.last_packet_date, drone.files, drone.files_count));


                         var filesSettings = new Settings("/files?drone_id.is=" + drone.id + "&format=json&date_loaded.greaterOrEqual=2016-12-13T12:00:00");
                                    request(filesSettings, function(error, response, filesString) {
                                        var files = JSON.parse(filesString);
                                        files.forEach(function(file) {
                                            var fileSettings = new Settings("/files/" + file.id + "?format=json");
                                            request(fileSettings, function(error, response, fileString) {
                                                var file = JSON.parse(fileString);
                                                dal.insertFile(
                                                    new File(file.id, file.date_loaded, file.date_first_record, file.date_last_record, file.url, file.ref, file.contents, file.contents_count));

                                        
                        var contentsSettings = new Settings("/files/" + file.id + "/contents?format=json");
                                    request(contentsSettings, function (error, response, contentsString){
                                        var contents = JSON.parse(contentsString);
                                        contents.forEach(function (content){
                                           var contentSettings = new Settings("/files/" + file.id + "/contents/"+content.id+"?format=json");
                                           request(contentSettings, function (error, response, contentString){
                                               var content = JSON.parse(contentString);
                                                                dal.insertContent(
                                                    new Content(content.id, content.mac_address, content.datetime, content.rssi, content.url, content.ref));

                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                        console.log("Hello World!");