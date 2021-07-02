const express = require("express");
const db= require('./database');
const app = express();
const multer = require("multer");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const cheerio = require('cheerio');
const MailosaurClient = require('mailosaur')
const mailosaur = new MailosaurClient('YOUR_API_KEY')
const url = require('url');
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => res.status(200).send('Online!'));
app.listen(3000, () => console.log('Running on port 3000'));
function cekNum(num)
{
    let reg = new RegExp('^[0-9]+$');
    return reg.test(num)
}
const nodemailer = require('nodemailer');
//var transporter = require('transporter');
const storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './uploads/posts');
    },
    filename: async function(req, file, callback) {
        const extension = file.originalname.split('.')[file.originalname.split('.').length - 1];
        let filename = req.body.location;
        callback(null, (filename + '.' + extension));
    }
});
const uploads = multer({
    storage: storage
});
app.get("/weather/earthquake",async function (req,res){
    let arrEarthquake = [];
    axios.get('https://www.bmkg.go.id/gempabumi/gempabumi-terkini.bmkg').then((data) => {
        let retObj = []
        const $ = cheerio.load(data.data);
        const count = $("table > tbody>tr").length;
        for (let i=0; i<count; i++)
        {
            retObj = [];
            const tableInner = $($("table > tbody>tr")[i]).find("td")
            for (let j = 0;j<tableInner.length; j++){
                const textInnet = $(tableInner[j]).text();
                retObj.push(textInnet);
            }
            const temp = {
                "No":retObj[0],
                "Lintang" : retObj[1],
                "Bujur":retObj[2],
                "Magnitudo" : retObj[3],
                "Kedalaman": retObj[4],
                "Wilayah" : retObj[5]
            };
            arrEarthquake.push(temp);
        }
        return res.status(200).send(arrEarthquake);
    })
})

app.post("/user/upload", async function(req, res){
    uploads.single("foto_cuaca")(req,res,async function (err){
        const conn = await db.getConn();
        let location = req.body.location;
        let email = req.body.email;
        let deskripsi = req.body.deskripsi;
        let user_logon;
        try{
            user_logon = jwt.verify(req.header("x-auth-token"),"sessionWeather");
        }
        catch(err){
            return res.status(401).send("Token is invalid!");
        }

        let user = await db.executeQuery(conn,`select * from user where email = '${user_logon.email}'`);
        if (user[0].api_hit < 3)
        {
            return res.status(400).send({
                error: 'Api hit tidak cukup',
            });
        }
        else
        {
            let id = location;
            let directory = "/uploads/posts/"+req.file.filename;
            let cek_cuaca_user = db.executeQuery(conn,`select * from cuaca_user where id_cuaca_user = '${location}'`);
            if (cek_cuaca_user.length == 0)
            {
                await db.executeQuery(conn, `insert into cuaca_user values('${id}','${directory}','${email}','${deskripsi}')`);
            }
            else
            {
                await db.executeQuery(conn,`update cuaca_user set email = '${email}',deskripsi_cuaca = '${deskripsi}' where id_cuaca_user = '${location}'`);
            }

            const result = {
                "id_foto":id,
                "location" : location,
                "nama_user":user[0].nama,
                "foto_cuaca" : directory,
                "deskripsi_cuaca":req.body.deskripsi,
            };
            return res.status(201).send(result);
        }
    })
});
app.post("/user/register", async function(req, res){
    const conn = await db.getConn();
    let users = await db.executeQuery(conn, `select * from user`);
    let cekEmail = users.find(e=>e.email == req.body.email);
    let email = req.body.email;
    if(req.body.password == req.body.confirm_password){
        if(cekEmail === undefined){
            let regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if(req.body.email.match(regex)){
                await db.executeQuery(conn,`insert user values('${req.body.email}','${req.body.nama}','${req.body.password}', 0,0,'unverified')`);
                let result ={
                    "email": req.body.email,
                    "nama": req.body.nama,
                    "password": req.body.password,
                    "saldo": "0",
                    "status": "Unverified"
                }
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    ignoreTLS: false,
                    secure: false,
                    auth: {
                        user: 'hansdavidhd1997@gmail.com',
                        pass: 'goldenlaser24'
                    }
                });
                const adr = 'https://fish-snapdragon-oriole.glitch.me/user/verifying/'+req.body.email;
                const q = url.parse(adr, true);
                console.log(q.href)
                var mailOptions = {
                    from: 'hansdavidhd1997@gmail.com',
                    to: email,
                    subject: 'Verifying Email',
                    html: '<img src="https://i.ibb.co/nc5jNd0/Logo-Sneaky-V3.png" alt="" style="width: 280px; height: 150px; display: block; margin-left: auto; margin-right: auto;">\n' +
                        '\n' +
                        '<hr>\n' +
                        '\n' +
                        'Dear '+ req.body.nama +', <br>\n' +
                        '<br>\n' +
                        'Welcome to My Weather. <br>\n' +
                        'Your Account is : '+ req.body.email +' <br>\n' +
                        'Please click the following link to complete registration: <br>\n' +
                        '\n' +
                        '\n' +
                        '<a href="'+q.href+'"><button>Verify</button></a>'+
                        '<form method="posts" action="'+q.href+'">' +
                        '<input type="submit" value="Verify">' +
                        '</form>' +
                        '\n' +
                        '\n' +
                        'What is My Weather? <br>\n' +
                        '<br>\n' +
                        'My Weather is an API for looking up your current weather <br>\n' +
                        '\n' +
                        '\n' +
                        '<div style="text-align:center;">\n' +
                        '    © 2021 My Weather. All Rights Reserved. <br>\n' +
                        '    <a href="https://www.google.com/maps/place/Jl.+Ngagel+Jaya+Tengah+No.73-77,+Baratajaya,+Kec.+Gubeng,+Kota+SBY,+Jawa+Timur+60284/data=!4m2!3m1!1s0x2dd7fbb389e69e91:0x13a2a525ff8b9ff0?sa=X&ved=2ahUKEwi1tNaPjMvmAhXHbn0KHfDgBGoQ8gEwAHoECAsQAQ">iSTTS</a>, Surabaya <br>\n' +
                        '</div>\n'
                };
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) console.log(error);
                    console.log('Email sent: ' + info.response);
                });
                return res.status(201).send(result);
            }
            else{
                return res.status(400).send("Format Email salah!");
            }
        }
        else{
            return res.status(400).send("Email sudah pernah digunakan!");
        }
    }
    else{
        return res.status(400).send("Password dan Confirm Passoword harus sama!");
    }
    conn.release();
});

