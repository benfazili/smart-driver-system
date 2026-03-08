const express = require("express");
const http = require("http");
const cors = require("cors");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

/* CONNECT PUBLIC FOLDER */
app.use(express.static("public"));

/* DRIVER DATABASE FILE */
const DRIVER_FILE = "driverData.json";

/* CREATE FILE IF IT DOESN'T EXIST */
if (!fs.existsSync(DRIVER_FILE)) {
fs.writeFileSync(DRIVER_FILE, JSON.stringify([]));
}

/* REGISTER DRIVER */
app.post("/register", (req,res)=>{

const {name,plate,phone} = req.body;

const drivers = JSON.parse(fs.readFileSync(DRIVER_FILE));

const newDriver = {
id: Date.now(),
name,
plate,
phone,
speed:0,
warnings:0
};

drivers.push(newDriver);

fs.writeFileSync(DRIVER_FILE, JSON.stringify(drivers,null,2));

res.json({message:"Driver Registered",driver:newDriver});

});

/* GET DRIVERS */
app.get("/drivers",(req,res)=>{

const drivers = JSON.parse(fs.readFileSync(DRIVER_FILE));

res.json(drivers);

});

/* UPDATE SPEED */
app.post("/speed",(req,res)=>{

const {plate,speed} = req.body;

const drivers = JSON.parse(fs.readFileSync(DRIVER_FILE));

const driver = drivers.find(d=>d.plate===plate);

if(driver){

driver.speed = speed;

if(speed>80){
driver.warnings+=1;
}

fs.writeFileSync(DRIVER_FILE,JSON.stringify(drivers,null,2));

io.emit("speedUpdate",driver);

res.json(driver);

}else{

res.status(404).json({error:"Driver not found"});

}

});

/* SOCKET CONNECTION */
io.on("connection",(socket)=>{

console.log("User connected");

});

/* START SERVER */

const PORT = process.env.PORT || 3000;

server.listen(PORT,()=>{

console.log("Server running on port "+PORT);

});
