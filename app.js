// Each action re-renders page with updated state

// Handlebars setup
const source = $('#budget-template').html();
const template = Handlebars.compile(source);


// set state for DOM rendering
const state = {
  user: null,
  budget:{
    _parent:null,
    income:0,
    availableFunds:0,
    totalSpent:0,
    categories: []
  },
  isEditing:false
};

const renderPage = state => {

}

const addCategory = (category) => {
  state.categories.push(category)
}

//Event handlers

$("#")