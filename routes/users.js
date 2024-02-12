const express = require('express');
const users = express.Router();
const { getDb } = require('../conn');
const { registerNewUser, findUserByToken, generateToken } = require('../helpers');
const bcrypt = require('bcrypt');

users.route('/users').get((req, res) => {
  getDb().collection('users').find().toArray()
    .then(result => {
      res.json(result).sendStatus(200);
    })
    .catch(err => {
      res.json({
        success: false
      })
    })
})

users.route('/users/register').post((req, res) => {
  const user = req.body;

  registerNewUser(user, res)
    .catch(err => {
      throw err;
    })
});

users.route('/users/login').post((req, res) => {
  let token = req.cookies.auth;

  // checked if already signed in
  findUserByToken(token, (err, user) => {
    if (err) return res.json(err);
    if (user) return res.status(400).json({ error: true, message: 'You are already logged in' });

    // find user by email
    getDb().collection('users').findOne({ 'email': req.body.email }).then(user => {
      if (!user) return res.json({ isAuth: false, message: 'Email does not exist' });

      bcrypt.compare(req.body.password, user.password)
        .then(isMatch => {
          if (!isMatch) return res.status(400).json({
            isAuth: false,
            message: "User ID or password is incorrect"
          });

          // generate token
          generateToken(user, res);
        })
    })
  })
})

users.route('/users/auth').post((req, res) => {
  let token = req.cookies.auth;

  findUserByToken(token, (err, user) => {
    if (err) return res(err);
    if (!user) return res.status(401).json({ isAuth: false, message: 'Unauthorized' });

    return res.status(200).json({ isAuth: true, message: 'success' });
  })
})

users.route('/users/logout').get((req, res) => {
  let token = req.cookies.auth;
  findUserByToken(token, (err, driver) => {
    if (err) throw err;
    if (!driver) return res.status(400).json({ error: true });

    getDb().collection('logged_in_users').deleteOne({ token: token })
      .then(() => {
        res.cookie('auth', '', { expires: new Date(0) }).sendStatus(200);
      })
      .catch(err => { res.sendStatus(400).json(err); })
  })
})

module.exports = users;