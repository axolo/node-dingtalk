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
| agentId   |   true   |         | agentId                                     |
| appKey    |   true   |         | appKey                                      |
| appSecret |   true   |         | appSecret                                   |

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

|       config        |           description            |
| ------------------- | -------------------------------- |
| axios               | HTTP Client, use [axios]         |
| cacheManager        | cache,  use [cache-manager]      |
| cache               | cache setting                    |
| baseUrl             | base url of [Dingtalk OpenAPI]   |
| corpAppAuthTokenUrl | get access token url of corp app |
| isvAppAuthTokenUrl  | get access token url of isv app  |
| isvAppAuthInfoUrl   | get auth info url                |
| isvAppAgentUrl      | get agent info url               |

> return

A instance of `Dingtalk` OpenAPI Node.js SDK.

### execute(api, request = {}, scope = {})

more request options see [axios].

> params

|     parmas     |              description               |
| -------------- | -------------------------------------- |
| api            | querystring, Dingtalk OpenAPI          |
| request.method | HTTP Method                            |
| request.params | HTTP querystring as Object by GET      |
| request.body   | HTTP body as Object by POST/PATCH/PUT  |
| scope.corpId   | to get accessToken per corp of isv app |

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

event decrypted of callback.
and `response` is encrypted response for callback success.

## Example

```js
const DingtalkSdk = require('@axolo/node-dingtalk');

const dingtalk = new DingtalkSdk({
  agentId: 'AGENT_ID',
  appKey: 'APP_KEY',
  appSecret: 'APP_SECRET',
});

dingtalk.execute('/user/getuserinfo', {
  body: { code: 'authcode' }
}).catch(err => {
  console.log(err);
}).then(res => {
  console.log(res);
});
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
agentId = AGENT_ID
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

- test: Assertion Testing with Mocha or Jest.
- cache: class `DingtalkSdkCache`, support `memory`, `redis`, `mysql`, etc.
- props: `DingtalkSdk.event`, `DingtalkSdk.error`.

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
