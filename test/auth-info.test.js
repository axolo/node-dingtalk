'use strict';

const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, suiteKey, suiteSecret, corpId } = process.env;
const config = { appEnv, appMode, appType, suiteKey, suiteSecret };
const dingtalkSdk = new DingtalkSdk(config);

dingtalkSdk.getAuthInfo({
  suiteKey,
  suiteSecret,
  corpId,
}).catch(err => {
  console.log(err);
}).then(res => {
  console.log(res);
  // same appId diffrent agentId per corp
  console.log(res.auth_info);
});
