const mongoose = require('mongoose')

//parent budget
const budgetSchema = mongoose.Schema({
  _parent:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
   weeklyIncome: {type: Number, required: true},
   categories: [{type: mongoose.Schema.Types.ObjectId, ref:'Category'}]
});

const categorySchema = mongoose.Schema({
  _parent:{type: mongoose.Schema.Types.ObjectId, ref:'Budget'},
  type: {type:String, required: true},
  name: {type: String, required: true},
  amount: {type: Number, required: true}
})

budgetSchema.methods.apiRepr = function(){
  return{
    id: this._id,
    _parent: this._parent,
    weeklyIncome: this.weeklyIncome,
    categories: this.categories
  }
}

const Budget = mongoose.model('Budget', budgetSchema)
const Category = mongoose.model('Category', categorySchema)

module.exports = {Budget, Category}