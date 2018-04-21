'use strict';

const bodyParser = require('body-parser');

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();

const {router: usersRouter} = require('./server/users');
const {router: budgetRouter} = require('./server/budgets');
const {router: authRouter, localStrategy, jwtStrategy} = require('./server/auth');

const {DATABASE_URL, PORT} = require('./server/config');

const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public', 'index.html'));
});

app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});

mongoose.Promise=global.Promise;

app.use(passport.initialize());
passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);
app.use('/api/budgets/', budgetRouter);

app.get(
  '/api/protected',
  passport.authenticate('jwt', {session: false}),
  (req, res) => {
    return res.json({
      data: 'data here'
    });
  }
);

app.get('/budget', (req, res) => {
  res.sendFile('index.html', {root: __dirname + '/public'});
});

app.use('*', function(req, res){
  res.status(404).json({message: 'Not found'});
});

let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err =>{
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if(err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if(require.main === module){
  runServer().catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};