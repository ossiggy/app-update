// Each action re-renders page with updated state

// set state for DOM rendering
const state = {
  user: {},
  budget:{
    _parent: null,
    income: 0,
    totalSpent: 0,
    remaining: 0,
    categories: [],
    expenseTotal:0,
    savingsTotal:0
  },
  route: null,
  incomeEditing: false,
  categoryEditing: false,
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
      amount: parseInt(category.amount)
    }]
  });
  renderIncomeInformation(state.budget);
};

function budgetCalculations(){
  let totalSpent = 0;
  let remaining = 0;
  const categories = state.budget.categories;
  const income = parseInt(state.budget.income);
  for(let i=0; i<categories.length; i++){
    const amount = categories[i].amount
    totalSpent = totalSpent + parseInt(amount);
  }
  remaining = income - totalSpent;
  Object.assign(state.budget, {
    income:income,
    totalSpent:totalSpent,
    remaining:remaining,
  })

  for(let i=0; i<categories.length; i++){
    let category = categories[i];
    if(category.type === 'Expense'){
      state.expenseTotal += category.amount;
    }
    if(category.type === 'Savings'){
      state.savingsTotal += category.amount;
    }
  }
}

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

//Event Handlers

function toggleMenu(){
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

function prepUserObject(event){
  event.preventDefault();
  newUser = {};
  newUser.username = $('#sign-up-username').val().trim('');
  newUser.password = $('#sign-up-password').val();
  newUser.email = $('#sign-up-email').val();

  const infoSettings = {
    url: '/api/users/',
    type: 'POST',
    contentType: 'application/json',
    success: handleSuccess,
    data: JSON.stringify(newUser),
    error: function(err){
      console.log(err)
    }
  };

  function handleSuccess(){
    const {username, password} = newUser
    userLogin({username, password});
  }

  $.ajax(infoSettings)
}

function createNewCategory(event){
  const newCategory = {};
  newCategory.type = $('#category-type').val().trim('');
  newCategory.name = $('#category-name').val().trim('');
  newCategory.amount = $('#category-amount').val();
  if(newCategory.name===''||newCategory.amount === ''){
    $.toast({
      heading: 'Error',
      text: ' Cannot be blank',
      showHideTransition: 'fade',
      icon: 'error',
      position: 'top-center'
    });
    return
  }
  $('.category-input, textarea').val('')
  checkForExistingCategory(newCategory);
  renderCategories(state.budget.categories);
  renderIncomeInformation(state.budget);
};

function saveBudget(event){
  event.preventDefault();
  const budgetObject = JSON.stringify(state.budget);

  function setHeader(req){
    req.setRequestHeader('Content-type', 'application/json')
  }

  $.ajax({
    url: '/api/budgets',
    type: 'PUT',
    data: budgetObject,
    beforeSend: setHeader,
    success: handleSuccess,
    error: function(err){
      console.log(err);
    }
  })

  function handleSuccess(){
    $.toast({
      heading: 'Success',
      text: ' Budget saved!',
      showHideTransition: 'slide',
      icon: 'success',
      position: 'top-center'
    });
  }

};

function editIncome(event){
  event.preventDefault();
  Object.assign(state, {incomeEditing:!state.incomeEditing})
  if(state.incomeEditing){
    $('#edit-income').html('<i class="fas fa-check-square fa-3x">');
    $('#monthly-income-number').attr('contenteditable', 'true');
    $("div[contenteditable]").on('keypress', function (evt) {
      
        var keycode = evt.charCode || evt.keyCode;
        if (keycode  == 13) { 
          return false;
        }
      }); 
  };
  if(!state.incomeEditing){
    $('#edit-income').html('<i class="fas fa-pen-square fa-3x">');
    $('#monthly-income-number').attr('contenteditable', 'false');
    let newAmount = Number($('#monthly-income-number').html().trim(''));
    if(isNaN(newAmount)){
      $.toast({
        heading: 'Error',
        text: ' Must be a positive number',
        showHideTransition: 'fade',
        icon: 'error',
        position: 'top-center'
      });
      newAmount = 0;
    };
    Object.assign(state.budget, {
      income: newAmount
    })
    renderIncomeInformation(state.budget);
  };
};

function editCategory(event){
  event.preventDefault();
  const categories = state.budget.categories;
  const _this = $(this);
  const cardName = _this.parent().siblings().children('.card-name').html();
  const cardAmount = _this.parent().siblings().children('.card-amount');
  const thisCategory = categories.find(function(card){return card.name===cardName});
  Object.assign(state, {categoryEditing: !state.categoryEditing});
  if(state.categoryEditing){
    _this.html('<i class="fas fa-check-square fa-3x">');
    cardAmount.attr('contenteditable', 'true');
    $("div[contenteditable]").on('keypress', function (evt) {
      
        var keycode = evt.charCode || evt.keyCode;
        if (keycode  == 13) { 
          return false;
        }
      });
  };
  if(!state.categoryEditing){
    _this.html('<i class="fas fa-pen-square fa-3x">');
    cardAmount.attr('contenteditable', 'false');
    let newAmount = cardAmount.html().trim();
    console.log(newAmount)
    if(isNaN(newAmount)){
      $.toast({
        heading: 'Error',
        text: ' Must be a positive number',
        showHideTransition: 'fade',
        icon: 'error',
        position: 'top-center'
      });
      newAmount = 0;
    }
    Object.assign(thisCategory, {
      amount: newAmount
    });
    renderIncomeInformation(state.budget);
    renderCategories(state.budget.categories);
  }
}

function deleteCategory(event){
  event.preventDefault();
  const categories = state.budget.categories;
  const _this = $(this);
  const cardName = _this.parent().siblings().children('.card-name').html()
  const index = categories.findIndex(function(card){return card.name===cardName});
  if(index > -1){
    categories.splice(index, 1);
  };
  Object.assign(state.budget, {
    categories: categories
  });
  renderIncomeInformation(state.budget);
  renderCategories(state.budget.categories);
}

function logOut(event){
  event.preventDefault();
  $.ajax({
    type: 'GET',
    url: '/api/auth/logout',
    success: function(){
      setRoute('landing-page');
      renderApp();
    }
  })
}

function demoMode(event){
  userLogin({username: 'demomode', password: 'password'});
}

//auth functions

function userLogin(userData){
  const data = JSON.stringify(userData)
  const loginURL = '/api/auth/login';
  const {username, password} = userData;

  function handleSuccess(){
    updateUser({username});
    setRoute('budget-page');
    renderApp();
  };

  function setHeader(req){
    req.setRequestHeader('Content-type', 'application/json')
  }
  
  const infoSettings = {
    type: 'POST',
    url: loginURL,
    data: data,
    beforeSend: setHeader,
    success:handleSuccess,
    error: () => {
      $.toast({
        heading: 'Error',
        text: ' Invalid Username or Password',
        showHideTransition: 'fade',
        icon: 'error',
        position: 'top-center'
      });
    }
  };
  $.ajax(infoSettings)
}

//rendering functions

const PAGE_SOURCES = {
  'landing-page': $('#landing-page-template').html(),
  'budget-page': $('#budget-page-template').html()
};

function renderStartPage(){
  username = Cookies.get('username')
  if(!username){

    setRoute('landing-page'); // TODO: change to landing page before ship
    renderApp();
    $('#sign-up-submit').on('click', prepUserObject)
  }
  if(username){
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
  userId = Cookies.get('userId')
  $.getJSON('/api/budgets', {cookie: userId}, function(res){
    Object.assign(state.budget, res)
  }).then(() => {
    renderPage(PAGE_SOURCES[state.route]);
    renderIncomeInformation(state.budget);
    renderCategories(state.budget.categories);
    renderLogout();
    $('#new-category-submit').on('click', createNewCategory);
    $('#save-budget').on('click', saveBudget);
  });
};

function renderDropDownMenu(){

  $('#corner-container').html('');

  $('#corner-container').append(`
  <button type="button" id="demo-button">Demo</button>
    <div id="menu-bars-container">
      <i id="menu-bars" class="fas fa-bars fa-3x"></i>
    </div>
  `);

  $('.drop-down-menu-container').html('')

  $('.drop-down-menu-container').append(`
    <div id="drop-down-menu" class="col-4 offset-8" hidden="true"><div>
  `);
  $('#menu-bars-container').mouseenter(toggleMenu);
  $('#menu-bars-container').on('click', toggleMenu);
  $('#drop-down-menu').mouseleave(toggleMenu);
  $('#demo-button').on('click', demoMode);
  renderLoginForm();
}


function renderLogout(){
  $('#corner-container').html('');
  $('.drop-down-menu-container').html('')

  $('#corner-container').append(`
    <button id="log-out-button">Log Out</button>
  `);
  $('#log-out-button').on('click', logOut)
}

function renderLoginForm(){
  const source = $('#login-form-template').html();
  const template = Handlebars.compile(source);
  const templatedForm = template(state);
  $('#drop-down-menu').append(templatedForm);
  $('#sign-in').on('submit', extractUserData);
}

function renderIncomeInformation(income){
  budgetCalculations();
  const source = $('#finance-info-template').html();
  const template = Handlebars.compile(source);
  const templatedIncome = template(income);
  $('.main-info-container').html('')
  $('.main-info-container').append(templatedIncome);
  $('#edit-income').on('click', editIncome);
}

function renderCategories(categories){
  const source = $('#budget-template').html();
  const template = Handlebars.compile(source);
  $('.budget-container').html('');
  for(let i=0; i<categories.length; i++){
    const category = categories[i];
    const templatedCategory = template(category);
    if(category.type==='Expense'){
      $('#expenses').append(templatedCategory);
    }
    else{
      $('#savings').append(templatedCategory);
    }
  }
  $('.edit-category').on('click', editCategory);
  $('.delete-category').on('click', deleteCategory);
}