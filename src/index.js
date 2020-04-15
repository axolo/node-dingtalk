'use strict';

const axios = require('axios');
const cacheManager = require('cache-manager');
const deepmerge = require('deepmerge');
const DingtalkError = require('./lib/dingtalk-error');

class Dingtalk {
  constructor(config) {
    const defaultConfig = {
      baseUrl: 'https://oapi.dingtalk.com',
      corpAppAuthTokenUrl: 'https://oapi.dingtalk.com/gettoken',
      isvAppAuthTokenUrl: 'https://oapi.dingtalk.com/service/get_corp_token',
      cache: { store: 'memory', prefix: 'dingtalk', ttl: 7200 },
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
   * @return {Promise}    缓存
   * @memberof Nuonuo
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
   * @param {string} key      键
   * @param {Any} val         值
   * @param {object} options  选项
   * @return {Promise}        缓存
   * @memberof Nuonuo
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

  async getCorpAppToken(appKey, appSecret) {
    const { config } = this;
    const { corpAppAuthTokenUrl: url, cache } = config;
    const cacheKey = [ cache.prefix, 'corp', 'token', appKey ].join('-');
    const cacheToken = await this.getCache(cacheKey);
    if (cacheToken) return cacheToken;
    const params = { appkey: appKey, appsecret: appSecret };
    const { data: token } = await this.axios({ url, params });
    if (!token) throw new DingtalkError('dingtalk access token required');
    if (token.errcode) throw new DingtalkError(token);
    await this.setCache(cacheKey, token, cache);
    return token;
  }

  async getToken({ appMode, appKey, appSecret }) {
    switch (appMode) {
      default: {
        const token = await this.getCorpAppToken(appKey, appSecret);
        return token;
      }
    }
  }

  async execute(request = {}) {
    const { config } = this;
    const { appKey, appSecret, baseUrl } = config;
    const token = await this.getToken({ appKey, appSecret });
    const { access_token } = token;
    const url = baseUrl + request.url;
    const options = deepmerge(request, { url, params: { access_token } });
    const { data: response } = await this.axios(options);
    return response;
  }

  async callback(ctx) {
    console.log(ctx);
    // TODO: response encrypt message to dingtalk
    ctx.body = 'success';
  }
}

module.exports = Dingtalk;
