'use strict';

// **Usage:**
// let route `POST /dingtalk/callback` accessable on internet.
// set dingtalk app callback URL point to link of route `POST /dingtalk/callback`.
// see https://ding-doc.dingtalk.com/doc#/serverapi3/igq88i for more help.

const express = require('express');
const bodyParser = require('body-parser');
const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, appId, suiteKey, suiteSecret, eventToken, eventAesKey } = process.env;
const config = { appEnv, appMode, appType, appId, suiteKey, suiteSecret, eventToken, eventAesKey };
const dingtalkSdk = new DingtalkSdk(config);

const app = express();
app.use(bodyParser());

app.get('/', (req, res) => res.send('hello world'));

app.post('/dingtalk/callback', (req, res) => {
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

const { httpPort = 3000 } = process.env;
app.listen(httpPort);

console.log(`HTTP Server is running at: ${httpPort}`);
