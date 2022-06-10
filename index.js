const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const _ = require('underscore');
const port = process.env.PORT || parseInt(process.argv.pop()) || 3002;

server.listen(port, function () {
  console.log("Server listening at port %d", port);
});

const ShwarmaOrder = require("./ShawarmaOrder");
const { exception } = require('console');

// Create a new express application instance

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("www"));

let oSockets = {};
let oOrders = {};
app.post("/payment/:phone", (req, res) => {
  // this happens when the order is complete
    let sFrom = req.params.phone;
    let msg = req.body.purchase_units[0].shipping.address.address_line_1+" "+req.body.purchase_units[0].shipping.address.admin_area_1+" "+req.body.purchase_units[0].shipping.address.admin_area_2
    +" "+req.body.purchase_units[0].shipping.address.country_code;
    console.log(msg);
    const aReply = oOrders[sFrom].handleInput(msg);
    const oSocket = oSockets[sFrom];
    // send messages out of turn
    for (let n = 0; n < aReply.length; n++) {
      if (oSocket) {
        const data = {
          message: aReply[n]
        };
        oSocket.emit('receive message', data);
      } else {
        throw("Error Happened");
      }
    }
    if (oOrders[sFrom].isDone()) {
      delete oOrders[sFrom];
      delete oSockets[sFrom];
    }
    res.end("ok");
});

app.get("/payment/:phone", (req, res) => {
  // this happens when the user clicks on the link in SMS
  const sFrom = req.params.phone;
  if (!oOrders.hasOwnProperty(sFrom)) {
    res.end("order already complete");
  } else {
    res.end(oOrders[sFrom].renderForm());
  }
});

app.post("/payment", (req, res) => {
  // this happens when the user clicks on the link in SMS
  //const sFrom = req.params.phone;
  const sFrom = req.body.telephone;
  oOrders[sFrom] = new ShwarmaOrder(sFrom);
  res.end(oOrders[sFrom].renderForm(req.body.title, req.body.price));
});

app.post("/sms", (req, res) => {
  // turn taking SMS
  let sFrom = req.body.From || req.body.from;
  let sUrl = `${req.headers['x-forwarded-proto'] || req.protocol}://${req.headers['x-forwarded-host'] || req.headers.host}${req.baseUrl}`;
  if (!oOrders.hasOwnProperty(sFrom)) {
    oOrders[sFrom] = new ShwarmaOrder(sFrom, sUrl);
  }
  if (oOrders[sFrom].isDone()) {
    delete oOrders[sFrom];
  }
  let sMessage = req.body.Body || req.body.body;
  let aReply = oOrders[sFrom].handleInput(sMessage);
  res.setHeader('content-type', 'text/xml');
  let sResponse = "<Response>";
  for (let n = 0; n < aReply.length; n++) {
    sResponse += "<Message>";
    sResponse += aReply[n];
    sResponse += "</Message>";
  }
  res.end(sResponse + "</Response>");
});

io.on('connection', function (socket) {
  // when the client emits 'receive message', this listens and executes
  socket.on('receive message', function (data) {
    // set up a socket to send messages to out of turn
    const sFrom = _.escape(data.from);
    oSockets[sFrom] = socket;
  });
});
