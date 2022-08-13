//Contains APIs related to listing and submitting coding problems on front end

const express = require('express');
let router = express.Router();
const fs = require('fs');
const request = require('request');
const mysqlConnection = require('../db_connection');
var constants = require('../constants');
const languagesTable = constants.languagesTable;

//API returns the list of all available coding problems,
//along with an indicator of whether current user has solved the problem
router.get('/listproblems/:email', function(req,res){
  mysqlConnection.query(`select * from Problem`, function(err,result){
    if(err){
      console.log(err);
    }
    else{
      var email = req.params.email;
      console.log(`select * from problem_user_mapping where email="${email}"`);
      mysqlConnection.query(`select * from problem_user_mapping where email="${email}"`, function(err,mapping){
          if(err){
            console.log(err);
          }
          else{
            for (var i = 0; i < result.length; i++) {
              result[i].solved=0;
            }
            for (var i = 0; i < mapping.length; i++) {
              for (var j = 0; j < result.length; j++) {
                if(result[j].problem_id == mapping[i].problem_id){
                  result[j].solved = 1;
                  break;
                }
              }
            }
            var marks_scored=0;
            for (var i = 0; i < result.length; i++) {
              if(result[i].solved == 1){
                console.log(result[i].max_score);
                marks_scored+=result[i].max_score;
              }
            }
            console.log(result);
            return res.status(200).send({"problems": result, "score": marks_scored});
          }
      });
    }
  });
});

//API returns the description of a specific problem
router.get('/problem_data/:problem_id', function(req,res){
  var problem_id = req.params.problem_id;
  mysqlConnection.query(`select * from Problem where problem_id=${problem_id}`, function(err, result){
    if(err){
      console.log(err);
    }
    else{
      var path = "./problem_description/"+result[0].description;
      fs.readFile(path,'utf8',function(err,data){
        result[0].description = data;
        console.log(data);
        return res.status(200).send(result);
      });
    }
  });
})

//Post API called when the user executes his/her program on custom input
router.post('/run', function(req,res){
  console.log("Run Called");
  const JDOODLE_ENDPOINT = constants.JDOODLE_ENDPOINT;
  const body = req.body;
  try{
    var entry = {};
    for(var languageEntry in languagesTable){
      if(languageEntry.version == body.version && languageEntry.lang == body.lang){
        entry = languageEntry;
        break;
      }
    }
    const index = entry['index'];
    //Request body
    const runRequestBody = {
        script : body.program,
        language: body.lang,
        versionIndex: index,
        clientId: constants.clientId,
        clientSecret: constants.clientSecret,
        stdin: body.input
    };

    request.post({
        url: JDOODLE_ENDPOINT,
        json: runRequestBody
    },
    function(error, response, body){
      console.log("Error", error);
      JSON.stringify(body);
      console.log("Body", body);
      return res.status(200).json(body);
    });

  }
  catch(error){
    console.log('request fail');
    return res.status(400).send('request fail');
  }
});

//Post API called when user submits his/her code
//The code is executed against all of the available test cases for the problem
router.post('/submit', function(req,res){
  const JDOODLE_ENDPOINT = constants.JDOODLE_ENDPOINT;
  const body = req.body;
  try{
    var entry = {};

    for(var languageEntry in languagesTable){
      if(languageEntry.version == body.version && languageEntry.lang == body.lang){
        entry = languageEntry;
        break;
      }
    }
    var problem_id = body.problem_id;
    const email = body.email;
    const index = entry['index'];
    mysqlConnection.query(`select * from Problem where problem_id=${problem_id}`, function(err, result){
      if(err){
        console.log(err);
      }
      else{
        var input_path = "./problem_input/"+result[0].input;
        fs.readFile(input_path,'utf8',function(err,data){
          if(err){
            console.log(err);
          }
          else{
            const runRequestBody = {
                script : body.program,
                language: body.lang,
                versionIndex: index,
                clientId: constants.clientId,
                clientSecret: constants.clientSecret,
                stdin: data
            };

            request.post({
                url: JDOODLE_ENDPOINT,
                json: runRequestBody
            },
            function(error, response, body){
              console.log("Error", error);
              JSON.stringify(body);
              console.log("Body", body);
              var output_path = "./problem_output/"+result[0].output;
              fs.readFile(output_path,'utf8',function(err,data){
                if(err){
                  console.log(err);
                }
                else{
                  if(body.output==data){
                    mysqlConnection.query(`select * from problem_user_mapping where email="${email}" and problem_id=${problem_id}`, function(err, result){
                      if(err){
                        console.log(err);
                        return res.status(400).send('Error Occurred');
                      }
                      else if(result.length==0){
                        mysqlConnection.query(`insert into problem_user_mapping values("${email}",${problem_id})`, function(err, result){
                          if(err){
                            console.log(err);
                            return res.status(400).send('Error Occurred');
                          }
                          else{
                            return res.status(200).send({"solved":1});
                          }
                        });
                      }
                      else{
                        return res.status(200).send({"solved":1});
                      }
                    });
                  }
                  else{
                    return res.status(200).send({"solved":0});
                  }
                }
              });
            });
          }
        });
      }
    });

  }
  catch(error){
    console.log('request fail');
    return res.status(400).send('request fail');
  }
});

module.exports = router;
