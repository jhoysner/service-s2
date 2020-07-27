require("./config/config");

const express = require("express");
const s2 = require("@radarlabs/s2");
var mysql = require("mysql");

var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "support70",
  database: "geo",
});

connection.connect();

const app = express();

const bodyParser = require("body-parser");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//funcion que recibe el sql y regresa el callback
function query(sql, callback) {
  connection.query(sql, function (error, results, fields) {
    if (error) return callback(error);
    resultsNew = JSON.parse(JSON.stringify(results));
    return callback(null, resultsNew);
  });
}

app.post("/s2", function (req, res) {
  let body = req.body;
  //sql de tiendas mas join de direcciones nota(falta incluir el catalogo de productos podria tenerlo de una)
  let sql =
    "SELECT  tiendas.id, direccions.longitud , direccions.latitud, direccions.rango FROM tiendas JOIN direccions where tiendas.direccion_id = direccions.id";
  //emulando que entran varioas latitudes de las tiendas

  query(sql, (error, result) => {
    let positionToken = [];
    let positions = result;
    positions.forEach((element) => {
      let positionsfor = s2.RegionCoverer.getRadiusCoveringTokens(
        new s2.LatLng(Number(element.latitud), Number(element.longitud)),
        Number(element.rango),
        {
          min: 16,
          max: 16,
        }
      );

      let positionTokenForma = {
        tokens: positionsfor,
        id: element.id,
      };
      //pushando la todos los tokens de tokens
      positionToken.push(positionTokenForma);
    });

    //esta es la posicion del usuario
    let usuario = s2.RegionCoverer.getRadiusCoveringTokens(
      new s2.LatLng(Number(body.lat), Number(body.lng)),
      1,
      { min: 16, max: 16 }
    );

    //aqui se  comparara el token de ese usuario con el array de los token de las tiendas
    let results = [];
    positionToken.forEach((element) => {
      element.tokens.forEach((value) => {
        if (value == usuario) {
          let resulforma = {
            token: value,
            id: element.id,
          };
          results.push(resulforma);
        }
      });
    });

    res.json(results);
  });
});

app.listen(process.env.PORT, () => {
  console.log("Escuchando puerto: ", process.env.PORT);
});
