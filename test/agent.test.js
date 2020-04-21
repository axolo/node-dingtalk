'use strict';

const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, appKey, appSecret, agentId, appId, suiteKey, suiteSecret, corpId } = process.env;
const config = { appEnv, appMode, appType, appKey, appSecret, agentId, appId, suiteKey, suiteSecret };
const dingtalkSdk = new DingtalkSdk(config);


dingtalkSdk.getAgentId({
  corpId,
}).catch(err => {
  console.log(err);
}).then(agentId => {
  console.log({ agentId });
  dingtalkSdk.getAgent({
    corpId,
    agentId,
  }).then(agent => {
    console.log({ agent });
  });
});
