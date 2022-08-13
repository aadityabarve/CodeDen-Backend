//Contains APIs for user authentication and sign up

const express = require('express');
const router = express.Router();
const mysqlConnection = require('../db_connection');

//Post request for user signup
router.post('/signup', function(req,res){
  mysqlConnection.query(`select * from User where email = "${req.body.email}"`, function(err,result){
    if(err){
      console.log(err);
      return res.status(400).send('Error Occurred');
    }
    else{
      if(result.length != 0){
        console.log(result);
        return res.status(200).send({"message": "User already registered", "valid": 0});
      }
      else{
        var username = req.body.email.substr(0,req.body.email.indexOf('@'));
        mysqlConnection.query(`insert into User values("${req.body.email}","${req.body.phone}","${req.body.password}","${username}")`, function(err,result){
          if(err){
            console.log(err);
            return res.status(400).send('Error Occurred');
          }
          else{
            return res.status(200).send({"message": "User signed up successfully", "valid": 1});
          }
        });
      }
    }
  });
});

//Post request for user login
router.post('/login', function(req,res){
  console.log(req.body.email);
  console.log(req.body.password);
  console.log(`select * from User where email = "${req.body.email}" and password = "${req.body.password}"`);
  mysqlConnection.query(`select * from User where email = "${req.body.email}" and password = "${req.body.password}"`, function(err,result){
    if(err){
      console.log(err);
      return res.status(400).send('Error');
    }
    else {
      console.log(result);
      if(result.length == 0){
        return res.status(200).send({"valid": 0});
      }
      else{
        return res.status(200).send({"valid": 1});
      }
    }
  });
});

module.exports = router
