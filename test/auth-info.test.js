'use strict';

const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, appId, suiteKey, suiteSecret, corpId } = process.env;
const config = { appEnv, appMode, appType, appId, suiteKey, suiteSecret };
const dingtalkSdk = new DingtalkSdk(config);

dingtalkSdk.getAuthInfo({
  corpId,
}).catch(err => {
  console.log(err);
}).then(res => {
  console.log(res);
  // same appId diffrent agentId per corp
  console.log(res.auth_info);
});
