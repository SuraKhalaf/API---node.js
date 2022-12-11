const express = require ('express');
const mysql = require('mysql');
const app = express(); // to initialize express
const jwt = require("jsonwebtoken");
app.use(express.json()); ////This middleware will allow us to pull req.body.<params>
require("dotenv").config();
require("crypto").randomBytes(64).toString("hex"); //This will generate a RANDOM string

//create connection database 
const db = mysql.createConnection({
    host : "localhost",
    user : "root",
    password : "",
    database : "tweet_app",
});


// connect database 
db.connect((err)=>{
    if (err){
        throw err;
    }
    // if there is no error --> 
    console.log("Connection Done!");
}); 


// Sign up 
app.post("/adduser", (req,res)=>{
const ID = req.body.ID;
const Username = req.body.Username;
const FullName = req.body.FullName;
const Birthday = req.body.Birthday;
const Password = req.body.Password;
const Address = req.body.Address;

// check if the user exist 
db.query('SELECT Username FROM users WHERE Username = ?', [Username], (err, result) =>  {
    if (err){
        console.log("Error !!");
    }
    // if there is no error --> 
   else if( result.length > 0 ) {
       
            res.send('This username is already exist');
            console.log("This username is already exist");
    }
    else {
    
        db.query("insert into users values (?,?,?,?,?,?)",[ID,Username,FullName,Birthday,Password,Address],(err,result)=> {
            if (err){
                console.log("Error !!");
            }
            // if there is no error --> 
            console.log("Result");
            res.send("Add to users");
        });
    
    }
});


});


// accessTokens
function generateAccessToken(user) 
{
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m"}) 
}

    // refreshTokens
let refreshTokens = []
function generateRefreshToken(user) 
{
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "20m"})
    refreshTokens.push(refreshToken)
    return refreshToken
}

//Login 
app.post("/loginUser", (req,res)=>{
    const Username = req.body.Username;
    const Password = req.body.Password;

    //AUTHENTICATE LOGIN AND RETURN JWT TOKEN

    db.query('SELECT * FROM users WHERE Username = ? and password = ?', [Username, Password], async (err, result) =>  {
        if (err){
            console.log("Error !!");
        }
        if (result.length > 0) {
        
            const accessToken = generateAccessToken ({user: req.body.Username})
            const refreshToken = generateRefreshToken ({user: req.body.Username})
            res.json ({accessToken: accessToken, refreshToken: refreshToken})
        
          //  res.send('Welcome to Home page');
          //  console.log("Welcome to Home page");
        } else {
            res.send('Incorrect Username and/or Password!');
        }			
    });
    });


//REFRESH TOKEN API
app.post("/refreshToken", (req,res) => {
   
    refreshTokens = refreshTokens.filter( (c) => c != req.body.token)
    //remove the old refreshToken from the refreshTokens list
    const accessToken = generateAccessToken ({user: req.body.Username})
    const refreshToken = generateRefreshToken ({user: req.body.Username})
    //generate new accessToken and refreshTokens
    res.json ({accessToken: accessToken, refreshToken: refreshToken})
    });


//retire refresh tokens on logout
app.delete("/logout", (req,res)=>{
    refreshTokens = refreshTokens.filter( (c) => c != req.body.token)
    //remove the old refreshToken from the refreshTokens list
    res.status(204).send("Logged out!")
    })


// Add new tweet
app.post("/addTweet", (req,res)=>{
    const ID = req.body.ID;
    const UserId = req.body.UserId;
    const Description = req.body.Description;
    const Hashtag = req.body.Hashtag;
    const Date = req.body.Date;
    
   
            db.query("insert into tweets values (?,?,?,?,?)",[ID,UserId,Description,Hashtag,Date],(err,result)=> {
                if (err){
                    console.log("Error !!");
                }
                // if there is no error --> 
                console.log("Add to tweets");
                res.send("Add to tweets");
            });      
    });
    

