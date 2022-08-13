//Contains API for returning the list of available programming languages

const express = require('express');
let router = express.Router();
var constants = require('../constants');

const languagesTable = constants.languagesTable;

router.get('/', function(req,res){
  console.log("Langs called");
  return res.status(200).send({langs: languagesTable});
});

module.exports = router;
