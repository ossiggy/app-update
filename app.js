// Each action re-renders page with updated state

// Handlebars setup
const source = $('#budget-template').html();
const template = Handlebars.compile(source);


// set state for DOM rendering
const state = {
  user: {},
  budget:{
    _parent:null,
    income:0,
    totalSpent:0,
    categories: []
  },
  isEditing:false,
  menuOpen: false
};



//state altering functions

function setRoute(state, route){
  state.route = route;
}

function addCategoryToState(state, category){
  let categories = state.budget.categories;
  categories.push(category)
  renderCategories(categories);
}

function updateUser(state, object){
  let {userId, authToken, username} = object;
  state.user.userId = userId;
  state.user.authToken = authToken;
  state.user.username = username;

}

//check functions

function checkForExistingCategory(state, newCategory){
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

$(document).ready(renderStartPage);
$('header').on('click', 'sign-in-submit', extractUserData);
$('#new-category-submit').on('click', createNewCategory);


//Event Handlers

function renderStartPage(event){
  event.preventDefault();
  setRoute(state, 'landing-page');
  renderApp(state, PAGE_ELEMENTS);
}

function extractUserData(event){
  event.preventDefault();
  const formData = {};
  $('#sign-in input').each(function(){
    let {name, value} = this;
    formData[name]=value;
  });
  userLogin(formData);
};

function createNewCategory(event){
  event.preventDefault();
  const newCategory = {};
  newCategory.type = $('#category-type').val();
  newCategory.name = $('#category-name').val();
  newCategory.amount = $('#category-amount').val();
  $('#budget-form')[0].reset()
  checkForExistingCategory(state, newCategory);
}

//auth functions

function userLogin(userData){

  const loginURL = '/api/auth/login';
  
    const {username, password} = formData;
  
    function setHeader(req){
      const encodedString = btoa(`${username}:${password}`);
      req.setRequestHeader('Authorization', 'Basic ' + encodedString);
    }
  
    function handleSuccess(res){

      const userObject = {
        userId: res.id,
        authToken:res.authToken
      }
  
      $.get('api/users/'+userObject.userId)
        .then(res => {
          userObject.username=res.username;
        });

      updateUser(state, userObject);
      setRoute(state, 'budget-page');
      renderApp(state, PAGE_ELEMENTS);

    }
  
    const infoSettings = {
      url: loginURL,
      type: 'POST',
      beforeSend: setHeader,
      data: formData,
      success: handleSuccess,
      error: function(err){
        console.log(err);
      }
    };

    $.ajax(infoSettings);
}

//rendering functions

const PAGE_ELEMENTS = {
  'landing-page': $('.landing-page'),
  'budget-page': $('.budget-page')
}

function renderApp(state, elements){
  Object.keys(elements).forEach(function(route){
    elements[route].hide()
  })
  elements[state.route].show()
  if(state.route==='.landing-page'){
    renderLandingPage(state, element.find('.landing-page'));
};

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