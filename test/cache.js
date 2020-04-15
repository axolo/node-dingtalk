'use strict';

const Dingtalk = require('../src');
const { parsed: config } = require('dotenv').config();

const dingtalk = new Dingtalk(config);

// access token cache
const { appKey, appSecret } = config;
dingtalk.getToken({ appKey, appSecret })
  .catch(err => console.log(err))
  .then(res => console.log(res));
