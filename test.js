var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var bcrypt = require('bcrypt-nodejs');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:4568/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


function checkUser(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

app.get('/auth/github/callback',
passport.authenticate('github', { failureRedirect: '/login' }),
function(req, res) {
  res.redirect('/');
});

app.get('/', checkUser, function(req, res) {
  res.render('index', { user: req.user });
});

app.get('/login',
function(req, res) {
  if (req.isAuthenticated) {
    res.redirect('/');
  } else {
    res.render('login');
  }
});

// app.post('/login',
// function(req, res) {
//   var username = req.body.username;
//   var password = req.body.password;
//   new User({ username: username })
//     .fetch()
//     .then(function(found) {
//       if (found) {
//         bcrypt.compare(password, found.get('password'), function(err, result) {
//           if (result) {
//             req.session.loggedIn = true;
//             req.session.username = username;
//             res.redirect('/');
//           } else {
//             res.redirect('/login');
//           }
//         });
//       } else {
//         res.redirect('/login');
//       }
//   });
// });

app.get('/signup',
function(req, res) {
  if (req.isAuthenticated) {
    res.redirect('/');
  } else {
    res.render('signup');
  }
});

app.post('/signup',
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var user = new User({
    username: username,
    password: password
  });

  user.save().then(function(newUser) {
    req.session.loggedIn = true;
    req.session.username = username;
    Users.add(newUser);
    res.redirect('/');
  });
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/create',
function(req, res) {
  checkUser(req, res, function() {
    res.render('index');
  });
});

app.get('/links',
function(req, res) {
  checkUser(req, res, function() {
    var username = req.session.username;
    Links.reset().query({where: {'username': username}}).fetch().then(function(links) {
      res.send(200, links.models);
    });
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var username = req.session.username;
        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin,
          username: username
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);




