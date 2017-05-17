function imgUrl(riddle){
  if(riddle.urlHash){
   return 'https://bit.do/' + riddle.urlHash;
  }
  else if(riddle.imgUrl){
    return riddle.imgUrl;
  }
  else{
    return 'img/questionmark.png';
  }
};
var riddles = JSON.parse(JSON.stringify(initRiddles));
var activePage = 0;
var navElements = document.querySelectorAll('nav li');
var pageNodes = document.querySelectorAll('.inner-main > div');
var pages = [{root:pageNodes[0], classList: pageNodes[0].classList}];

for(var n = 0; n < navElements.length; n++){
  addPageListener(navElements[n], n);
}
function addPageListener(element, n){
  element.addEventListener('click', function(){clickPage(n)});
}

var infoTest = pageNodes[0].querySelector('.test');
var testInput = infoTest.querySelector('input');
var testButton = infoTest.querySelector('button');
var resetButton = pageNodes[0].querySelector('.reset button');
function testEnter(event){
  testInput.classList.remove('wrong');
  testInput.classList.remove('match');
  if(event.key === "Enter"){
    test();
  }
}
function test(){
  testInput.setAttribute('disabled', true);
  testButton.setAttribute('disabled', true);
  hash(testInput.value, "bd21671daa692161736e40967de6044b2945c84be090a4d0")
  .then(function(hash){
    if(hash=="85af66ac3c0d46f5f0a6ff2ced087660e445a013df3e55ce"){
      testInput.classList.add('match');
    }
    else{
      testInput.classList.add('wrong');
    }
    testInput.removeAttribute('disabled');
    testButton.removeAttribute('disabled');
  })
}
testButton.addEventListener('click', test);
testInput.addEventListener('keydown', testEnter);
resetButton.addEventListener('click', reset)

function reset(){
  localStorage.removeItem('lastVisit');
  localStorage.removeItem('riddles');
  riddles = JSON.parse(JSON.stringify(initRiddles));
  for(var i=1; i<riddles.length; i++){
    if(pages[i]){
      resetPage(pages[i]);
    }
    navElements[i].classList.remove('available');
    navElements[i].classList.remove('completed');
    if(riddles[i].answer){
      navElements[i].classList.add('completed');
    }
    else if(riddles[i].urlHash || riddles[i].imgUrl){
      navElements[i].classList.add('available');
    }
  }
}

function resetPage(page){
  page.url.classList.remove('hidden');
  page.textButton.removeAttribute('disabled');
  page.textInput.removeAttribute('disabled');
  page.answers.innerHTML = '';
  page.riddle = riddles[page.number];
  page.img.src = imgUrl(page.riddle);
  page.answerBuffer.splice(0, page.answerBuffer.length);
  if(page.riddle.urlHash || page.riddle.imgUrl){
    hideUrl(page);
  }
}

function createRiddlePage(n){
  var pageElement = pageNodes[n];
  var url = pageElement.querySelector('.url');;
  var urlAdd = url.querySelector('.add');
  var urlReady = url.querySelector('.ready');
  var page = {
    root: pageElement,
    riddle: riddles[n],
    nav: navElements[n],
    number: n,
    url: url,
    urlAdd: urlAdd,
    urlReady: urlReady,
    urlButton: urlReady.querySelector('button'),
    urlInput: urlAdd.querySelector('input'),
    urlAddButton: urlAdd.querySelector('button.add'),
    urlCancelButton: urlAdd.querySelector('button.cancel'),
    img: pageElement.querySelector('img'),
    textInput: pageElement.querySelector('.text input'),
    textButton: pageElement.querySelector('.text button'),
    answers: pageElement.querySelector('ul'),
    classList: pageElement.classList,
    answerBuffer: []
  };

  page.urlButton.addEventListener('click', urlClick.bind(page));
  page.urlCancelButton.addEventListener('click', urlCancel.bind(page));

  page.urlAddButton.addEventListener('click', clickUrlAdd.bind(page));
  page.urlInput.addEventListener('keydown', urlEnter.bind(page));

  page.textButton.addEventListener('click', addAnswer.bind(page));
  page.textInput.addEventListener('keydown', addAnswerEnter.bind(page));
  page.textInput.addEventListener('focus', urlCancel.bind(page));

  page.answerBuffer.add = function(answer, elem){
    var buffer = page.answerBuffer;
    buffer.push({answer:answer, elem: elem});
    if(buffer.length == 1){
      buffer.verificationLoop();
    }
  }

  page.answerBuffer.verificationLoop = function(){
    var riddle = page.riddle;
    var buffer = page.answerBuffer;
    var salt = riddle.answerVerification.salt;
    var next = buffer[0];
    next.elem.classList.remove('wait');
    next.elem.classList.add('in-progress');
    hash(next.answer,salt).then(function(hash){
      if(hash == riddle.answerVerification.hash){
        riddle.answer = next.answer;
        next.elem.classList.remove('in-progress');
        next.elem.classList.add('match');
        completed(page);
      }
      else{
        riddle.wrongAnswers.push(next.answer);
        next.elem.classList.remove('in-progress');
        next.elem.classList.add('wrong');
      }
      buffer.shift();
      if(buffer.length !=0){
        buffer.verificationLoop();
      }
    })
    .catch(function(e){
      alert(e.message);
    });
  }

  return page;
}

