function MonetizerClient(opts) {
  var domain = new URL(window.location).origin
  this.url = domain
  if(opts && opts.url) {
    this.url = opts.url;
  }
  this.receiverUrl = this.url + '/pay/:id'
  this.getMonetizationId = function(getMonetizationIdUrl) {
    return new Promise ((resolve, reject) => {
      const fetchUrl = (getMonetizationIdUrl )|| this.url + '/getMonetizationId'
      console.log("fetchURL", fetchUrl);
      var self = this;
      fetch(fetchUrl)
        .then(function(response) {
          return response.json();
        })
        .then(function(response) {
          // set cookie and/or receiverUrl.
          // document.cookie = response.id;
          self.receiverUrl = self.receiverUrl.replace(/:id/, response.id);
          console.log("document cookies", document.cookie);
          let responseId = response.id
          // if(document.cookie) {
          //   responseId = document.cookie.split('=')[1]
          //   console.log("cookei id", responseId)
          // } else {
          //   document.cookie = setCookie('payerId', response.id, 3);
          //   responseId = response.id
          // }
          console.log("responseId", responseId)
          resolve(responseId)
        })
        .catch(function(error) {
          reject(new Error(error))
        })
    })

  }
  this.start = function(id) {
    var self = this;
    return new Promise((resolve, reject) => {
      if(window.monetize) {
        window.monetize({
          receiver: self.receiverUrl
        })
        resolve(id)
      } else {
        console.log('Your extension is disabled or not installed.' +
          ' Manually pay to ' + self.receiverUrl)
        reject(new Error('web monetization is not enabled'))
      }
    })
  }
}

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function u8tohex (arr) {
  var vals = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' ]
  var ret = ''
  for (var i = 0; i < arr.length; ++i) {
    ret += vals[(arr[i] & 0xf0) / 0x10]
    ret += vals[(arr[i] & 0x0f)]
  }
  return ret
}
