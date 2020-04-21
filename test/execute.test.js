'use strict';

const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, appKey, appSecret, appId, suiteKey, suiteSecret, corpId } = process.env;
const config = { appEnv, appMode, appType, appKey, appSecret, appId, suiteKey, suiteSecret, corpId };
const dingtalkSdk = new DingtalkSdk(config);

dingtalkSdk.execute('/user/simplelist', {
  params: { department_id: 1 },
}, {
  corpId,
}).catch(err => {
  console.log(err);
}).then(res => {
  console.log(res);
});