// Delete a tweet 
app.post("/deleteTweet", (req,res)=>{
    const ID = req.body.ID;
    
            db.query("DELETE FROM tweets WHERE ID = ?",[ID],(err,result)=> {
                if (err){
                    console.log("Error !!");
                }
                // if there is no error --> 
                console.log("Tweet has Deleted");
                res.send("Tweet has Deleted");
            });      
    });
 

//Edit a tweet
app.post("/editTweet", (req,res)=>{
    const ID = req.body.ID;
    const Description = req.body.Description;
            db.query("UPDATE tweets SET Description= ? WHERE ID = ?",[Description,ID],(err,result)=> {
                if (err){
                    console.log("Error !!");
                }
                // if there is no error --> 
                console.log("Tweet has Edited");
                res.send("Tweet has Edited");
            });      
    });


//Retrieve all tweets (use paging) 
app.post("/RetrieveTweet/:lastID", (req,res)=>{
    const lastID = parseInt(req.params.lastID);
    const ID = req.body.ID;
    const Description = req.body.Description;
            db.query("SELECT * FROM tweets LIMIT ? , 3 " ,[lastID],(err,result)=> {
                if (err){
                    console.log("Error !!");
                }
                // if there is no error --> 
                console.log(result);
                res.send(result);
                
            });      
    });


// Retrieve specific user tweets
app.post("/RetrieveUser", (req,res)=>{
    const UserId = req.body.UserId;
            db.query("select * from tweets Where UserId = ?",[UserId],(err,result)=> {
                if (err){
                    console.log("Error !!");
                }
                // if there is no error --> 
                console.log(result);
                res.send(result);
            });      
    });


//Retrieve user info
app.post("/RetrieveUserInfo", (req,res)=>{
    const ID = req.body.ID;
            db.query("select ID,Username,FullName,Birthday,Address from users Where ID = ?",[ID],(err,result)=> {
                if (err){
                    console.log("Error !!");
                }
                // if there is no error --> 
                console.log(result);
                res.send(result);
            });      
    });


//Edit my own info
app.post("/editMyInfo", (req,res)=> {
    const ID = req.body.ID;
    const FullName = req.body.FullName;
    const Birthday = req.body.Birthday;
    const Address = req.body.Address;

    const Username = req.body.Username;
    const Password = req.body.Password;

    //AUTHENTICATE LOGIN AND RETURN JWT TOKEN

    db.query('SELECT * FROM users WHERE Username = ? and password = ?', [Username, Password], async (err, result) =>  {
        if (err){
            console.log("Error !!");
        }
        if (result.length > 0) {
        
            const accessToken = generateAccessToken ({user: req.body.Username})
            const refreshToken = generateRefreshToken ({user: req.body.Username})
            res.json ({accessToken: accessToken, refreshToken: refreshToken})

            db.query("UPDATE users SET FullName = ?,Birthday = ?, Address =? WHERE ID = ?",[FullName,Birthday,Address,ID],(err,result)=> {
                if (err){
                    console.log("Error !!");
                }
                // if there is no error --> 
                console.log("Your information has Edited");
                res.send("information has Edited");
            });      
        
          //  res.send('Welcome to Home page');
          //  console.log("Welcome to Home page");
        } else {
            res.send('Incorrect Username and/or Password!');
        }			
    });
});
//Change password
app.post("/changePass", (req,res)=>{
    const ID = req.body.ID;
    const Password = req.body.Password;
    const Username = req.body.Username;

    //AUTHENTICATE LOGIN AND RETURN JWT TOKEN

    db.query('SELECT * FROM users WHERE Username = ? and password = ?', [Username, Password], async (err, result) =>  {
        if (err){
            console.log("Error !!");
        }
        if (result.length > 0) {
        
            const accessToken = generateAccessToken ({user: req.body.Username})
            const refreshToken = generateRefreshToken ({user: req.body.Username})
            res.json ({accessToken: accessToken, refreshToken: refreshToken})


            db.query("UPDATE users SET Password= ? WHERE ID = ?",[Password,ID],(err,result)=> {
                if (err){
                    console.log("Error !!");
                }
                // if there is no error --> 
                console.log("Password changed");
                res.send("Password changed");
            });
        
          //  res.send('Welcome to Home page');
          //  console.log("Welcome to Home page");
        } else {
            res.send('Incorrect Username and/or Password!');
        }			
    });

    

                  
    });


