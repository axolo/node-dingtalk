'use strict';

// **Usage:**
// let route `POST /dingtalk/callback` accessable on internet.
// set dingtalk app callback URL point to link of route `POST /dingtalk/callback`.
// see https://ding-doc.dingtalk.com/doc#/serverapi3/igq88i for more help.

const Koa = require('koa');
const app = new Koa();
const bodyParser = require('koa-bodyparser');
const router = require('koa-router')();
const DingtalkSdk = require('../src');

const { appEnv, appMode, appType, suiteKey, suiteSecret, eventToken, eventAesKey, httpPort = 3000 } = process.env;
const config = { appEnv, appMode, appType, suiteKey, suiteSecret, eventToken, eventAesKey };
const dingtalkSdk = new DingtalkSdk(config);

router.get('/', async ctx => { ctx.body = 'Hello World'; });

router.post('/dingtalk/callback', async ctx => {
  const { query = {}, body = {} } = ctx.request;
  const { signature, timestamp, nonce } = query;
  const { encrypt } = body;
  const res = await dingtalkSdk.callback({ signature, timestamp, nonce, encrypt });
  const { event, response } = res;
  console.log(__filename, event);
  ctx.body = response;
});

app.use(bodyParser());
app.use(router.routes(), router.allowedMethods());
app.listen(httpPort);

console.log(`HTTP Server is running at: ${httpPort}`);
