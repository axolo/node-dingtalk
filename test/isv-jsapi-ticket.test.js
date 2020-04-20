'use strict';

const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, appId, suiteKey, suiteSecret, corpId } = process.env;
const config = { appEnv, appMode, appType, appId, suiteKey, suiteSecret };
const dingtalkSdk = new DingtalkSdk(config);

const ticket = dingtalkSdk.getJsapiTicket({ corpId });
const auth = dingtalkSdk.getAuthInfo({ corpId });

Promise.all([ ticket, auth ]).catch(err => {
  console.log(err);
}).then(([ jsapiTicket, authInfo ]) => {
  const { auth_info } = authInfo;
  const appid = parseInt(appId);
  const { agentid: agentId } = auth_info.agent.find(agent => agent.appid === appid);
  console.log({ jsapiTicket, ttl: 7200, corpId, appId: appid, agentId });
});
