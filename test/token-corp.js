'use strict';

const DingtalkSdk = require('../src');
const { parsed: config } = require('dotenv').config();

const dingtalkSdk = new DingtalkSdk(config);
const { appKey, appSecret } = config;

dingtalkSdk.getCorpAppToken({ appKey, appSecret })
  .catch(err => console.log(err))
  .then(accessToken => console.log({ accessToken }));
