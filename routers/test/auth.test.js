'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const {TEST_DATABASE_URL, JWT_SECRET} = require('../config');
const {dbConnect, dbDisconnect} = require('../db-mongoose');
const {app, runServer, closeServer} = require('../../server');
const {User} = require('../users');

process.env.NODE_ENV = 'test';

// Clear the console before each run
process.stdout.write('\x1Bc\n');

const expect = chai.expect;
const should = chai.should;

chai.use(chaiHttp);

describe('Auth endpoints', () => {
  const username = 'exampleUser';
  const password = 'examplePass';
  const email = 'email@email.com';
  let _id;

  before(() => {
      return runServer();
  });

  after(() => {
      return closeServer();
  });

  beforeEach(() => {
      return User.hashPassword(password).then(password =>
          User.create({
              username,
              password,
              email
          })
      ).then((user) => _id = user.id);
  });

  afterEach(() => {
      return User.remove({});
  });

  describe('/api/auth/login', () => {
      it('Should reject requests with no credentials', () => {
          return chai
              .request(app)
              .post('/api/auth/login')
              .then(() =>
                  expect.fail(null, null, 'Request should not succeed')
              )
              .catch(err => {
                  if (err instanceof chai.AssertionError) {
                      throw err;
                  }

                  const res = err.response;
                  expect(res).to.have.status(400);
              });
      });
      it('Should reject requests with incorrect usernames', () => {
          return chai
              .request(app)
              .post('/api/auth/login')
              .auth('wrongUsername', password)
              .then(() =>
                  expect.fail(null, null, 'Request should not succeed')
              )
              .catch(err => {
                  if (err instanceof chai.AssertionError) {
                      throw err;
                  }

                  const res = err.response;
                  expect(res).to.have.status(400);
              });
      });
      it('Should reject requests with incorrect passwords', () => {
          return chai
              .request(app)
              .post('/api/auth/login')
              .auth(username, 'wrongPassword')
              .then(() =>
                  expect.fail(null, null, 'Request should not succeed')
              )
              .catch(err => {
                  if (err instanceof chai.AssertionError) {
                      throw err;
                  }

                  const res = err.response;
                  expect(res).to.have.status(400);
              });
      });
  });

  describe('/api/auth/refresh', () => {
      it('Should reject requests with no credentials', () => {
          return chai
              .request(app)
              .post('/api/auth/refresh')
              .then(() =>
                  expect.fail(null, null, 'Request should not succeed')
              )
              .catch(err => {
                  if (err instanceof chai.AssertionError) {
                      throw err;
                  }

                  const res = err.response;
                  expect(res).to.have.status(401);
              });
      });
      it('Should reject requests with an invalid token', () => {
          const token = jwt.sign(
              {
                  username,
                  email
              },
              'wrongSecret',
              {
                  algorithm: 'HS256',
                  expiresIn: '7d'
              }
          );

          return chai
              .request(app)
              .post('/api/auth/refresh')
              .set('Authorization', `Bearer ${token}`)
              .then(() =>
                  expect.fail(null, null, 'Request should not succeed')
              )
              .catch(err => {
                  if (err instanceof chai.AssertionError) {
                      throw err;
                  }

                  const res = err.response;
                  expect(res).to.have.status(401);
              });
      });
      it('Should reject requests with an expired token', () => {
          const token = jwt.sign(
              {
                  user: {
                      username,
                      email
                  },
                  exp: Math.floor(Date.now() / 1000) - 10 // Expired ten seconds ago
              },
              JWT_SECRET,
              {
                  algorithm: 'HS256',
                  subject: username
              }
          );

          return chai
              .request(app)
              .post('/api/auth/refresh')
              .set('authorization', `Bearer ${token}`)
              .then(() =>
                  expect.fail(null, null, 'Request should not succeed')
              )
              .catch(err => {
                  if (err instanceof chai.AssertionError) {
                      throw err;
                  }

                  const res = err.response;
                  expect(res).to.have.status(401);
              });
      });
      it('Should return a valid auth token with a newer expiry date', () => {
          const token = jwt.sign(
              {
                  user: {
                      username,
                      email
                  }
              },
              JWT_SECRET,
              {
                  algorithm: 'HS256',
                  subject: username,
                  expiresIn: '7d'
              }
          );
          const decoded = jwt.decode(token);

          return chai
              .request(app)
              .post('/api/auth/refresh')
              .set('authorization', `Bearer ${token}`)
              .then(res => {
                  expect(res).to.have.status(200);
                  expect(res.body).to.be.an('object');
                  const token = res.body.authToken;
                  expect(token).to.be.a('string');
                  const payload = jwt.verify(token, JWT_SECRET, {
                      algorithm: ['HS256']
                  });
                  expect(payload.user).to.deep.equal({
                      username,
                      email
                  });
                  expect(payload.exp).to.be.at.least(decoded.exp);
              });
      });
  });
});