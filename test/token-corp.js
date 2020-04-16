'use strict';

const DingtalkSdk = require('../src');
const { parsed: config } = require('dotenv').config();

const dingtalkSdk = new DingtalkSdk(config);

// access token cache
const { appKey, appSecret } = config;
dingtalkSdk.getCorpAppToken({ appKey, appSecret })
  .catch(err => console.log(err))
  .then(res => console.log(res));
