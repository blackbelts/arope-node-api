const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const odoo_xmlrpc = require("odoo-xmlrpc");

//secret key
const secret_key = 'nour';

router.get('/', (req, res)=> {
    res.send({
        message: 'well done'
        
    });
});

router.post('/login', (req, res) => {
   
    //MOCK user
    const auth = {
        url: req.body.url, //like 'http://207.154.195.214',
        port: req.body.port, // like 8060
        db: req.body.db,
        username: req.body.username,
        password: req.body.password
    };
    // url: 'http://207.154.195.214',
    //     port: req.body.port,
    //     db: req.body.db,

    const odoo = new odoo_xmlrpc(auth);
    odoo.connect((err, result) => {
        if(err) {
            res.sendStatus(403);
        }
        let user = {}
         user.id = result
            jwt.sign({auth}, secret_key, (err, token) => {
                res.json({
                    token,
                    user
                });
            });

    });

});

router.post('/call_method/:modelname/:method', verifyToken, (req, res)=> {

    const modelname = req.params.modelname;
    const method = req.params.method;
    const list = req.body.paramlist;
    const resultList = Object.values(list);
    
    console.log(resultList, 'lists');
    jwt.verify(req.token, secret_key, (err, authData) => {
        
        if(err) {
            res.sendStatus(403);
        } else {
            delete authData.auth.id;
            const odoo = new odoo_xmlrpc(authData.auth);

            odoo.connect((err, response) => {
                if(err) return console.log('error', err);
              
                odoo.execute_kw(modelname, method, [resultList], function (err, value) {
                    if (err) { return res.send(err); }
                    res.json({
                        data: value
                    });
                
                });
            });
        }

    });
});





//FORMAT OF TOKEN
//Authrization: Bearer <access_token>

//Verify Token
function verifyToken(req, res, next) {
    //Get auth header
    const bearerHeader = req.headers['authorization'];

    //Check if bearerToken is undefined
    if(typeof bearerHeader !== 'undefined') {
        //split the space
        const bearer = bearerHeader.split(' ');

        //Get Token From Array
        const bearerToken = bearer[1];
       
        //Set The Token
        req.token = bearerToken;

        //Next Middleware
        next();
    } else {
        res.sendStatus(403);
    }
}

module.exports = router;
