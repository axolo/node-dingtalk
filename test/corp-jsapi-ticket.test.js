'use strict';

const DingtalkSdk = require('../src');

const { agentId, appKey, appSecret } = process.env;
const config = { appKey, appSecret };
const dingtalkSdk = new DingtalkSdk(config);

dingtalkSdk.getJsapiTicket().then(jsapiTicket => {
  console.log({ jsapiTicket, ttl: 7200, agentId: parseInt(agentId) });
});

