const bodyParser = require("body-parser");
const express = require("express");
const ejs = require("ejs");
const { urlencoded } = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// const { stringify } = require("querystring");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds =10;

const  GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app = express();
// var encrypt = require('mongoose-encryption');

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "IamKousik",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId : String,
  secret: String
});
// var secret = "This is a secret";  //put this in env variable for security purpose
// userSchema.plugin(encrypt, { secret: secret,  encryptedFields: ["password"] });

userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
  clientID:     process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRETS,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  
  userProfileURL : "http://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, done) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return done(err, user);
  });
}
));



app.get("/", (req, res) => {
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));
 


app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));





app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register")
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );

  // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  //     const NewUser=new User({
  //         email:req.body.username,
  //         password:hash
  //      //    password:md5(req.body.password)
  //      });

  //      NewUser.save(function (err) {
  //          if(err){
  //              console.log(err);
  //          }
  //          else{
  //              res.render("secrets");
  //          }
  //      })
  // });
});

app.post("/login", (req, res) => {

const user=new User({
    username : req.body.username,
    password: req.body.password 
})



app.get("/submit", function(req, res){
  if(req.isAuthenticated()){
    res.render("submit");
  } else { 
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

req.login(user,function (err) {
    if (err) {
        console.log(err);
    } else {
        passport.authenticate('local')(req,res,function() {
            res.redirect("/secrets");
        })
       
    }
})






  //    const username = req.body.username;
  // //    const password=md5(req.body.password);
  //    const password=(req.body.password);
  // User.findOne({email:username},function (err,founduser) {
  //     if(err){
  //         console.log(err);
  //     }
  //     if(founduser){
  //         bcrypt.compare(password, founduser.password, function(err, result) {
  //             if(result === true){
  //                 res.render("secrets");
  //             }
  //         });
  //         // if(founduser.password===password){
  //         //     res.render("secrets");
  //         // }
  //     }
  // })
});



app.get('/logout' , (req , res)=>{

   req.logout();
   res.redirect("/");

})









app.listen(3000, () => {
  console.log("Server is up");
});
