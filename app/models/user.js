var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

  initialize: function(params) {
    this.set('username', params.username);
    bcrypt.hash(params.password, null, null, function(err, hash) {
      if (err) {
        console.log(err);
      } else {
        this.set('password', hash);
      }
    }.bind(this));
  },
});

module.exports = User;