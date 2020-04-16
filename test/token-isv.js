'use strict';

const DingtalkSdk = require('../src');
const { parsed: config } = require('dotenv').config();

const dingtalkSdk = new DingtalkSdk(config);

// access token cache
const { suiteKey, suiteSecret } = config;
const corpId = 'dinge949e272101485d935c2f4657eb6378f';
dingtalkSdk.getIsvAppToken({ suiteKey, suiteSecret, corpId })
  .catch(err => console.log(err))
  .then(res => console.log(res));
