const express = require("express");
const http = require("http");
const cors = require("cors");
const fs = require("fs");
const { Server } = require("socket.io");

/* IMPORT MODULES */
const geofence = require("./Geofence");
const zoneDetector = require("./Zonedetector");
const mapTracker = require("./mapTracker");
const riskEngine = require("./riskEngine");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

/* CONNECT PUBLIC WEBSITE */
app.use(express.static("public"));

/* DRIVER DATABASE FILE */
const DRIVER_FILE = "driverData.json";

/* CREATE FILE IF IT DOES NOT EXIST */
if (!fs.existsSync(DRIVER_FILE)) {
fs.writeFileSync(DRIVER_FILE, JSON.stringify([]));
}

/* DRIVER REGISTRATION */
app.post("/register", (req,res)=>{

const {name,plate,phone} = req.body;

const drivers = JSON.parse(fs.readFileSync(DRIVER_FILE));

const newDriver = {
id: Date.now(),
name,
plate,
phone,
speed:0,
warnings:0,
risk:"LOW",
location:{lat:0,lng:0}
};

drivers.push(newDriver);

fs.writeFileSync(DRIVER_FILE,JSON.stringify(drivers,null,2));

res.json({message:"Driver registered",driver:newDriver});

});

/* GET ALL DRIVERS */
app.get("/drivers",(req,res)=>{

const drivers = JSON.parse(fs.readFileSync(DRIVER_FILE));

res.json(drivers);

});

/* UPDATE DRIVER SPEED */
app.post("/speed",(req,res)=>{

const {plate,speed} = req.body;

const drivers = JSON.parse(fs.readFileSync(DRIVER_FILE));

const driver = drivers.find(d=>d.plate===plate);

if(!driver){
return res.status(404).json({error:"Driver not found"});
}

/* ZONE DETECTION */
const zone = zoneDetector(speed);

/* GEOFENCE CHECK */
const geoWarning = geofence(speed,zone.limit);

if(geoWarning){
driver.warnings += 1;
}

driver.speed = speed;

/* RISK ENGINE */
driver.risk = riskEngine(speed,driver.warnings);

fs.writeFileSync(DRIVER_FILE,JSON.stringify(drivers,null,2));

/* REALTIME UPDATE */
io.emit("speedUpdate",driver);

res.json(driver);

});

/* UPDATE DRIVER LOCATION */
app.post("/location",(req,res)=>{

const {plate,lat,lng} = req.body;

const drivers = JSON.parse(fs.readFileSync(DRIVER_FILE));

const driver = drivers.find(d=>d.plate===plate);

if(!driver){
return res.status(404).json({error:"Driver not found"});
}

driver.location = {lat,lng};

/* MAP TRACKER MODULE */
mapTracker(driver);

fs.writeFileSync(DRIVER_FILE,JSON.stringify(drivers,null,2));

io.emit("locationUpdate",driver);

res.json(driver);

});

/* SOCKET CONNECTION */

io.on("connection",(socket)=>{

console.log("User connected");

socket.on("disconnect",()=>{
console.log("User disconnected");
});

});

/* START SERVER */

const PORT = process.env.PORT || 3000;

server.listen(PORT,()=>{

console.log("Server running on port "+PORT);

});