app.get("/user/verifying/:email", async function (req, res){
    const conn = await db.getConn();
    await db.executeQuery(conn, `update user set status = 'approve' where email = '${req.params.email}'`);
    res.status(200).send("Email terverifikasi");
});

app.post("/user/login", async function(req, res){
    const conn = await db.getConn();
    let users = await db.executeQuery(conn, `select * from user`);
    if(req.body.email ==  "admin"  && req.body.password== "admin"){
        const token = jwt.sign({
            "email": "admin"
        }, "sessionWeather", {expiresIn: '60m'});
        const result = {
            "email": "admin",
            "token": token
        };
        res.status(201).send(result);
    }
    else{
        let cekEmail = users.find(e=>e.email == req.body.email && e.password == req.body.password);
        if (cekEmail === undefined) {
            return res.status(404).send("Email tidak ditemukan / Password salah!");
        }
        else if (users.status == "unverified")
        {
            return res.status(401).send("User belum melakukan verify email");
        }
        else {
            const token = jwt.sign({
                "email": req.body.email
            }, "sessionWeather", {expiresIn: '60m'});
            const result = {
                "email": req.body.email,
                "token": token
            };
            return res.status(201).send(result);
        }
    }
  conn.release();
});

app.post("/user/topup", async (req,res)=>{
    const conn = await db.getConn();
    let token = req.headers["x-auth-token"];
    let user_logon = {};
    if(!token){
        return res.status(401).send("Key tidak ditemukan!");
    }
    try{
        user_logon = jwt.verify(token,"sessionWeather");
    }
    catch(err){
        return res.status(401).send("Token is invalid!");
    }
    if(!cekNum(req.body.saldo)){
        return res.status(400).send("Saldo harus mengandung angka saja");
    }
    else{
        let users = await db.executeQuery(conn, `select * from user where email = '${user_logon.email}'`);
        let tempSaldo = parseInt(users[0].saldo) + parseInt(req.body.saldo);
        let result = {
            "email" : user_logon.email,
            "saldo_awal" : users[0].saldo,
            "saldo_akhir" : tempSaldo
        };
        await db.executeQuery(conn,`update user set saldo = ${tempSaldo} where email = '${user_logon.email}'`);
        return res.status(201).send(result);        
    }
});
app.put("/user/recharge",async (req,res)=>{
    const conn = await db.getConn();
    let token = req.headers["x-auth-token"];
    let user_logon = {};
    if(!token){
        return res.status(401).send("Key tidak ditemukan!");
    }
    try{
        user_logon = jwt.verify(token,"sessionWeather");
    }
    catch(err){
        return res.status(401).send("Token is invalid!");
    }
    let users = await db.executeQuery(conn, `select * from user where email = '${user_logon.email}'`);
    if(users[0].saldo < 10000){
        return res.status(400).send("Saldo tidak mencukupi!");
    }
    else{
        let tempSaldoAkhir = users[0].saldo - 10000;
        let tempApiHit = users[0].api_hit + 10;                
        await db.executeQuery(conn,`update user set saldo = ${tempSaldoAkhir}, api_hit = ${tempApiHit}  where email = '${user_logon.email}'`);
        let result = {
            "email" : user_logon.email,
            "api_hit_awal" : users[0].api_hit,
            "api_hit_akhir" : tempApiHit
        }
        return res.status(200).send(result);
    }
});
app.post("/user/forgot_password", async (req,res)=>{
    const conn = await db.getConn();
    let users = await db.executeQuery(conn, `select * from user`);
    let cekEmail = users.find(e=>e.email == req.body.email);
    let email = req.body.email;
    if(cekEmail === undefined){
        return res.status(404).send("Email tidak ditemukan!");
    }
    else{
        if(req.body.new_password == req.body.confirm_new_password){
            await db.executeQuery(conn,`update user set password = ${req.body.new_password} where email = '${req.body.email}'`);
            let result = {
                "email" : req.body.email,
                "new password" : req.body.new_password
            };
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'hansdavidhd1997@gmail.com',
                    pass: 'goldenlaser24'
                }
            });
            var mailOptions = {
                from: 'hansdavidhd1997@gmail.com',
                to: email,
                subject: 'Reset Password!',
                text: 'Your Password has been reset'
            };
            transporter.sendMail(mailOptions, function(error, info){
                if (error) console.log(error);
                console.log('Email sent: ' + info.response);
            });
            return res.status(201).send(result);   
        }
        else{
            return res.status(400).send("Password dan Confirm Passoword harus sama!");
        }
    }

});
app.put("/admin/ban/:email",async (req,res)=>{
    const conn = await db.getConn();
    let token = req.headers["x-auth-token"];
    let user_logon = {};
    if(!token){
        return res.status(401).send("Key tidak ditemukan!");
    }
    try{
        user_logon = jwt.verify(token,"sessionWeather");
    }
    catch(err){
        return res.status(401).send("Token is invalid!");
    }
    if(user_logon.email != "admin"){
        return res.status(401).send("Hanya Admin yang bisa melakukan BAN!");
    }
    else{
        let users = await db.executeQuery(conn, `select * from user`);
        let cekEmail = users.find(e=>e.email == req.params.email);
        if(cekEmail === undefined){
            return res.status(404).send("Email tidak ditemukan!");
        }
        else{
            let cekStatus = await db.executeQuery(conn, `select * from user where email = '${req.params.email}'`);
            if(cekStatus[0].status == "banned"){
                return res.status(400).send("User sudah di banned!");  
            }
            else{
                await db.executeQuery(conn,`update user set status = 'banned' where email = '${req.params.email}'`);
                let result = {
                    "email" : req.params.email,
                    "status" : "Banned"
                };
                return res.status(201).send(result);  
            }
        }
    }
});
app.put("/admin/unban/:email",async (req,res)=>{
    const conn = await db.getConn();
    let token = req.headers["x-auth-token"];
    let user_logon = {};
    if(!token){
        return res.status(401).send("Key tidak ditemukan!");
    }
    try{
        user_logon = jwt.verify(token,"sessionWeather");
    }
    catch(err){
        return res.status(401).send("Token is invalid!");
    }
    if(user_logon.email != "admin"){
        return res.status(401).send("Hanya Admin yang bisa melakukan UNBAN!");
    }
    else{
        let users = await db.executeQuery(conn, `select * from user`);
        let cekEmail = users.find(e=>e.email == req.params.email);
        if(cekEmail === undefined){
            return res.status(404).send("Email tidak ditemukan!");
        }
        else{
            let cekStatus = await db.executeQuery(conn, `select * from user where email = '${req.params.email}'`);
            if(cekStatus[0].status == "approve"){
                return res.status(400).send("User sudah di approve!");  
            }
            else{
                await db.executeQuery(conn,`update user set status = 'approve' where email = '${req.params.email}'`);
                let result = {
                    "email" : req.params.email,
                    "status" : "Approve"
                };
                return res.status(201).send(result);  
            }
        }
    }
});
app.get("/admin/users",async (req,res)=>{
    const conn = await db.getConn();
    let token = req.headers["x-auth-token"];
    let user_logon = {};
    let tampung =[];
    if(!token){
        return res.status(401).send("Key tidak ditemukan!");
    }
    try{
        user_logon = jwt.verify(token,"sessionWeather");
    }
    catch(err){
        return res.status(401).send("Token is invalid!");
    }
    let tempUser = await db.executeQuery(conn,`select * from user`);
    tempUser.forEach(e => {
        let result = {
            "email": e.email,
            "nama": e.nama,
            "saldo": e.saldo    
        };
        tampung.push(result);
    });
    return res.status(201).send(tampung);  
});

