# node-dingtalk

Dingtalk OpenAPI Node.js SDK.

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
| eventToken          |       | encrypt token of Dingtalk Event HTTP callback                  |
| eventAesKey         |       | encrypt aesKey of Dingtalk Event HTTP callback                 |

> return

A instance of `Dingtalk` OpenAPI Node.js SDK.

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

### callback({ signature, timestamp, nonce, encrypt })

See [dingtalk callback] for help. This method use as middleware usualy.

> params

|  params   |   description    |
| --------- | ---------------- |
| signature | signature string |
| timestamp | timestamp string |
| nonce     | nonce string     |
| encrypt   | encrypt string   |

> return

|  params  |           description           |
| -------- | ------------------------------- |
| event    | event decrypted of callback     |
| response | response encrypted for callback |

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

## Test

### config

Create `.env` in project root.

```ini
## corp app
# appMode = corp
# appType = eapp
appKey = APP_KEY
appSecret = APP_SECRET

## isv app
appMode = isv
appType = h5
suiteKey = SUITE_KEY
suiteSecret = SUITE_SECRET
eventToken = EVENT_TOKEN
eventAesKey = EVENT_AES_KEY
# get corpId and appId from dingtalk-jsapi or querystring
corpId = CROP_ID
appId = APP_ID
```

### run

```bash
# test DingtalkSdk.execute
yarn test
# or run unit test by sigle file, like
# test config
node ./test/config.test.js
```

## TODO

- class: DingtalkSdkCache
- test: Assertion Testing

## Thanks

- [dingtalk-encrypt](https://github.com/elixirChain/dingtalk-encrypt)

> Yueming Fang

[axios]: https://github.com/axios/axios
[cache-manager]: https://github.com/BryanDonovan/node-cache-manager
[dingtalk open api]: https://oapi.dingtalk.com
[dingtalk error]: https://ding-doc.dingtalk.com/doc#/faquestions/rftpfg
[dingtalk callback]: https://ding-doc.dingtalk.com/doc#/serverapi3/igq88i
[dingtalk jsapi ticket]: https://ding-doc.dingtalk.com/doc#/dev/uwa7vs
