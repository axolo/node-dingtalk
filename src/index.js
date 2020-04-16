'use strict';

const crypto = require('crypto');
const axios = require('axios');
const cacheManager = require('cache-manager');
const deepmerge = require('deepmerge');
const DingtalkSdkError = require('./error');

class DingtalkSdk {
  constructor(config) {
    const defaultConfig = {
      baseUrl: 'https://oapi.dingtalk.com',
      corpAppAuthTokenUrl: 'https://oapi.dingtalk.com/gettoken',
      isvAppAuthTokenUrl: 'https://oapi.dingtalk.com/service/get_corp_token',
      suiteTicket: 'suiteTicket',
      cache: { store: 'memory', prefix: 'dingtalk' },
      axios,
    };
    this.config = deepmerge(defaultConfig, config);
    this.axios = this.config.axios;
    this.cache = cacheManager.caching(this.config.cache);
  }

  /**
   * **获取缓存**
   *
   * @param {string} key  键
   * @return {promise}    缓存
   * @memberof DingtalkSdk
   */
  getCache(key) {
    const { cache } = this;
    return new Promise((resolve, reject) => {
      cache.get(key, (err, res) => {
        if (err) return reject(err);
        return resolve(res);
      });
    });
  }

  /**
   * **设置缓存**
   *
   * mode | prefix   | app      | type
   * -----|----------|----------|-----
   * corp | dingtalk | appKey   | accessToken, jsapiTicket
   * isv  | dingtalk | suiteKey | suiteTicket, corpId.accessToken, corpId.jsapiTicket
   *
   * @param {string} key      键
   * @param {any} val         值
   * @param {object} options  选项
   * @return {promise}        缓存
   * @memberof DingtalkSdk
   */
  setCache(key, val, options) {
    const { cache } = this;
    return new Promise((resolve, reject) => {
      cache.set(key, val, options, err => {
        if (err) return reject(err);
        cache.get(key, (err, res) => {
          if (err) return reject(err);
          return resolve(res);
        });
      });
    });
  }

  /**
   * **获取钉钉企业内部应用令牌**
   *
   * @param {object} { appKey, appSecret }，企业应用appKey, appSecret
   * @return {object} {access_token, expires_in }，包含过期时长的令牌
   * @memberof DingtalkSdk
   */
  async getCorpAppToken({ appKey, appSecret }) {
    const { config } = this;
    const { corpAppAuthTokenUrl: url, cache } = config;
    const cacheKey = [ cache.prefix, appKey, 'accessToken' ].join('.');
    const cacheToken = await this.getCache(cacheKey);
    if (cacheToken) return cacheToken;
    const params = { appkey: appKey, appsecret: appSecret };
    const { data: token } = await this.axios({ url, params });
    if (!token) throw new DingtalkSdkError('get dingtalk access token failed');
    if (token.errcode) throw new DingtalkSdkError(JSON.stringify(token));
    const { access_token, expires_in } = token;
    await this.setCache(cacheKey, access_token, { ttl: expires_in });
    return access_token;
  }

  async getSuiteTicket(suiteKey) {
    // get suite ticket from cache set by callback
    const { config } = this;
    const { suiteTicket } = config;
    return [ suiteKey, suiteTicket ].join('.');
  }

  /**
   * **生成三方访问接口签名**
   *
   * @see https://open-doc.dingtalk.com/microapp/faquestions/oh7ngo
   * @param {string} timestamp 时间戳，毫秒
   * @param {string} suiteTicket isv suiteTicket
   * @param {string} suiteSecret isv app suiteSecret`
   * @return {string} 签名
   * @memberof DingtalkSdk
   */
  async getSignature(timestamp, suiteTicket, suiteSecret) {
    const data = [ timestamp, suiteTicket ].join('\n');
    const sign = crypto.createHmac('SHA256', suiteSecret).update(data, 'utf8');
    return sign.digest('base64');
  }

  async getIsvAppToken({ suiteKey, suiteSecret, corpId }) {
    const { config } = this;
    const { isvAppAuthTokenUrl: url, cache } = config;
    const cacheKey = [ cache.prefix, suiteKey, corpId, 'accessToken' ].join('.');
    const cacheToken = await this.getCache(cacheKey);
    if (cacheToken) return cacheToken;
    const timestamp = Date.now();
    const suiteTicket = await this.getSuiteTicket(suiteKey);
    const signature = await this.getSignature(timestamp, suiteTicket, suiteSecret);
    const method = 'POST';
    const params = { accessKey: suiteKey, timestamp, suiteTicket, signature };
    const data = { auth_corpid: corpId };
    const { data: token } = await this.axios({ url, params, method, data });
    if (!token) throw new DingtalkSdkError('get dingtalk access token failed');
    if (token.errcode) throw new DingtalkSdkError(JSON.stringify(token));
    const { access_token, expires_in } = token;
    await this.setCache(cacheKey, access_token, { ttl: expires_in });
    return access_token;
  }

  async getToken(options) {
    const { appMode } = options;
    switch (appMode) {
      default: {
        const { appKey, appSecret } = options;
        const token = await this.getCorpAppToken({ appKey, appSecret });
        return token;
      }
      case 'isv': {
        const { suiteKey, suiteSecret, corpId } = options;
        const token = await this.getIsvAppToken({ suiteKey, suiteSecret, corpId });
        return token;
      }
    }
  }

  async execute(request = {}) {
    const { config } = this;
    const { appKey, appSecret, baseUrl } = config;
    const access_token = await this.getToken({ appKey, appSecret });
    const url = baseUrl + request.url;
    const options = deepmerge(request, { url, params: { access_token } });
    const { data: response } = await this.axios(options);
    return response;
  }

  async callback(ctx) {
    console.log(ctx);
    // TODO:
    // 1. response encrypt message to dingtalk
    // 2. save suite ticket to cache
    // 3. parse biz data of biz id and biz type
    ctx.body = 'success';
  }
}

module.exports = DingtalkSdk;
