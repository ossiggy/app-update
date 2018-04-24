'use strict';

const chai = require('chai')
const chaiHttp = require('chai-http')
const { ObjectID } = require('mongodb')
const faker = require('faker')
const mongoose = require('mongoose')

const {app, runServer, closeServer} = require('../../server')
const {DATABASE_URL} = require('../config')
const {TEST_DATABASE_URL} = require('../config')
const {Budget} = require('../budgets/models')

const testID = new ObjectID();

mongoose.Promise = global.Promise

const should = chai.should()

chai.use(chaiHttp)

const mockBudget = {
  income: faker.random.number(),
  totalSpent: faker.random.number(),
  remaining: faker.random.number(),
  categories: [{
    type: faker.lorem.word,
    name: faker.lorem.word,
    amount: faker.random.number()
  }]
}

function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err))
  });
}

describe('Budget router', () => {

  let userId;
  let budgetId;

  function createMockUser(){
    console.info('creating mock user');
    return chai.request(app)
    .post('/api/users/')
    .send({username: 'username', password: 'password', email: 'email@email.com'})
    .then(() => logUserIn())
    .catch(err => console.log(err))
  }

  function logUserIn(){
    console.info('logging in');
    return chai.request(app)
      .post('/api/auth/login')
      .send({username: 'username', password: 'password'})
      .then(res => userId = res.body.id)
      // .then(() =>  seedBudgetData())
      .catch(err => console.log(err))
  }

  function seedBudgetData() {
    console.info('seeding budget data')
    return Budget.create(mockBudget)
      .then(
        budget => {
          budget._parent = userId;
          return chai.request(app)
          .post('/api/budgets')
          .send(budget)
          .then(res =>  budgetId = res.body.id)
          .catch(err => console.log(err))
      })
    .catch(err => console.log(err))
  };

  before(() => {
    return runServer(TEST_DATABASE_URL)
  })

  beforeEach(() => {
    return createMockUser()
  })

  afterEach(() => {
    return tearDownDb()
  })

  after(() => {
    return closeServer()
  })

  it("Should create a budget if none exists on GET", () => {
    let _res;
    chai.request(app)
    .get('/api/budgets')
    .then(res => {
      _res = res
      console.log(res)
    })

  })
})