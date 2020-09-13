const express = require('express')
const bodyParser = require("body-parser");

var cors = require('cors')
var Odoo = require("odoo-xmlrpc");
// const axios = require('axios');
// const needle = require('needle');
const fetch = require('node-fetch');



// var router = express.Router();


const app = express();
// var session = require('express-session');

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(cors());

// app.use(session({
//   secret: 'jaredasch',
//   cookie: { maxAge: 60 * 60 * 1000 },
//   saveUninitialized: false,
//   resave: false
// }))


app.get('/login//:port/:database/:username/:password/', function (req, res) {
  var name = req.params.username
  var pass = req.params.password
  var database = req.params.database
  var port = req.params.port
  var odoo = new Odoo({
    url: "http://3.249.109.211",
    port: port,
    db: database,
    username: name,
    password: pass
  });
  odoo.connect(function (err, result) {
    if (err) {
      return res.send(err);
    }

    res.status(200).send((result).toString());
  });
});
/* 
  payment :
    if payment = qnb return qnb requirements (sessionId,OrderId)
    if payment = nbe return nbe requirements (sessionId,OrderId)
    if payment = fawry return fawry requirements (OrderId)
*/
app.get('/get_session/:amount/:payment', function (req, res) {
  var amount = req.params.amount
  var odoo = new Odoo({
    url: "http://3.249.109.211",
    port: 8069,
    db: 'odoo',
    username: 'online',
    password: 'online'
  });
  odoo.connect(function (err, val) {
    if (err) {
      return console.log(err);
    }
    // console.log(val);

    odoo.execute_kw('orders', 'create', [
      [{}]
    ], function (err, value) {
      if (err) {
        return res.send(err);
      }
      var id = value
      odoo.execute_kw('orders', 'search_read', [
        [
          [
            ['id', '=', id]
          ],
          ['order_id']
        ]
      ], function (err, value) {
        if (err) {
          return res.send(err);
        }
        var orderID = value[0].order_id,
          urlencoded,
          url
        if (req.params.payment == "fawry") {
          res.send({
            sesionID: false,
            orderID: orderID
          })
        } else if (req.params.payment == "qnb") {
          urlencoded = new URLSearchParams();
          url = "https://test-gateway.mastercard.com/api/nvp/version/43"
          urlencoded.append("apiOperation", "CREATE_CHECKOUT_SESSION");
          urlencoded.append("apiPassword", "9c6a123857f1ea50830fa023ad8c8d1b");
          urlencoded.append("apiUsername", "merchant.TESTQNBAATEST001");
          urlencoded.append("merchant", "TESTQNBAATEST001");
          urlencoded.append("order.id", orderID);
          urlencoded.append("order.amount", amount);
          urlencoded.append("order.currency", "EGP");
        } else if (req.params.payment == "nbe") {
          urlencoded = new URLSearchParams();
          url = "https://nbe.gateway.mastercard.com/api/nvp/version/57"
          urlencoded.append("apiOperation", "CREATE_CHECKOUT_SESSION");
          urlencoded.append("apiPassword", "804fac154e7ef329c550072d9fd1343e");
          urlencoded.append("apiUsername", "merchant.TESTNBETEST");
          urlencoded.append("merchant", "TESTNBETEST");
          urlencoded.append("interaction.operation", "PURCHASE");
          urlencoded.append("order.id", orderID);
          urlencoded.append("order.amount", amount);
          urlencoded.append("order.currency", "EGP");
        }

        fetch(url, {
            method: 'POST',
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: urlencoded,
            redirect: 'follow'
          })
          .then(response => response.text())
          .then(result => {
            let searchIndex = result.indexOf('SESSION');
            let searchSubStr = result.substr(searchIndex, 31);
            console.log('session string', searchSubStr);
            res.send({
              sesionID: searchSubStr,
              orderID: orderID
            })
          })
          .catch(error => console.log('error', error));
      });
    });
  });

});


// app.post('/complete/:port/:database/:username/:password/:modelname', function(req, res){
//   var name = req.params.username
//   var pass = req.params.password
//   var modelname = req.params.modelname
//   var method =  req.params.method
//   var params = req.body.paramlist
//   var database = req.params.database
//   var port = req.params.port
//   var odoo = new Odoo({
//     url: "http://207.154.195.214",
//     port: port,
//     db: database,
//     username: name,
//     password: pass
//   });
//   var new_params = JSON.parse(params);
//   var result_data = Object.values(new_params.paramlist);

//   odoo.connect(function (err, val) {
//     if (err) { return console.log(err); }
//     console.log(val);

//     odoo.execute_kw(modelname, method, [result_data], function (err, value) {
//       if (err) { return res.send(err); }
//       res.json(value)

//       console.log(value)
//     });
//   });



// });

app.get('/complete/:type/:mode', function (req, res) {
  var type = req.params.type
  var mode = req.params.mode
  if (type == 'travel') {
    if (mode == 'test') {
      res.writeHead(301, {
        Location: 'http://localhost/traveler-insurance/traveler-info?step=thankyou'
      });
      res.end();
    } else {
      res.writeHead(301, {
        Location: 'http://3.249.109.211/arope/traveler-insurance/traveler-info?step=thankyou'
      });
      res.end();
    }


  } else {
    if (mode == 'test') {
      res.writeHead(301, {
        Location: 'http://localhost/personal-accident/personal-result?step=thankyou'
      });
      res.end();
    } else {
      res.writeHead(301, {
        Location: 'http://3.249.109.211/arope/personal-accident/personal-result?step=thankyou'
      });
      res.end();
    }

  }


});




app.post('/call_method/:modelname/:method', function (req, res) {
  var modelname = req.params.modelname
  var method = req.params.method
  var params = req.body.paramlist
  var odoo = new Odoo({
    url: "http://3.249.109.211",
    port: 8069,
    db: 'odoo',
    username: 'online',
    password: 'online'
  });

  var new_params = JSON.parse(params);
  var result_data = Object.values(new_params.paramlist);

  odoo.connect(function (err, val) {
    if (err) {
      return console.log(err);
    }
    console.log(val);

    odoo.execute_kw(modelname, method, [result_data], function (err, value) {
      if (err) {
        return res.send(err);
      }
      res.json(value)

      console.log(value)
    });
  });
});

app.listen(4000, () => {
  console.log('Express Server Started At Port: 4000')
})