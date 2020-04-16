# node-dingtalk

Dingtalk OpenAPI SDK for Node.js.

## Install

```bash
yarn add @axolo/node-dingtalk
```

## API

### constructor(config)

> params

|       config        | mode  |                          description                           |
| ------------------- | :---: | -------------------------------------------------------------- |
| baseUrl             |       | base url, default [dingtalk open api]                          |
| corpAppAuthTokenUrl |       | corp internal app get access token url                         |
| isvAppAuthTokenUrl  |       | isv app get access token url                                   |
| isvAppAuthCorpUrl   |       | isv app get auth corp info url                                 |
| cache               |       | [cache-manager] setting for acccess token and jsapi ticket     |
| axios               |       | HTTP Client, use [axios]                                       |
| appMode             |       | `corp` = corp internal app, `isv` = isv app, default to `corp` |
| appType             |       | `eapp` = mini app, `h5` = web app, default to `eapp`           |
| appKey              | corp  | appKey                                                         |
| appSecret           | crop  | appSecret                                                      |
| suiteKey            |  isv  | suiteKey                                                       |
| suiteSecret         |  isv  | suiteSecret                                                    |
| encryptToken        |  isv  | encrypt token for Dingtalk HTTP callback                       |
| encryptKey          |  isv  | encrypt key for Dingtalk HTTP callback                         |

> return

A instance of `Dingtalk` Node.js SDK.

### execute(request)

more request options see [axios].

> params

| request |                           description                           |
| ------- | --------------------------------------------------------------- |
| url     | dingtalk Open API url without baseUrl, like `/user/getuserinfo` |
| method  | HTTP Method                                                     |
| headers | HTTP Headers                                                    |
| params  | HTTP querystring as Object by GET                               |
| body    | HTTP body as Object by POST/PATCH/PUT                           |

> return

Get data or throw [dingtalk error] from Dingtalk Open API.

### callback(ctx)

This method use as middleware usualy. See [dingtalk callback] for help.

> params

|           ctx           |   description    |
| ----------------------- | ---------------- |
| method                  | `POST`           |
| request.query.signature | signature string |
| request.query.timestamp | timestamp        |
| request.query.nonce     | nonce string     |
| request.body.encrypt    | encrypt string   |

> return

Response encrypt data of decrypt request.

## Example

### request

```js
const DingtalkSdk = require('@axolo/node-dingtalk');

const config = {
  appKey: 'APP_KEY',
  appSecret: 'APP_SECRET',
};
const dingtalkSdk = new DingtalkSdk(config);

const request = {
  url: '/user/getuserinfo',
  body: { code: 'authcode' },
};
dingtalk
  .execute(request)
  .catch(err => console.log(err))
  .then(res => console.log(res));
```

### callback

A middleware of Egg.js.

```js
// router.js
// const dingtalk = new Dingtalk(config);
module.exports = app => {
  const { router } = app;
  router.post('/dingtalk/callback', ctx => dingtalk.callback(ctx));
}
```

### jsapiTicket

## Test

### config

Create `.env` in project root.

```ini
appKey = APP_KEY
appSecret = APP_SECRET
```

| appType |  appKey  |  appSecret  |
| ------- | -------- | ----------- |
| corp    | appKey   | appSecret   |
| isv     | suiteKey | suiteSecret |

### run

```bash
yarn dev
```

## TODO

- Assertion Testing

> Yueming Fang

[axios]: https://github.com/axios/axios
[cache-manager]: https://github.com/BryanDonovan/node-cache-manager
[dingtalk open api]: https://oapi.dingtalk.com
[dingtalk error]: https://ding-doc.dingtalk.com/doc#/faquestions/rftpfg
[dingtalk callback]: https://ding-doc.dingtalk.com/doc#/serverapi3/igq88i
[dingtalk jsapi ticket]: https://ding-doc.dingtalk.com/doc#/dev/uwa7vs