// Follow a user
app.post("/followUser", (req,res)=>{
    const ID = req.body.ID;
    const FollowedId = req.body.FollowedId;
    const FollowerId = req.body.FollowerId;
    
   
            db.query("insert into followers values (?,?,?)",[ID,FollowedId,FollowerId],(err,result)=> {
                if (err){
                    console.log("Error !!");
                    res.send("Error !!");
                }
                
                // if there is no error --> 
                console.log("Add to followers");
                res.send("Add to followers");
                           });      
    });


// Unfollow a user
app.post("/unfollowUser", (req,res)=>{
    const FollowedId = req.body.FollowedId;
    
            db.query("DELETE FROM followers WHERE FollowedId = ?",[FollowedId],(err,result)=> {
                if (err){
                    console.log("Error !!");
                    res.send("Error !!");
                }
                // if there is no error --> 
                console.log("Unfoolow");
                res.send("Unfoolow");
            });      
    });

// Retrieve followed user’s tweets 
app.post("/RetrieveFollowedUser", (req,res)=>{
    const FollowedId = req.body.FollowedId;
            db.query("SELECT Description from tweets,followers WHERE FollowedId = ?",[FollowedId],(err,result)=> {
                if (err){
                    console.log("Error !!");
                    res.send("Error !!");
                }
                // if there is no error --> 
                console.log(result);
                res.send(result);
            });      
    });


//Add tweet to a saved list
app.post("/addToSavedList", (req,res)=>{
    const ID = req.body.ID;
    const TweetId = req.body.TweetId;
    const UserId = req.body.UserId;
    
   
            db.query("insert into saved_tweets values (?,?,?)",[ID,TweetId,UserId],(err,result)=> {
                if (err){
                    console.log("Error !!");
                    res.send("Error !!");
                }
                
                // if there is no error --> 
                console.log("Add to Saved Tweet");
                res.send("Add to Saved Tweet");
                           });      
    });


//Delete tweet from the saved list.
app.post("/deleteSavedTweet", (req,res)=>{
    const TweetId = req.body.TweetId;
    
            db.query("DELETE FROM saved_tweets WHERE TweetId = ?",[TweetId],(err,result)=> {
                if (err){
                    console.log("Error !!");
                    res.send("Error !!");
                }
                // if there is no error --> 
                console.log("Delete from Saved Tweet");
                res.send("Delete from Saved Tweet");
            });      
    });

//Retrieve the saved tweets (using Paging)
app.post("/RetrieveSavedTweet/:lastID", (req,res)=>{
    const lastID = parseInt(req.params.lastID)
    const UserId = req.body.UserId;
            db.query("select Description from tweets,saved_tweets Where saved_tweets.UserId = ? and tweets.ID = saved_tweets.TweetId LIMIT ? , 5",[UserId,lastID],(err,result)=> {
                if (err){
                    console.log("Error !!");
                }
                // if there is no error --> 
                console.log(result);
                res.send(result);
            });      
    });


//Hide tweet
app.post("/hideTweet", (req,res)=>{
    const ID = req.body.ID;
    const TweetId = req.body.TweetId;
    const UserId = req.body.UserId;
    
   
            db.query("insert into hidden_tweets values (?,?,?)",[ID,TweetId,UserId],(err,result)=> {
                if (err){
                    console.log("Error !!");
                    res.send("Error !!");
                }
                
                // if there is no error --> 
                console.log("Add to Hidden Tweet");
                res.send("Add to Hidden Tweet");


               
                           });      
    });


