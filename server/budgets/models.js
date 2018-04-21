const mongoose = require('mongoose')

//parent budget
const budgetSchema = mongoose.Schema({
  _parent:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
   income: {type: Number, required: true},
   totalSpent:{type: Number, required: true},
   remaining:{type: Number, required: true},
   categories: {type: Array, default: []}
});

budgetSchema.methods.apiRepr = function(){
  return{
    id: this._id,
    _parent: this._parent,
    income: this.income,
    totalSpent: this.totalSpent,
    remaining: this.remaining,
    categories: this.categories
  }
}

const Budget = mongoose.model('Budget', budgetSchema)

module.exports = {Budget}