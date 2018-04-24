const express = require('express');
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const cookieParser = require('cookie-parser');

const router = express.Router();
const {Budget} = require('./models')
const {User} = require('../users')

mongoose.Promise=global.Promise;

router.use(cookieParser())

router.get('/', (req, res) => {

  const userId = req.cookies.userId;

    Budget
    .findOne({'_parent': userId})
    .then(budget => {
      if(!budget){
        Budget.create({
          _parent: userId,
          income: 0,
          totalSpent: 0,
          remaining: 0,
          categories: []
        })
        .then(
          budget => res.json(budget.apiRepr()))
      }
      else{
        return res.json(budget.apiRepr())
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went wrong'})
    })
});

router.put('/', jsonParser, (req, res) => {

  const userId = req.cookies.userId

  console.log(req.body)

  const toUpdate = {}
  const updateableFields = ['income', 'remaining', 'totalSpent', 'categories']

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field]
    }
  })

  console.log(toUpdate)

  Budget
    .findOneAndUpdate({_parent:userId}, {$set: toUpdate}, {new: true})
    .exec()
    .then(post => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}))
})

module.exports = {router};