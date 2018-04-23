'use strict';

const chai = require('chai')
const chaiHttp = require('chai-http')
const { ObjectID } = require('mongodb')
const faker = require('faker')
const mongoose = require('mongoose')

const {app, runServer, closeServer} = require('../server')
const {DATABASE_URL} = require('../config')
const {TEST_DATABASE_URL} = require('../config')
const {Budget} = require('../budgets/models')

const testID = new ObjectID();

mongoose.Promise = global.Promise

const should = chai.should()

chai.use(chaiHttp)

const mockBudget = {
  availableIncome: faker.random.number(),
  weeklyIncome: faker.random.number(),
  categories:[]
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
          .then(
            category => budget.update({$push: {'categories': {_id: category._id}}}, {safe: true, upsert: true, new: true})
          );
      }
    )
    .catch( err => console.log(err))
};