const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const port = process.env.port || 9000
const app = express();


app.set('view engine', 'ejs');//for ejs 

app.use(express.static("public"));//look static file in public folder

app.get('/', function(req, res) {
    res.render('index', { });
});
app.get('/Studentlogin', function(req, res) {
    res.render('Studentlogin', { });
});
app.get('/Adminlogin', function(req, res) {
    res.render('Adminlogin', { });
});
app.get('/Facultylogin', function(req, res) {
    res.render('Facultylogin', { });
});
app.get('/support', function(req, res) {
    res.render('support', { });
});
app.listen(3000, function (req, res) {
    console.log("Server is running on port number 3000");
});
app.get('/studentdash', function(req, res) {
    res.render('Studentdashboard', { });
});