app.get("/admin/weathers", async(req,res)=>{
    const conn = await db.getConn();
    let token = req.headers["x-auth-token"];
    let user_logon = {};
    if(!token){
        return res.status(401).send("Key tidak ditemukan!");
    }
    try{
        user_logon = jwt.verify(token,"sessionWeather");
    }
    catch(err){
        return res.status(401).send("Token is invalid!");
    }
    if(user_logon.email != "admin"){
        return res.status(401).send("Hanya Admin yang bisa menampilkan semua cuaca yang tersimpan!");
    }
    let weathers = await db.executeQuery(conn, `select * from cuaca`);
    return res.status(200).send(weathers);
})

app.get("/weather", async (req,res) => {
    const conn = await db.getConn();
    let users;
    let token = req.headers["x-auth-token"];
    let user_logon = {};
    if(!token){
        return res.status(401).send("Key tidak ditemukan!");
    }
    try{
        user_logon = jwt.verify(token,"sessionWeather");
        users =  await db.executeQuery(conn, `select * from user where email = '${user_logon.email}'`);
    }
    catch(err){
        return res.status(401).send("Token is invalid!");
    }
    if(users.length < 1){
        return res.status(404).send("User not found");
    }
    if(user_logon.email == "admin"){
        return res.status(401).send("Hanya User yang bisa menampilkan sesuai lokasi!");
    }
    let location = req.query.location;
    if(users[0].api_hit < 1){
        return res.status(400).send("api_hit anda kurang!")
    }
    if(!location){
        return res.status(400).send("Lokasi harus diisi!")
    }
    let apikey = 'f81204eae6f3825056abf4b239de46ad';
    await db.executeQuery(conn,`update user set api_hit = ${users[0].api_hit-1} where email='${user_logon.email}'`);
    const result = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apikey}`);
    const outcome = {
        Location : result.data.name,
        Weather : result.data.weather[0].main,
        Clouds : result.data.clouds.all + "%"
    }
    return res.status(200).send(outcome)
});

app.get("/weather/temperature", async (req,res) =>{
    const conn = await db.getConn();
    let users;
    let token = req.headers["x-auth-token"];
    let user_logon = {};
    if(!token){
        return res.status(401).send("Key tidak ditemukan!");
    }
    try{
        user_logon = jwt.verify(token,"sessionWeather");
        users = await db.executeQuery(conn, `select * from user where email = '${user_logon.email}'`);
    }
    catch(err){
        return res.status(401).send("Token is invalid!");
    }
    if(users.length < 1){
        return res.status(404).send("User not found");
    }
    if(user_logon.email == "admin"){
        return res.status(401).send("Hanya User yang bisa menampilkan sesuai lokasi!");
    }
    let location = req.query.location;
    if(users[0].api_hit < 1){
        return res.status(400).send("api_hit anda kurang!")
    }
    if(!location){
        return res.status(400).send("Lokasi harus diisi!")
    }
    let apikey = 'f81204eae6f3825056abf4b239de46ad';
    await db.executeQuery(conn,`update user set api_hit = ${users[0].api_hit-1} where email='${user_logon.email}'`);
    const result = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apikey}`);
    let celcius = (result.data.main.temp - 32)*5/9;
    let celcius_max = (result.data.main.temp_max - 32)*5/9;
    let celcius_min = (result.data.main.temp_min - 32)*5/9;
    const outcome = {
        Temperature : `${result.data.main.temp}°F/${celcius.toFixed(2)}°C`,
        Max_Temperature : `${result.data.main.temp_max}°F/${celcius_max.toFixed(2)}°C`,
        Min_Temperature : `${result.data.main.temp_min}°F/${celcius_min.toFixed(2)}°C`,
    }
    return res.status(200).send(outcome)
});

