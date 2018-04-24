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
    .catch(err => console.log(err))
  }

  function createBlankBudget(){
    console.log('creating blank budget');
    let agent = chai.request.agent(app)
    return agent
       .post('/api/auth/login')
       .send({ username: 'username', password: 'password' })
       .then(function (res) {
         expect(res).to.have.cookie('userId');
         return agent.get('/api/budgets')
        .then(()=> updateBudget())
      })
  }

  function updateBudget(){
    let agent = chai.request.agent(app)
    return agent
       .post('/api/auth/login')
       .send({ username: 'username', password: 'password' })
       .then(function (res) {
         expect(res).to.have.cookie('userId');
         return agent.put('/api/budgets')
        .send({'income':'100'});
      })
  }

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
    let agent = chai.request.agent(app)
    return agent
       .post('/api/auth/login')
       .send({ username: 'username', password: 'password' })
       .then(function (res) {
         expect(res).to.have.cookie('userId');
         return agent.get('/api/budgets')
        .then(res => {
          _res = res;
          expect(res.body).to.be.a('object');
          expect(res).to.be.json;
          const expectedKeys = ['_parent', 'id', 'income', 'totalSpent', 'remaining', 'categories'];
          expect(res.body).to.have.keys(expectedKeys);
          const resBudget = res.body;
          return Budget.findById(resBudget.id).exec()
        }).then(budget =>{
          console.log(budget)
          const resBudget = _res.body;
          expect(resBudget._parent).to.deep.equal(`${budget._parent}`);
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

    it("Should send the user back their budget", () => {
      let _res;
      return createBlankBudget()
      .then(() => {
        let agent = chai.request.agent(app)
        return agent
           .post('/api/auth/login')
           .send({ username: 'username', password: 'password' })
           .then(function (res) {
             expect(res).to.have.cookie('userId');
             return agent.get('/api/budgets')
              .then(res => {
                _res = res;
                console.log(res.body)
                budgetId = res.body.id
                expect(res.body).to.be.a('object');
                expect(res).to.be.json;
                return Budget.findById(budgetId).exec()
              }).then(budget => {
                const resBudget = _res.body
                expect(resBudget.id).to.deep.equal(budget.id);
                expect(resBudget._parent).to.deep.equal(`${budget._parent}`);
                expect(resBudget.income).to.equal(budget.income);
              })
            })
        })
    })


    it("Should update budgets on PUT", ()=> {

      const updateable = {   
        "income": "1000",
        "remaining": "200",
        "totalSpent": "100"
      }

      return createBlankBudget()
      .then(() => {
        let agent = chai.request.agent(app)
        return agent
           .post('/api/auth/login')
           .send({ username: 'username', password: 'password' })
           .then(function (res) {
             expect(res).to.have.cookie('userId');
             return agent.put('/api/budgets')
             .send(updateable)
              .then(res => {
                expect(res).to.have.status(204);
            })
        })
    })
  })
})