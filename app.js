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
    totalSpent:0,
    categories: []
  },
  isEditing:false
};



//state altering functions

function addCategoryToState(category){
  let categories = state.budget.categories;
  categories.push(category)
  renderCategories(categories);
}

//check functions

function checkForExistingCategory(newCategory){
  let counter = 0;
  state.budget.categories.forEach(function(category){
    if(category.name===newCategory.name){    
      counter++
    }
  })
  if(counter>0){
    $.toast({
      heading: 'Error',
      text: '  Category Exists',
      showHideTransition: 'fade',
      icon: 'error',
      position: 'top-center'
    })
  }
  else{
   addCategoryToState(newCategory)
   console.log(state)
  }
}

//Event listeners

$('#new-category-submit').on('click', createNewCategory);


//Event Handlers

function createNewCategory(event){
  event.preventDefault();
  const newCategory = {};
  newCategory.type = $('#category-type').val();
  newCategory.name = $('#category-name').val();
  newCategory.amount = $('#category-amount').val();
  $('#budget-form')[0].reset()
  checkForExistingCategory(newCategory);
}

//rendering functions

function renderPage(state){
  return
}

function renderCategories(categories){
  $('.budget-container').html('');
  for(let i=0; i<categories.length; i++){
    const category = categories[i]
    const templatedCategory = template(category)
    if(category.type==='Expense'){
      $('#expenses').append(templatedCategory);
    }
    else{
      $('#savings').append(templatedCategory);
    }
  }
}