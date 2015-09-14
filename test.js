

// function restrict(req, res, next) {
//   if (req.session.user) {
//     next();
//   } else {
//     req.session.error = 'Access denied!';
//     res.redirect('/login');
//   }
// }



app.get('/login',
function(req, res) {
  if (loggedIn) {
    res.redirect('/');
  } else {
    res.render('/login');
  }
});

app.post('/login',
function(req, res) {
  var user = req.body.username;
  var pass = req.body.password;
  new User({ username: user, password: pass })
    .fetch()
    .then(function(found) {
      if (found) {
        req.session.loggedIn = true;
        res.redirect('/');
        // user is logged in
        // redirect to '/'
      } else {
        res.redirect('/');
        // redirect to '/login'
      }
  });
});