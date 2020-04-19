'use strict';

// **Usage:**
// let route `POST /dingtalk/callback` accessable on internet.
// set dingtalk app callback URL point to link of route `POST /dingtalk/callback`.
// see https://ding-doc.dingtalk.com/doc#/serverapi3/igq88i for more help.

const express = require('express');
const bodyParser = require('body-parser');
const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, suiteKey, suiteSecret, eventToken, eventAesKey, httpPort = 3000 } = process.env;
const config = { appEnv, appMode, appType, suiteKey, suiteSecret, eventToken, eventAesKey };
const dingtalkSdk = new DingtalkSdk(config);

const app = express();
const jsonParser = bodyParser.json();

app.get('/', (req, res) => res.send('hello world'));

app.post('/dingtalk/callback', jsonParser, (req, res) => {
  const { signature, timestamp, nonce } = req.query;
  const { encrypt } = req.body;
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

app.listen(httpPort);

console.log(`HTTP Server is running at: ${httpPort}`);
