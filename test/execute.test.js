'use strict';

const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, suiteKey, suiteSecret, corpId } = process.env;
const config = { appEnv, appMode, appType, suiteKey, suiteSecret, corpId };
const dingtalkSdk = new DingtalkSdk(config);

dingtalkSdk.execute({
  url: '/user/simplelist',
  params: { department_id: 1 },
}).catch(err => {
  console.log(err);
}).then(res => {
  console.log(res);
});
