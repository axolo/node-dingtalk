'use strict';

const DingtalkSdk = require('../src');
const { parsed: config } = require('dotenv').config();

const dingtalkSdk = new DingtalkSdk(config);
const { suiteKey, suiteSecret, corpId } = config;

dingtalkSdk.getAuthInfo({ suiteKey, suiteSecret, corpId })
  .catch(err => console.log(err))
  .then(res => console.log(res));
