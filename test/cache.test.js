'use strict';

const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, appKey, appSecret, appId, suiteKey, suiteSecret, corpId } = process.env;
const config = { appEnv, appMode, appType, appKey, appSecret, appId, suiteKey, suiteSecret, corpId };
const dingtalkSdk = new DingtalkSdk(config);

dingtalkSdk.getIsvAppToken({
  suiteKey,
  suiteSecret,
  corpId,
}).catch(err => {
  console.log(err);
}).then(accessToken => {
  console.log({ accessToken, ttl: 7200 });
  dingtalkSdk.cache.keys().then(keys => {
    Promise.all(keys.map(key => {
      console.log(key);
      return dingtalkSdk.cache.get(key);
    })).then(caches => {
      console.log(caches);
    });
  });
});