//Unhide tweet
app.post("/unHideTweet", (req,res)=>{
    const TweetId = req.body.TweetId;
                db.query("DELETE FROM hidden_tweets WHERE TweetId = ?",[TweetId],(err,result)=> {
                    if (err){
                        console.log("Error !!");
                        res.send("Error !!");
                    }
                    // if there is no error --> 
                    console.log("Delete Hidden Tweet");
                    res.send("Delete Hidden Tweet");
                });      
                               
    });


//Comment on a tweet 
app.post("/comment", (req,res)=>{
    const ID = req.body.ID;
    const TweetId = req.body.TweetId;
    const UserId = req.body.UserId;
    const Description = req.body.Description;
    const Date = req.body.Date;
    
   
            db.query("insert into comments values (?,?,?,?,?)",[ID,UserId,Description,TweetId,Date],(err,result)=> {
                if (err){
                    console.log("Error !!");
                    res.send("Error !!");
                }
                
                // if there is no error --> 
                console.log("Commented on a Tweet");
                res.send("Commented on a Tweet");


               
                           });      
    });


//Retrieve tweet comments (use paging)
app.post("/RetrieveTweetComments/:lastID", (req,res)=>{
    const lastID = parseInt(req.params.lastID);
    const TweetId = req.body.TweetId;
            db.query("select comments.Description from comments,tweets Where comments.TweetId = ? and tweets.ID = comments.TweetId LIMIT ? ,5",[lastID],[TweetId],(err,result)=> {
                if (err){
                    console.log("Error !!");
                }
                // if there is no error --> 
                console.log(result);
                res.send(result);
            });      
    });


//Delete a tweet comment
app.post("/deleteComment", (req,res)=>{
    const ID = req.body.ID;
                db.query("DELETE FROM comments WHERE TweetId = ?",[ID],(err,result)=> {
                    if (err){
                        console.log("Error !!");
                        res.send("Error !!");
                    }
                    // if there is no error --> 
                    console.log("Comment deleted");
                    res.send("Comment deleted");
                });      
                               
    });


//Like a tweet 
app.post("/likeTweet", (req,res)=>{
    const ID = req.body.ID;
    const TweetId = req.body.TweetId;
    const UserId = req.body.UserId;
    
   
            db.query("insert into likes values (?,?,?)",[ID,UserId,TweetId],(err,result)=> {
                if (err){
                    console.log("Error !!");
                    res.send("Error !!");
                }
                
                // if there is no error --> 
                console.log("Like a Tweet");
                res.send("Like a Tweet");


               
                           });      
    });


//Retrieve tweet likes (use paging)
app.post("/RetrieveTweetLikes/:lastID", (req,res)=>{
    const lastID = parseInt(req.params.lastID);
    const TweetId = req.body.TweetId;
            db.query("select Likes.ID from tweets,Likes Where Likes.TweetId = ? and tweets.ID = Likes.TweetId LIMIT ? , 5",[TweetId,lastID],(err,result)=> {
                if (err){
                    console.log("Error !!");
                }
                // if there is no error --> 
                console.log(result);
                res.send(result);
            });      
    });


//Unlike a tweet 
app.post("/unlikeTweet", (req,res)=>{
    const TweetId = req.body.TweetId;
                db.query("DELETE FROM likes WHERE TweetId = ?",[TweetId],(err,result)=> {
                    if (err){
                        console.log("Error !!");
                        res.send("Error !!");
                    }
                    // if there is no error --> 
                    console.log("Like deleted");
                    res.send("Like deleted");
                });      
                               
    });


//Retrieve tweet likes count
app.post("/RetrieveCountLikes", (req,res)=>{
    const TweetId = req.body.TweetId;
            db.query("select COUNT(Likes.ID) from tweets,Likes Where Likes.TweetId = ? and tweets.ID = Likes.TweetId",[TweetId],(err,result)=> {
                if (err){
                    console.log("Error !!");
                }
                // if there is no error --> 
                console.log(result);
                res.send(result);
            });      
    });
app.listen('3000' , (err) => {
    if (err){
        throw err;
    }
    console.log('Server is Running');
}) 
