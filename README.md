# node-dingtalk

Dingtalk OpenAPI Node.js SDK.

## Install

```bash
yarn add @axolo/node-dingtalk
```

## API

### constructor(config)

> params

#### corp app

|  config   | required | default |                 description                 |
| --------- | :------: | :-----: | ------------------------------------------- |
| appMode   |          | `corp`  | `corp` = corp internal app, `isv` = isv app |
| appType   |          | `eapp`  | `eapp` = mini app, `h5` = web app           |
| appId     |   true   |         | appId                                       |
| appKey    |   true   |         | appKey                                      |
| appSecret |   true   |         | appSecret                                   |
| appMode   |          | `corp`  | `corp` = corp internal app, `isv` = isv app |
| appType   |          | `eapp`  | `eapp` = mini app, `h5` = web app           |


#### isv app

|   config    | required | default |                 description                 |
| ----------- | :------: | :-----: | ------------------------------------------- |
| appMode     |  `isv`   | `corp`  | `corp` = corp internal app, `isv` = isv app |
| appType     |          | `eapp`  | `eapp` = mini app, `h5` = web app           |
| appId       |   true   |         | appId                                       |
| suiteId     |   true   |         | [dingtalk cloud push] set suiteTicket       |
| suiteKey    |   true   |         | suiteKey                                    |
| suiteSecret |   true   |         | suiteSecret                                 |
| eventToken  |   true   |         | [http event callback] encrypt token         |
| eventAesKey |   true   |         | [http event callback] encrypt aesKey        |


#### builtin config

|       config        |            description             |
| ------------------- | ---------------------------------- |
| cache               | cache setting, use [cache-manager] |
| axios               | HTTP Client, use [axios]           |
| baseUrl             | base url of [Dingtalk OpenAPI]     |
| corpAppAuthTokenUrl | get access token url of corp app   |
| isvAppAuthTokenUrl  | get access token url of isv app    |
| isvAppAuthInfoUrl   | get auth info url                  |
| isvAppAgentUrl      | get agent info url                 |

> return

A instance of `Dingtalk` OpenAPI Node.js SDK.

### execute(request)

more request options see [axios].

> params

| request |                           description                           |
| ------- | --------------------------------------------------------------- |
| url     | Dingtalk OpenAPI url without baseUrl, like `/user/getuserinfo` |
| method  | HTTP Method                                                     |
| headers | HTTP Headers                                                    |
| params  | HTTP querystring as Object by GET                               |
| body    | HTTP body as Object by POST/PATCH/PUT                           |

> return

Get data or throw [dingtalk error] from Dingtalk OpenAPI.

### callback({ signature, timestamp, nonce, encrypt })

See [http event callback] for help.
This method use as middleware usualy.

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

```bash
yarn test ./test/config.test.js   # test config
yarn test ./test/execute.test.js  # test execute
```

**TIP**: Please create `.env` and `.env.test` in project root before test.

### .env

for corp app

```ini
appId = APP_ID
appKey = APP_KEY
appSecret = APP_SECRET
```

for isv app

```ini
appMode = isv
appType = h5
appId = APP_ID
# suiteId is required of Dingtalk Cloud Push
suiteId = SUITE_ID
suiteKey = SUITE_KEY
suiteSecret = SUITE_SECRET
# eventToken and eventAesKey is required of HTTP Event Callback
eventToken = EVENT_TOKEN
eventAesKey = EVENT_AES_KEY
```

### .env.test

```ini
## http server for http event callback
httpPort = 7001

## mysql rds for dingtalk cloud push
rdsHost = your.mysql.host
rdsPort = 3306
rdsUser = user
rdsPassword = password
rdsDatabase = ding_cloud_push

# get corpId and appId from dingtalk-jsapi or querystring
corpId = CROP_ID
```

## TODO

- cache: class `DingtalkSdkCache`, support `memory`, `redis`, `mysql`, etc.
- test: Assertion Testing with Mocha or Jest.

## Thanks

- [dingtalk-encrypt](https://github.com/elixirChain/dingtalk-encrypt)

> Yueming Fang

[axios]: https://github.com/axios/axios
[cache-manager]: https://github.com/BryanDonovan/node-cache-manager
[Dingtalk OpenAPI]: https://oapi.dingtalk.com
[dingtalk error]: https://ding-doc.dingtalk.com/doc#/faquestions/rftpfg
[http event callback]: https://ding-doc.dingtalk.com/doc#/serverapi3/igq88i
[dingtalk jsapi ticket]: https://ding-doc.dingtalk.com/doc#/dev/uwa7vs
[dingtalk cloud push]: https://ding-doc.dingtalk.com/doc#/ln6dmh/gnu28b