app.get('/weather/airpollution/:location', async (req, res) => {
    let users;
    const conn = await db.getConn();
    let token = req.headers["x-auth-token"];
    let user_logon = {};
    if(!token){
        return res.status(401).send("Key tidak ditemukan!");
    }
    try{
        user_logon = jwt.verify(token,"sessionWeather");
        users = await db.executeQuery(conn, `select * from user where email = '${user_logon.email}'`);
      
    }
    catch(err){
        return res.status(401).send("Token is invalid!");
    }
    if(users.length < 1){
        return res.status(404).send("User not found");
    }
    if(user_logon.email == "admin"){
        return res.status(401).send("Hanya User yang bisa menampilkan sesuai lokasi!");
    }
    let location = req.params.location;
    if(users[0].api_hit < 1){
        return res.status(400).send("api_hit anda kurang!")
    }
    if(!location){
        return res.status(400).send("Lokasi harus diisi!")
    }
    let apikey = 'f81204eae6f3825056abf4b239de46ad';
    const result_weather = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apikey}`);
    let latitude = result_weather.data.coord.lat;
    let longitude = result_weather.data.coord.lon;
    const result_polution = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${apikey}`);
    console.log(result_polution)
    const outcome = {
        Location : result_weather.data.name,
        Coordination : {
            Longitude : longitude,
            Latitude : latitude
        },
        Air_Quality : result_polution.data.list[0].main.aqi + " AQI",
    }
    await db.executeQuery(conn,`update user set api_hit = ${users[0].api_hit-1} where email='${user_logon.email}'`);
    return res.status(200).send(outcome);
});

