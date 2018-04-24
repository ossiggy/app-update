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

mongoose.Promise = global.Promise;

const should = chai.should();
const expect = chai.expect;

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

  it.only("Should create a budget if none exists on GET", () => {
    let _res;
    return chai.request(app)
    .get('/api/budgets/')
    .set('Cookie', userId)
    .then(res => {
      _res = res;
      expect(res.body).to.be.a('object');
      expect(res).to.be.json;
      const expectedKeys = ['id', 'income', 'totalSpent', 'remaining', 'categories'];
      expect(res.body).to.have.keys(expectedKeys);
      const resBudget = res.body;
      return Budget.findById(resBudget.id).exec()
    }).then(budget =>{
      const resBudget = _res.body;
      expect(resBudget._parent).to.deep.equal(budget._parent);
      expect(resBudget.id).to.deep.equal(budget.id);
      expect(resBudget.income).to.deep.equal(budget.income);
      expect(resBudget.remaining).to.deep.equal(budget.remaining);
      expect(resBudget.totalSpent).to.deep.equal(budget.totalSpent);
      for(let i=0; i<budget.categories.length; i++){
        expect(resBudget.categories[i]).to.deep.equal(budget.categories[i])
      }
    })

  })
})