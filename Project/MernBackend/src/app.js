const express = require("express");
const path = require("path");
const app = express();
const ejs = require("ejs");

require("./db/conn");

const port = process.env.port || 3000;

const static_path = path.join(__dirname , "../public");
const templates_path = path.join(__dirname , "../templates/views");
const partials_path = path.join(__dirname , "../templates/partials");

app.use(express.static(static_path))
app.set("view engine", "ejs");
app.set("views", templates_path);
// hbs.registerPartials(partials_path);

app.get("/", (req, res) => {
    //res.send("Hello and welcome to my page")
    res.render("index")
});

// app.get("/login", (req, res) => {
//     //res.send("Hello and welcome to my page")
//     res.render("login")
// });

// app.get("/tables", (req, res) => {
//     //res.send("Hello and welcome to my page")
//     res.render("tables")
// });

app.listen(port, () => {
    console.log(`Command is running at port no ${port}`);
})

