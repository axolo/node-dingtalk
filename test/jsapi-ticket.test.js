'use strict';

const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, appId, suiteKey, suiteSecret, corpId } = process.env;
const config = { appEnv, appMode, appType, appId, suiteKey, suiteSecret };
const dingtalkSdk = new DingtalkSdk(config);

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
