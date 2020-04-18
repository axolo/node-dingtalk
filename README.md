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

|       config        | required | default |                 description                 |
| ------------------- | :------: | :-----: | ------------------------------------------- |
| appKey              |   true   |         | appKey                                      |
| appSecret           |   true   |         | appSecret                                   |
| appMode             |          | `corp`  | `corp` = corp internal app, `isv` = isv app |
| appType             |          | `eapp`  | `eapp` = mini app, `h5` = web app           |
| baseUrl             |          | builtin | base url of [dingtalk open api]             |
| corpAppAuthTokenUrl |          | builtin | get access token url                        |
| cache               |          | builtin | cache setting, use [cache-manager]          |
| axios               |          | builtin | HTTP Client, use [axios]                    |

#### isv app

|       config       | required | default |                 description                 |
| ------------------ | :------: | :-----: | ------------------------------------------- |
| suiteKey           |   true   |         | suiteKey                                    |
| suiteSecret        |   true   |         | suiteSecret                                 |
| suiteId            |   true   |         | [dingtalk cloud push] set suiteTicket       |
| eventToken         |   true   |         | [http event callback] encrypt token         |
| eventAesKey        |   true   |         | [http event callback] encrypt aesKey        |
| appMode            |  `isv`   | `corp`  | `corp` = corp internal app, `isv` = isv app |
| appType            |          | `eapp`  | `eapp` = mini app, `h5` = web app           |
| baseUrl            |          | builtin | base url of [dingtalk open api]             |
| isvAppAuthTokenUrl |          | builtin | get access token url                        |
| isvAppAuthInfoUrl  |          | builtin | get auth info url                           |
| isvAppAgentUrl     |          | builtin | get agent info url                          |
| cache              |          | builtin | cache setting, use [cache-manager]          |
| axios              |          | builtin | HTTP Client, use [axios]                    |

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

### config

Create `.env` in project root.

> corp app

```ini
## corp app
# appMode = corp
# appType = eapp
appKey = APP_KEY
appSecret = APP_SECRET
```

> isv app

```ini
## http server for callback listen port 3000 default
httpPort = 3000
## isv app
appMode = isv
appType = h5
suiteKey = SUITE_KEY
suiteSecret = SUITE_SECRET
# suiteId is required of Dingtalk Cloud Push
suiteId = SUITE_ID
# eventToken and eventAesKey is required of HTTP Event Callback
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

## Appendix

### Dingtalk app mode

- corp
- isv
- person
- custom

### Dingtalk app type

- h5
- eapp

### Dingtalk event push

- HTTP Event Callback
- Dingtalk Cloud Push

## TODO

- event: [dingtalk cloud push]
- class: `DingtalkSdkCache`
- cache: use `Redis`, `MySQL`, etc.
- test: Assertion Testing

## Thanks

- [dingtalk-encrypt](https://github.com/elixirChain/dingtalk-encrypt)

> Yueming Fang

[axios]: https://github.com/axios/axios
[cache-manager]: https://github.com/BryanDonovan/node-cache-manager
[dingtalk open api]: https://oapi.dingtalk.com
[dingtalk error]: https://ding-doc.dingtalk.com/doc#/faquestions/rftpfg
[http event callback]: https://ding-doc.dingtalk.com/doc#/serverapi3/igq88i
[dingtalk jsapi ticket]: https://ding-doc.dingtalk.com/doc#/dev/uwa7vs
[dingtalk cloud push]: https://ding-doc.dingtalk.com/doc#/ln6dmh/gnu28b
