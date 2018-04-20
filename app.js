// Each action re-renders page with updated state

// set state for DOM rendering
const state = {
  user: {},
  budget:{
    _parent:null,
    income:0,
    totalSpent:0,
    categories: []
  },
  route: null,
  isEditing:false,
  menuOpen: false
};

//state altering functions

function setRoute(route){
  Object.assign(state, {
    route: route
  });
};

function addCategoryToState(category){
  Object.assign(state.budget, {
    categories:[...state.budget.categories, {
      type: category.type,
      name: category.name,
      amount: category.amount
    }]
  });
};

function updateUser(object){
  Object.assign(state, {
    user: object
  });
};

//check functions

function checkMenuState(){
  if(state.menuOpen===true){
    $('#drop-down-menu').show();
  }
  if(state.menuOpen===false){
    $('#drop-down-menu').hide();
  }
}

function checkForExistingCategory(newCategory){
  let counter = 0;
  state.budget.categories.forEach(function(category){
    if(category.name===newCategory.name){    
      counter++
    };
  });
  if(counter>0){
    $.toast({
      heading: 'Error',
      text: '  Category Exists',
      showHideTransition: 'fade',
      icon: 'error',
      position: 'top-center'
    });
  }
  else{
   addCategoryToState(newCategory)
  };
};

//Event listeners

$(document).ready(renderStartPage);
$('#menu-bars-container').mouseenter(toggleMenu);

//Event Handlers

function toggleMenu(){
  console.log(state.menuOpen);
  state.menuOpen = !state.menuOpen;
  checkMenuState();
}

function closeMenu(){
  state.menuOpen = false;
  checkMenuState();
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
  const newCategory = {};
  newCategory.type = $('#category-type').val();
  newCategory.name = $('#category-name').val();
  newCategory.amount = $('#category-amount').val();
  $('#budget-form')[0].reset();
  checkForExistingCategory(newCategory);
  renderApp();
};

//auth functions

function userLogin(userData){
  const loginURL = '/api/auth/login';
  const {username, password} = userData;
  
  function setHeader(req){
    const encodedString = btoa(`${username}:${password}`);
    req.setRequestHeader('Authorization', 'Basic ' + encodedString);
  };
  
  function handleSuccess(res){
    const userObject = {
      userId: res.id,
      authToken:res.authToken
    };

    $.get('api/users/'+userObject.userId)
      .then(res => {
        userObject.username=res.username;
      });

    updateUser(userObject);
    renderStartPage();
  };
  
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

const PAGE_SOURCES = {
  'landing-page': $('#landing-page-template').html(),
  'budget-page': $('#budget-page-template').html()
};

function renderStartPage(){
  if(!state.user.username){

    setRoute('budget-page'); // TODO: change to landing page before ship

    renderApp();
    $('#sign-in-submit').on('click', extractUserData);
  }
  if(state.user.username){
    setRoute('budget-page');
    renderApp();
  }
};

function renderApp(){
  if(state.route ==='landing-page'){
    renderPage(PAGE_SOURCES[state.route]);
    renderDropDownMenu();
  };
  if(state.route === 'budget-page'){
    // fetchBudget(state.user.userId); TODO: hook up actions to server
    renderBudgetPage();
  }
};

function renderPage(source){
  const template = Handlebars.compile(source);
  const templatedPage = template(state)
  $('.page-content').html('');
  $('.page-content').append(templatedPage)
}

function renderBudgetPage(){
  renderPage(PAGE_SOURCES[state.route]);
  renderCategories(state.budget.categories);
  renderLogout();

  $('#new-category-submit').on('click', createNewCategory);
  $('#save-budget').on('click', createBudgetObject);
}

function renderDropDownMenu(){

    $('#corner-container').html('');

    $('#corner-container').append(`
      <div id="menu-bars-container">
        <i id="menu-bars" class="fas fa-bars fa-3x"></i>
      </div>
    `);

    $('.drop-down-menu-container').append(`
      <div id="drop-down-menu" class="col-4 offset-8" hidden="true"><div>
    `);
}


function renderLogout(){
  $('#corner-container').html('');

  $('#corner-container').append(`
    <button id="log-out-button">Log Out</button>
  `);
}

function renderLoginForm(){
  const source = $('#login-form-template').html();
  const template = Handlebars.compile(source);
  const templatedForm = template(state);
  $('#drop-down-menu').append(templatedForm);
}

function renderCategories(categories){
  const source = $('#budget-template').html();
  const template = Handlebars.compile(source);
  $('.budget-container').html('');
  for(let i=0; i<categories.length; i++){
    const category = categories[i];
    const templatedCategory = template(category);
    if(category.type==='Expense'){
      $('#expenses').append(templatedCategory)
    }
    else{
      $('#savings').append(templatedCategory)
    }
  }
}