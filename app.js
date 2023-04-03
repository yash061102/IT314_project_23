const express = require('express');
const bodyparser = require('body-parser');
const app = express();


app.set('view engine', 'ejs');//for ejs 

app.use(express.static("public"));//look static file in public folder
app.get('/', function (req, res) {
    let mydate = new Date();
    let hr = mydate.getHours();
    let greeting;
    if (hr < 12)
        greeting = 'Good Morning';
    else if (hr >= 12 && hr <= 17)
        greeting = 'Good Afternoon';
    else if (hr >= 17 && hr <= 24)
        greeting = 'Good Evening';
    res.render('adminhome',{greet:greeting});
})
app.listen(3000, function (req, res) {
    console.log("Server is running on port number 3000");
});