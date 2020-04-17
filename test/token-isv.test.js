'use strict';

const DingtalkSdk = require('../src');
const { parsed: config } = require('dotenv').config();

const dingtalkSdk = new DingtalkSdk(config);
const { suiteKey, suiteSecret, corpId } = config;

dingtalkSdk.getIsvAppToken({ suiteKey, suiteSecret, corpId })
  .catch(err => console.log(err))
  .then(accessToken => console.log({ accessToken }));
