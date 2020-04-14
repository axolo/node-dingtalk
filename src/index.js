'use strict';

const urllib = require('urllib');
const cacheManager = require('cache-manager');
const deepmerge = require('deepmerge');

class Dingtalk {
  constructor(config) {
    const defaultConfig = {
      curl: urllib.request,
      dataType: 'json',
      // headers: { 'Content-Type': 'application/json' },
      cache: {
        store: 'memory',
        prefix: 'dingtalk',
        ttl: 7200, // 2 hours
      },
    };
    this.config = deepmerge(defaultConfig, config);
    const { curl, cache } = this.config;
    this.curl = curl;
    this.cache = cacheManager.caching(cache);
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

  async execute(request) {
    const { curl, config } = this;
    const { baseUrl, dataType } = config;
    const { url } = request;
    const options = { dataType, ...request };
    console.log(baseUrl + url, options);
    const response = await curl(baseUrl + url, options);
    return response;
  }

  async callback(ctx) {
    console.log(ctx);
    // TODO: response encrypt message to dingtalk
    ctx.body = 'success';
  }
}

module.exports = Dingtalk;
