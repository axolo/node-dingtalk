'use strict';

// **Usage:**
// let route `POST /dingtalk/callback` accessable on internet.
// set dingtalk app callback URL point to link of route `POST /dingtalk/callback`.
// see https://ding-doc.dingtalk.com/doc#/serverapi3/igq88i for more help.

const express = require('express');
const bodyParser = require('body-parser');
const DingtalkSdk = require('../src');

const { parsed: config } = require('dotenv').config();
const dingtalkSdk = new DingtalkSdk(config);

const app = express();
const jsonParser = bodyParser.json();

app.get('/', (req, res) => res.send('hello world'));

app.post('/dingtalk/callback', jsonParser, (req, res) => {
  const { signature, timestamp, nonce } = req.query;
  const { encrypt } = req.body;
  console.log(req.body);
  dingtalkSdk.callback({
    signature,
    timestamp,
    nonce,
    encrypt,
  }).catch(err => {
    res.send(err);
  }).then(result => {
    const { event, response } = result;
    console.log(__filename, event);
    res.send(response || result);
  });
});

app.listen(3000);

console.log('server is running at http://localhost:3000');
