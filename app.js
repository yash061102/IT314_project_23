const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const port = process.env.port || 9000
const app = express();

app.get('/',(err,res)=>{
    res.send("hh")
})
app.listen(port)

