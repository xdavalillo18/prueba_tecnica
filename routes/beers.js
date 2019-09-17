var express = require('express');
const https = require('https');
var router = express.Router();
const coleccion = 'beerItem';
var envJSON = require('../env.variables.json');
const request = require("request-promise");
const ObjectId = require('mongodb').ObjectId;

router.get('/', function(req, res, next){
  var db = req.app.get('db');
  var cursor = db.collection(coleccion).find();
  var resultado;
  var datos = [];
  getCurrencies();
  cursor.on('data', (d) => {
    datos.push(d);
    resultado = datos;
  })
  cursor.on('end', ()=> {
    res.send({
      'mensaje':null,
      'response': resultado
    })
  })
});

router.get('/:id', function(req, res, next){
  var db = req.app.get('db');
  var cursor = db.collection(coleccion).find({
    "_id" : ObjectId(req.params.id)
  });
  var resultado;
  cursor.on('data', (d) => {
    resultado = d;
  })
  cursor.on('end', () => {
    res.send({
      'mensaje':null,
      'response': resultado
    })
  })
});

router.post('/', function(req, res, next){
  var db = req.app.get('db');
  var beer = req.body;
  console.log(beer);
  console.log(validarRegistro(beer));
  if(validarRegistro(beer)){
    db.collection(coleccion).insertOne(beer, (err, resp)=>{
      if(err){
        res.send({
          'mensaje':"Error en DB ",
          'response': err
        })
      }else{
          res.send({
            'mensaje':"Registro ejecutado",
            'response': resp
          })
      }
    });
  }else{
    res.send({
      'mensaje':"El objeto beer no es valido",
      'response': null
    })
  }

});

router.get('/:_id/boxprice', function(req, res, next){
  var db = req.app.get('db');
  var pr = {
    "id": req.params._id,
    "currency": req.query.currency,
    "quantity": req.query.quantity
  }
  if(validarBoxPrice(pr)){
      try{
        var cursor = db.collection(coleccion).find({
          "_id" : ObjectId(req.params._id)
        });
        var resultado;
        cursor.on('data', (d) => {
          resultado = d;
        })
        cursor.on('end', () => {
          console.log(resultado);
          var url = envJSON.API_LAYER +'live' + '?access_key=' + envJSON.ACCESS_KEY + '&format=1';
          console.log(url);
          request({
            uri: url,
            json: true,
          }).then(resp => {
            var beerPrice = resultado.Price;
            var beerCurrency = resultado.Currency;
            var query_currency = req.query.currency;
            if(req.query.quantity === undefined || req.query.quantity == null){
              var query_quantity = 6;
            }else{
              var query_quantity = req.query.quantity;
            }
            var json = resp.quotes;
            var localCurrency;
            for (var clave in json){
              if (json.hasOwnProperty(clave)) {
                if("USD"+beerCurrency == clave){
                  localCurrency = json[clave];
                }
                if("USD"+query_currency == clave){
                    var priceLocal =  (beerPrice / localCurrency.toFixed(2)).toFixed(2);
                    var priceConvert = (priceLocal * json[clave].toFixed(2)).toFixed(2);
                    var finalValue = priceConvert * query_quantity;

                }
              }
            }
            res.send({
              'mensaje':"Valor de cerveza calculado en: " + req.query.currency,
              'response': finalValue
            })
          });
        })

    }catch(error){
      res.send({
        'mensaje':"Ocurrio un error al intentar consultar API",
        'response': error
      })
    }
  }else{
    res.send({
      'mensaje':"El objeto boxprice no es valido",
      'response': null
    })
  }

});

router.get('/pruebaApiCurrency/:endpoint', function(req, res, next){

  var url = 'http://apilayer.net/api/' + req.params.endpoint + '?access_key=' + envJSON.ACCESS_KEY + '&format=1';
  console.log(url);
  request({
    uri: url,
    json: true, // Para que lo decodifique automáticamente
  }).then(resp => {
    res.send({
      'mensaje':"apilayer implemented",
      'response': resp
    })
  });

});

function validarRegistro(beer){

  if((beer === undefined) || (beer == null)){
    return false
  }
  //console.log("nombre validado en: " + (!usuario.nombre));
  if(!beer.Name){
    return false;
  }
  //console.log("nombre validado en: " + (!usuario.nombre));
  if(!beer.Brewery){
    return false;
  }
  //console.log("nombre validado en: " + (!usuario.nombre));
  if(!beer.Country){
    return false;
  }
  //console.log("nombre validado en: " + (!usuario.nombre));
  if(!beer.Price){
    return false;
  }
  //console.log("nombre validado en: " + (!usuario.nombre));
  if(!beer.Currency){
    return false;
  }

  return true;
}

function validarBoxPrice(pr){
  if((pr === undefined) || (pr == null)){
    return false
  }
  if(!pr.id){
    return false;
  }
  if(!pr.currency){
    return false;
  }
  if(!pr.quantity){
    return false;
  }
  return true;
}

function getCurrencies(){
  console.log (envJSON.ACCESS_KEY);

}




module.exports = router;
