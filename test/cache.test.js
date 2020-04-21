'use strict';

const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, appKey, appSecret, appId, suiteKey, suiteSecret, corpId } = process.env;
const config = { appEnv, appMode, appType, appKey, appSecret, appId, suiteKey, suiteSecret, corpId };
const dingtalkSdk = new DingtalkSdk(config);

const accessToken = dingtalkSdk.getToken(config);
const jsapiTicket = dingtalkSdk.getJsapiTicket(config);

Promise.all([ accessToken, jsapiTicket ]).then(() => {
  dingtalkSdk.cache.keys().then(keys => {
    return Promise.all(keys.map(async key => {
      return { [key]: await dingtalkSdk.cache.get(key) };
    })).then(caches => {
      console.log(caches);
    });
  });
});
