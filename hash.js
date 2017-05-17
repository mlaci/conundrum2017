//https://github.com/antelle/argon2-browser

var argon2_distPath = 'dist/'
var initParams = {
        pass: 'password',
        salt: 'somesalt',
        time: +(1),
        mem: +(1024),
        hashLen: +(24),
        parallelism: +(1),
        type: 0,
        distPath: argon2_distPath
 };

if (navigator.mimeTypes['application/x-pnacl']) {
    argon2.hash = calcPNaCl;
}

var listeners = 0;
function calcPNaCl(params) {
    var listener = document.getElementById('pnaclListener');
    var moduleEl = document.getElementById('pnacl-argon2');
    listeners++;
    var promise = new Promise(function(resolve, reject){
      var calls = listeners;
      var messageListener = listener.addEventListener('message', function(e) {
        calls--;
        if(calls==0){
          var encoded = e.data.encoded;
          var hash = e.data.hash;
          if (e.data.res) {
              reject('Error: ' + e.data.res + ': ' + e.data.error);
          } else {
              resolve({encoded: encoded, hashHex: hash})
          }
          listener.removeEventListener('message', messageListener, true);
          listeners--;
        }
      }, true);
    });

    if (moduleEl) {
        moduleEl.postMessage(params);
        return promise;
    }
    
    moduleEl = document.createElement('embed');
    moduleEl.setAttribute('name', 'argon2');
    moduleEl.setAttribute('id', 'pnacl-argon2');
    moduleEl.setAttribute('width', '0');
    moduleEl.setAttribute('height', '0');
    moduleEl.setAttribute('src', 'argon2.nmf');
    moduleEl.setAttribute('type', 'application/x-pnacl');

    listener.addEventListener('load', function() {
        moduleEl.postMessage(params);
    }, true);
    listener.addEventListener('error', function() { console.log('PNaCl Error'); }, true);
    listener.addEventListener('crash', function() { console.log('PNaCl Crash'); }, true);

    listener.appendChild(moduleEl);
    moduleEl.offsetTop; // required by PNaCl
    return promise;
}

// hash('password','salt').then(res => console.log(res));
function hash(password, salt){
    var params = {
        pass: encodeURIComponent(password) || 'password',
        salt: salt || 'somesalt',
        time: +(1),
        mem: +(16384),
        hashLen: +(24),
        parallelism: +(1),
        type: 0,
        distPath: argon2_distPath
    };
    return argon2.hash(params).then(function f(res){ return res.hashHex})
    /*.then(function(res){
      return new Promise((resolve, reject) => {
        setTimeout(function(){
          resolve(res);
        }, 3000);
      });
    })*/
}

var crypto = window.crypto || window.msCrypto;
function getSalt(){
  var rand = new Uint8Array(24);
  crypto.getRandomValues(rand);
  var hex = '';
  for (n in rand){
    hex += ('0' + (0xFF & rand[n]).toString(16)).slice(-2);
  };
  return hex;
}
function hexToBytes(hex){
  var bytes = new Uint8Array(24);
  for (i = 0; i < hex.length; i++){
    bytes[i] = parseInt(hex.substr(i*2, 2), 16);
  }
  return bytes;
}
function hexToBitdo64(hex){
  var b64 = '';
  var bytes = hexToBytes(hex);
  for(n in bytes){
    b64 += String.fromCharCode(bytes[n]);
  };
  return btoa(b64).replace(/\//g,'_').replace(/\+/g,'-');
};
