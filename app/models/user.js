var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

  initialize: function() {
    this.on('creating', this.hashPassword);
  },

  comparePassword: function(password, callback) {
    bcrypt.compare(password, this.get('password'), function(err, result) {
      callback(result);
    });
  },

  hashPassword: function() {
    var promiseHasher = Promise.promisify(bcrypt.hash);

    return promiseHasher(this.get('password'), null, null)
      .bind(this)
      .then(function(hash) {
        this.set('password', hash);
      });
  }
});

module.exports = User;
