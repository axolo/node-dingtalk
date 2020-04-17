'use strict';

const DingtalkSdk = require('../src');
const { parsed: config } = require('dotenv').config();

const dingtalkSdk = new DingtalkSdk(config);
const { suiteKey, suiteSecret, corpId, appId } = config;

dingtalkSdk.getIsvAppToken({
  suiteKey,
  suiteSecret,
  corpId,
}).catch(err => {
  console.log(err);
}).then(accessToken => {
  const ticket = dingtalkSdk.getJsapiTicket({ accessToken });
  const auth = dingtalkSdk.getAuthInfo({ suiteKey, suiteSecret, corpId });
  Promise.all([ ticket, auth ]).catch(err => {
    console.log(err);
  }).then(([ jsapiTicket, authInfo ]) => {
    const { auth_info: { agent } } = authInfo;
    const agentId = dingtalkSdk.getAgentId(agent, parseInt(appId));
    console.log({ jsapiTicket, agentId });
  });
});
