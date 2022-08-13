//Contains APIs related to listing and submitting quizzes

const express = require('express');
let router = express.Router();
const mysqlConnection = require('../db_connection');

//API returns the list of all available quizzes,
//along with user's score in each of them
router.get('/listquizzes/:email', function(req,res){
  mysqlConnection.query(`select * from quiz`, function(err,result){
    if(err){
      console.log(err);
    }
    else{
      var email = req.params.email;
      console.log(`select * from quiz_user_mapping where user_email="${email}"`);
      mysqlConnection.query(`select * from quiz_user_mapping where user_email="${email}"`, function(err,mapping){
          if(err){
            console.log(err);
          }
          else{
            for (var i = 0; i < result.length; i++) {
              result[i].solved=0;
            }
            var marks_scored=0;
            for (var i = 0; i < mapping.length; i++) {
              for (var j = 0; j < result.length; j++) {
                if(result[j].id == mapping[i].quiz_id){
                  result[j].solved = 1;
                  marks_scored+=mapping[i].score;
                  break;
                }
              }
            }
            console.log(result);
            return res.status(200).send({"quizzes": result, "score": marks_scored});
          }
      });
    }
  });
});

//API for fetching all the questions and their options in a specific quiz
router.get('/quiz_data/:quiz_id', function(req,res){
  var quiz_id = req.params.quiz_id;
  mysqlConnection.query(`select * from quiz_question where quiz_id=${quiz_id}`, function(err, result){
    if(err){
      console.log(err);
    }
    else{
      mysqlConnection.query(`select * from quiz where id=${quiz_id}`, function(err, quiz){
        if(err){
          console.log(err);
        }
        else {
          return res.status(200).send({"quiz_questions": result, "quiz": quiz});
        }
      });
    }
  });
})

//Post API called when user submits a quiz after attempting it
router.post('/submit-quiz', function(req,res){
  const email = req.body.email;
  const quiz_id = req.body.quiz_id;
  const answers = req.body.answers;
  console.log(answers);
  mysqlConnection.query(`select * from quiz_question where quiz_id=${quiz_id}`, function(err, result){
    if(err){
      console.log(err);
    }
    else {
      var score=0;
      for(var i=0;i<result.length;i++){
        if(result[i].correct_option == answers[i]){
          score+=10;
        }
      }
      mysqlConnection.query(`select * from quiz_user_mapping where user_email='${email}' and quiz_id=${quiz_id}`, function(err, mapping){
        if(err){
          console.log(err);
        }
        else{
          if(mapping.length==0){
            mysqlConnection.query(`insert into quiz_user_mapping values('${email}',${quiz_id},${score})`, function(err, r){
              if(err){
                console.log(err);
              }
              else{
                res.status(200).send({"score": score});
              }
            });
          }
          else if(mapping[0].score<score){
            mysqlConnection.query(`update quiz_user_mapping set score=${score} where user_email='${email}' and quiz_id=${quiz_id}`, function(err, r){
              if(err){
                console.log(err);
              }
              else{
                res.status(200).send({"score": score});
              }
            });
          }
          else {
            res.status(200).send({"score": mapping[0].score});
          }
        }
      });
    }
  });
})

module.exports = router;
