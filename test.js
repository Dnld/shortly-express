var bcrypt = require('bcrypt-nodejs');

var hashB = bcrypt.hashSync('cheezits', null, null);

bcrypt.compare('cheezits', hashB, function(err, result) {
  if (err) {
    console.log(err);
  }
  if (result) {
    console.log('success');
  } else {
    console.log('whyyyyyy');
  }
});