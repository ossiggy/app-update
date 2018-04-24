'use strict';

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const config = require('../config');

const createAuthToken = user => {
  return jwt.sign({user}, config.JWT_SECRET, {
    subject: user.username,
    expiresIn: config.JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const router = express.Router();

const localAuth = passport.authenticate('local', {session: false});
router.use(bodyParser.json());
router.post('/login', localAuth, (req, res) => {
    const authToken = createAuthToken(req.user.apiRepr());
    const {id, username} = req.user.apiRepr();
    
    res.cookie('userId', id);
    res.cookie('authToken', authToken);
    res.cookie('username', username);
    
    res.json({username, id});
  }
);

router.post(
  '/refresh',
  passport.authenticate('jwt', {session: false}),
  (req, res) => {
    const authToken = createAuthToken(req.user);
    res.json({authToken});
  }
);

router.get('/logout', (req, res) => {
  res.clearCookie('userId');
  res.clearCookie('authToken');
  res.clearCookie('username');
  res.send();
})

module.exports = {router};