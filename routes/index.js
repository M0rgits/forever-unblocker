var express = require('express');
var app = express();
var router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
/* GET home page. */

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/re', function(req, res, next) {
  var url = fs.readFileSync('./urls/sitelist.txt').toString().split('\n').shift();
  res.redirect(`http://${url}`)
});

router.get('/url', function(req, res, next) {
  var url = fs.readFileSync('./urls/sitelist.txt').toString().split('\n').shift();
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.send(url);
});

router.get('/offline', function(req, res, next) {
  res.download('./public/dl.html');
})

module.exports = router;

