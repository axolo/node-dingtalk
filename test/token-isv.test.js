'use strict';

const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, suiteKey, suiteSecret, corpId } = process.env;
const config = { appEnv, appMode, appType, suiteKey, suiteSecret };
const dingtalkSdk = new DingtalkSdk(config);

dingtalkSdk.getIsvAppToken({ suiteKey, suiteSecret, corpId })
  .catch(err => console.log(err))
  .then(accessToken => console.log({ accessToken }));
