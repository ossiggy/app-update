const express = require('express');
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const Cookies = require('cookies-js');

const router = express.Router();
const {Budget, Category} = require('./models')
const {User} = require('../users')

router.use(cookieParser())

mongoose.Promise=global.Promise;

router.get('/', (req, res) => {

  const userId = Cookies.get(userId)

  if(!Budget){
    Budget.create({
      _parent: userId,
      income: 0,
      totalSpent: 0,
      remaining: 0,
      categories: []
    })
    .then(
      budget => res.json(budget.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went wrong'})
    })
  }
  else{
    Budget
    .find({'_parent': userId})
    .then(
      budget => res.json(budget.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went wrong'})
    })
    }
});

router.put('/', jsonParser, (req, res) => {

  const userId = Cookies.get(userId)

  const toUpdate = {}
  const updateableFields = ['income', 'remaining', 'totalSpent',  'categories.name', 'categories.amount', 'categories']

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field]
    }
  })

  Budget
    .findOneAndUpdate({_parent:userId}, {$set: toUpdate}, {new: true})
    .exec()
    .then(post => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}))
})

router.delete('/:id', (req, res) => {
  Budget
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(post => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Inernal server error'}))
})

module.exports = {router};