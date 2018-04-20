'use strict';

const chai = require('chai')
const chaiHttp = require('chai-http')
const { ObjectID } = require('mongodb')
const faker = require('faker')
const mongoose = require('mongoose')

const {app, runServer, closeServer} = require('../server')
const {DATABASE_URL} = require('../config')
const {TEST_DATABASE_URL} = require('../config')
const {Budget, Category} = require('../budgets/models')

const testID = new ObjectID();

mongoose.Promise = global.Promise

const should = chai.should()

chai.use(chaiHttp)

const mockBudget = {
  availableIncome: faker.random.number(),
  weeklyIncome: faker.random.number(),
  categories:[]
}

const mockCategory = {
  amount: faker.random.number(),
  name: faker.lorem.word(),
  table: faker.lorem.word()
}

function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err))
  });
}

let testId;

function seedBudgetData() {
  console.info('seeding budget data')
  return Budget.create(Object.assign(mockBudget, { _parent: new ObjectID()}))
    .then(
      budget =>{
        return Category.create(
          Object.assign(mockCategory, { _parent: budget._id})
        )
          .then(
            category => budget.update({$push: {'categories': {_id: category._id}}}, {safe: true, upsert: true, new: true})
          );
      }
    )
    .catch( err => console.log(err))
}

describe('Budge My Life', function(){
  before(function(){
    return runServer(TEST_DATABASE_URL)
  })

  beforeEach(function(){
    return seedBudgetData()
  })

  afterEach(function(){
    return tearDownDb()
  })

  after(function(){
    return closeServer()
  })

  it('Should list specific budget on GET', function(){
    let _res;
    return chai.request(app)
      .get('/budgets')
      .then(function(res){
        _res = res;
        res.should.have.status(200);
        res.should.be.json;
        res.body.forEach(function(budget){
          const expectedKeys = ['_parent', 'availableIncome', 'weeklyIncome', 'categories', 'id']
          budget.should.include.keys(expectedKeys);
          budget.categories.should.be.a('array');
          budget.categories.length.should.be.at.least(1);
          const categoryKeys = ['amount', 'name', 'table', '_parent'];
          budget.categories.forEach(function(category){
            category.should.be.a('object');
            category.should.include.keys(categoryKeys);
          });
        });
        const resBudget = res.body[0];
        return Budget.findById(resBudget.id).exec();
      })
      .then(budget => {
        const resBudget = _res.body[0];
        resBudget.id.should.equal(budget.id);
        resBudget.availableIncome.should.equal(budget.availableIncome);
        resBudget.weeklyIncome.should.equal(budget.weeklyIncome);
      });
  });

  it('Should add budgets on POST', function(){
    const newBudget = {_parent: new ObjectID, availableIncome: 1250, weeklyIncome: 1500, categories: [{table: "vertical-1", name: "dogs", amount: 130}]}
    return chai.request(app)
      .post('/budgets')
      .send(newBudget)
      .then(function(res){
        res.should.have.status(204);
      });
  });
});