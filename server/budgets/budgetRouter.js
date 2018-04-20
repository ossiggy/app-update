const express = require('express');
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const cookieParser = require('cookie-parser');

const router = express.Router();
const {Budget, Category} = require('./models')
const {User} = require('../users')

router.use(cookieParser())

mongoose.Promise=global.Promise;

router.get('/', (req, res) => {

  if(!Budget){
    Budget.create({
      _parent: req.params.userId,
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
    Budget.findOne({'_parent': req.cookies.userId}, {}, {sort: {'_id':-1}})
    .populate('categories')
      .exec(function(err, categories){
        if(err) return "error";
      })
      .then(
        budget => res.json(budget.apiRepr()))
      .catch(err => {
        console.error(err);
        res.status(500).json({error: 'something went wrong'})
      })
    }
});

router.put('/:id', jsonParser, (req, res) => {
  if(!(req.params.id === req.body.id)){
    const message = (
      `Request patch id (${req.params.id} and request body id (${req.body.id}) must match)`)
      console.error(message)
      res.status(400).json({message: message})
  }

  const toUpdate = {}
  const updateableFields = ['income', 'remaining', 'totalSpent',  'categories.name', 'categories.amount', 'categories']

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field]
    }
  })

  Budget
    .findOneAndUpdate({_parent:req.params.userId}, {$set: toUpdate}, {new: true})
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