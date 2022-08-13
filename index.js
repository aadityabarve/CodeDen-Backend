const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const app = express()
const mysqlConnection = require('./db_connection');
const langs = require("./routes/languages");
const authentication = require("./routes/authentication");
const codingproblems = require("./routes/codingproblems");
const quizzes = require("./routes/quizzes");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//API Routes
app.use('/langs', langs);
app.use('/authentication', authentication);
app.use('/problems', codingproblems);
app.use('/quizzes', quizzes);

const port = process.env.PORT || 3000;
app.listen(port, function(err){
    console.log("Server listening on Port", port);
});