function urlEnter(event){
  if(event.key === "Enter"){
    clickUrlAdd.call(this);
  }
}

function clickUrlAdd(){
  var page = this;
  page.urlInput.setAttribute('disabled', true);
  page.urlAddButton.setAttribute('disabled', true);
  page.urlCancelButton.setAttribute('disabled', true);
  var url = this.urlInput.value.trim();
  var salt = page.riddle.urlVerification.salt;
  hash(url, salt).then(function(hash){
    if(hash === page.riddle.urlVerification.hash){
      page.riddle.imgUrl = url;
      page.img.src = imgUrl(page.riddle);
      page.nav.classList.add('available');
      hideUrl(page);
    }
    else{
      page.urlInput.classList.add('wrong');
      page.urlInput.blur();
    }
    page.urlInput.removeAttribute('disabled');
    page.urlAddButton.removeAttribute('disabled');
    page.urlCancelButton.removeAttribute('disabled');
  })
  .catch(function(e){
    alert(e.message);
  });
}

function urlClick(){
  var page = this;
  page.urlReady.classList.add('hidden');
  page.urlAdd.classList.remove('hidden');
}

function urlCancel(){
  var page = this;
  page.urlInput.value = '';
  page.urlInput.classList.remove('wrong');
  page.urlAdd.classList.add('hidden');
  page.urlReady.classList.remove('hidden');
}

function clickPage(n){
  if(navElements[n].classList.contains('active')){
    return;
  }
  else{
    navElements[activePage].classList.remove('active');
    navElements[n].classList.add('active');
    pages[activePage].classList.remove('active');
    if(activePage!=0){
      urlCancel.call(pages[activePage]);
      removeWaitAnswers(pages[activePage]);
    }
    activePage = n;
    if(!pages[n]){
      pages[n] = createRiddlePage(n);
      if(pages[n].riddle.urlHash || pages[n].riddle.imgUrl){
        hideUrl(pages[n]);
      }
      pages[n].img.src = imgUrl(riddles[n]);
      riddles[n].wrongAnswers.forEach(function(answer){
        var li = document.createElement('li');
        li.classList.add('wrong');
        li.innerHTML = answer;
        pages[n].answers.appendChild(li);
      });
      if(riddles[n].answer){
        var li = document.createElement('li');
        li.classList.add('match');
        li.innerHTML = riddles[n].answer;
        pages[n].answers.appendChild(li);
        pages[n].textButton.setAttribute('disabled', true);
        pages[n].textInput.setAttribute('disabled', true);
      }
    }
    pages[n].classList.add('active');
  }
}

function hideUrl(page) {
  page.url.classList.add('hidden');
}

function completed(page){
  page.textButton.setAttribute('disabled', true);
  page.textInput.setAttribute('disabled', true);
  removeWaitAnswers(page);
  page.nav.classList.remove('available');
  page.nav.classList.add('completed');
  if(riddles[page.number+1]){
    hash(page.riddle.answer, page.riddle.nextUrlSalt)
    .then(hexToBitdo64)
    .then(function(hash){
      riddles[page.number+1].urlHash = hash;
      var nextPage = pages[page.number+1];
      if(nextPage){
        nextPage.img.src = imgUrl(nextPage.riddle);
        hideUrl(nextPage);
      }
      navElements[page.number+1].classList.add('available');
    })
    .catch(function(e){
      alert(e.message);
    });
  }
}

function removeWaitAnswers(page){
  page.answerBuffer.splice(0, page.answerBuffer.length);
  var waits = page.answers.querySelectorAll('.wait');
  for(var i = 0; i<waits.length;i++){
    page.answers.removeChild(waits[i]);
  }
}

function addAnswerEnter(event){
  if(event.key === "Enter"){
    addAnswer.call(this);
  }
}

function addAnswer(){
  var page = this;
  var li = document.createElement('li');
  var answer = page.textInput.value;
  page.textInput.value = '';
  li.innerHTML = answer;
  li.classList.add('wait');
  page.answers.appendChild(li);
  page.answerBuffer.add(answer, li);
}

document.addEventListener("DOMContentLoaded", function(event){ 
  var lastVisit = new Date(localStorage.getItem('lastVisit'));
  var timeCode = new Date(timeCodeString);
  if(lastVisit-timeCode > 0){
    riddles = JSON.parse(localStorage.getItem('riddles'));
  }
  openTime = new Date(Date.now()).toISOString();
  for(var i=1; i<riddles.length; i++){
    if(riddles[i].answer){
      navElements[i].classList.add('completed');
    }
    else if(riddles[i].urlHash){
     navElements[i].classList.add('available');
    }
  }
});

window.addEventListener("beforeunload", function(event){
  var someAnswers = riddles.some(function(elem){
    return elem.answer || elem.wrongAnswers && elem.wrongAnswers.length>0;
  });
  if(someAnswers){
    localStorage.setItem('lastVisit', openTime);
    localStorage.setItem('riddles', JSON.stringify(riddles));
  }
});
