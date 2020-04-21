'use strict';

const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, appKey, appSecret, appId, suiteKey, suiteSecret, corpId } = process.env;
const config = { appEnv, appMode, appType, appKey, appSecret, appId, suiteKey, suiteSecret };
const dingtalkSdk = new DingtalkSdk(config);


dingtalkSdk.getJsapiTicket({
  corpId,
}).catch(err => {
  console.log(err);
}).then(jsapiTicket => {
  console.log({ jsapiTicket, ttl: 7200 });
});