app.get('/weather/historical', async (req, res) => {
    const conn = await db.getConn();
    let users;
    let token = req.headers["x-auth-token"];
    let location = req.body.location;
    let datetime = req.body.datetime;
    let user_logon = {};
    if(!token){
        return res.status(401).send("Key tidak ditemukan!");
    }
    try{
        user_logon = jwt.verify(token,"sessionWeather");
        users = await db.executeQuery(conn, `select * from user where email = '${user_logon.email}'`);
    }
    catch(err){
        return res.status(401).send("Token is invalid!");
    }
    if(users.length < 1){
        return res.status(404).send("User not found");
    }
    if(user_logon.email == "admin"){
        return res.status(401).send("Hanya User yang bisa menampilkan sesuai lokasi!");
    }
    if(users[0].api_hit < 1){
        return res.status(400).send("api_hit anda kurang!")
    }
    if(!location){
        return res.status(400).send("Lokasi harus diisi!")
    }
    let apikey = 'f81204eae6f3825056abf4b239de46ad';
    const result_weather = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apikey}`);
    let latitude = result_weather.data.coord.lat;
    let longitude = result_weather.data.coord.lon;
    var unixTimestamp = Math.floor(new Date(datetime).getTime()/1000);
    console.log(unixTimestamp)
    const result_historical = await axios.get(`https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${latitude}&lon=${longitude}&dt=${unixTimestamp}&appid=${apikey}`);
    const outcome = {
        Location : result_weather.data.name,
        Coordination : {
            Longitude : longitude,
            Latitude : latitude
        },
        Temp : result_historical.data.current.temp + " ℉",
        Humidity : result_historical.data.current.humidity + "%",
        Clouds : result_historical.data.current.clouds,
        Weather : result_historical.data.current.weather[0].main
    }
    await db.executeQuery(conn,`update user set api_hit = ${users[0].api_hit-1} where email='${user_logon.email}'`);
    return res.status(200).send(outcome);
});

app.get('/weather/national_alerts', async (req, res) => {
    const conn = await db.getConn();
    let users;
    let token = req.headers["x-auth-token"];
    let location = req.body.location;
    //let when = req.body.when; //hourly or daily
    let user_logon = {};
    if(!token){
        return res.status(401).send("Key tidak ditemukan!");
    }
    try{
        user_logon = jwt.verify(token,"sessionWeather");
        users = await db.executeQuery(conn, `select * from user where email = '${user_logon.email}'`);
    }
    catch(err){
        return res.status(401).send("Token is invalid!");
    }
    if(users.length < 1){
        return res.status(404).send("User not found");
    }
    if(user_logon.email == "admin"){
        return res.status(401).send("Hanya User yang bisa menampilkan sesuai lokasi!");
    }
    if(users[0].api_hit < 1){
        return res.status(400).send("api_hit anda kurang!")
    }
    if(!location){
        return res.status(400).send("Lokasi harus diisi!")
    }
    let apikey = 'f81204eae6f3825056abf4b239de46ad';
    const result_weather = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apikey}`);
    let latitude = result_weather.data.coord.lat;
    let longitude = result_weather.data.coord.lon;
    const result_alerts = await axios.get(`https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=current,minutely,hourly,daily&appid=${apikey}`);
    await db.executeQuery(conn,`update user set api_hit = ${users[0].api_hit-1} where email='${user_logon.email}'`);
    return res.status(200).send(result_alerts.data);
});