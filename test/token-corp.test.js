'use strict';

const DingtalkSdk = require('../src');


const { appId, appKey, appSecret } = process.env;
const config = { appId, appKey, appSecret };
const dingtalkSdk = new DingtalkSdk(config);

dingtalkSdk.getCorpAppToken({ appKey, appSecret })
  .catch(err => console.log(err))
  .then(accessToken => console.log({ accessToken }));
