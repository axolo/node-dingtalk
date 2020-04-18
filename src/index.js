'use strict';

const crypto = require('crypto');
const axios = require('axios');
const cacheManager = require('cache-manager');
const deepmerge = require('deepmerge');
const DingtalkSdkError = require('./error');
const DingtalkSdkEvent = require('./event');

class DingtalkSdk {
  constructor(config) {
    const defaultConfig = {
      axios,
      cache: { store: 'memory', prefix: 'dingtalk' },
      suiteTicket: 'suiteTicket', // 测试应用可为任意字符串
      baseUrl: 'https://oapi.dingtalk.com',
      jsapiTicketUrl: 'https://oapi.dingtalk.com/get_jsapi_ticket',
      corpAppAuthTokenUrl: 'https://oapi.dingtalk.com/gettoken',
      isvAppAuthTokenUrl: 'https://oapi.dingtalk.com/service/get_corp_token',
      isvAppAuthInfoUrl: 'https://oapi.dingtalk.com/service/get_auth_info',
      isvAppAgentUrl: 'https://oapi.dingtalk.com/service/get_agent',
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
   * mode | prefix   | type        | suffix
   * -----|----------|-------------|----------
   * corp | dingtalk | accessToken | appKey
   * corp | dingtalk | jsapiTicket | accessToken
   * isv  | dingtalk | suiteTicket | suiteKey
   * isv  | dingtalk | accessToken | suiteKey.corpId
   * isv  | dingtalk | jsapiTicket | accessToken
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
   * **生成三方访问接口签名**
   *
   * 注意：`encodeURIComponent`一般由Http Client实现，axios自动转码
   *
   * @see https://open-doc.dingtalk.com/microapp/faquestions/oh7ngo
   * @param {string} timestamp 时间戳，毫秒
   * @param {string} suiteTicket isv suiteTicket
   * @param {string} suiteSecret isv app suiteSecret`
   * @return {string} 签名
   * @memberof DingtalkSdk
   */
  async signature(timestamp, suiteTicket, suiteSecret) {
    const data = [ timestamp, suiteTicket ].join('\n');
    const sign = crypto.createHmac('SHA256', suiteSecret).update(data, 'utf8');
    return sign.digest('base64');
  }

  /**
   * **获取钉钉企业内部应用令牌**
   *
   * @param {object} { appKey, appSecret }，企业应用appKey, appSecret
   * @return {string} access_token，企业内部应用令牌
   * @memberof DingtalkSdk
   */
  async getCorpAppToken({ appKey, appSecret }) {
    const { config } = this;
    const { corpAppAuthTokenUrl: url, cache } = config;
    const cacheKey = [ cache.prefix, 'accessToken', appKey ].join('.');
    const cacheValue = await this.getCache(cacheKey);
    if (cacheValue) return cacheValue;
    const params = { appkey: appKey, appsecret: appSecret };
    const { data: result } = await this.axios({ url, params });
    if (!result) throw new DingtalkSdkError('get access token failed');
    if (result.errcode) throw new DingtalkSdkError(JSON.stringify(result));
    const { access_token, expires_in } = result;
    await this.setCache(cacheKey, access_token, { ttl: expires_in });
    return access_token;
  }

  /**
   * **获取套件票据**
   *
   * 套件票据推送途径
   * 1. HTTP Event Callback {@link DingtalkSdk#callback}
   * 2. Dingtalk Cloud Push {@link https://ding-doc.dingtalk.com/doc#/ln6dmh/gnu28b}
   *
   * @param {string} suiteKey suiteKey
   * @return {string} suiteTicket
   * @memberof DingtalkSdk
   */
  async getSuiteTicket(suiteKey) {
    const { config } = this;
    const { suiteTicket, cache } = config;
    // get suite ticket from cache set by HTTP callback or Dingtalk Cloud Push
    const cacheKey = [ cache.prefix, 'suiteTicket', suiteKey ].join('.');
    const cacheValue = await this.getCache(cacheKey);
    if (cacheValue) return cacheValue;
    return [ suiteKey, suiteTicket ].join('.');
  }

  /**
   * **获取第三方企业应用授权企业令牌**
   *
   * @param {object} { suiteKey, suiteSecret, corpId } 参数
   * @return {string} access_token，授权企业令牌
   * @memberof DingtalkSdk
   */
  async getIsvAppToken({ suiteKey, suiteSecret, corpId }) {
    const { config } = this;
    const { isvAppAuthTokenUrl: url, cache } = config;
    const cacheKey = [ cache.prefix, 'accessToken', suiteKey, corpId ].join('.');
    const cacheValue = await this.getCache(cacheKey);
    if (cacheValue) return cacheValue;
    const timestamp = Date.now();
    const suiteTicket = await this.getSuiteTicket(suiteKey);
    const signature = await this.signature(timestamp, suiteTicket, suiteSecret);
    const method = 'POST';
    const params = { accessKey: suiteKey, timestamp, suiteTicket, signature };
    const data = { auth_corpid: corpId };
    const { data: result } = await this.axios({ url, params, method, data });
    if (!result) throw new DingtalkSdkError('get access token failed');
    if (result.errcode) throw new DingtalkSdkError(JSON.stringify(result));
    const { access_token, expires_in } = result;
    await this.setCache(cacheKey, access_token, { ttl: expires_in });
    return access_token;
  }

  /**
   * **获取令牌**
   *
   * 根据参数获取企业内部应用令牌或第三方企业应用令牌
   *
   * @param {object} options 参数
   * @return {string} 令牌
   * @memberof DingtalkSdk
   */
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

  async getJsapiTicket({ accessToken, type = 'jsapi' }) {
    const { config } = this;
    const { jsapiTicketUrl: url, cache } = config;
    const cacheKey = [ cache.prefix, 'jsapiTicket', accessToken ].join('.');
    const cacheValue = await this.getCache(cacheKey);
    if (cacheValue) return cacheValue;
    const params = { access_token: accessToken, type };
    const { data: result } = await this.axios({ url, params });
    if (!result) throw new DingtalkSdkError('get jsapi ticket failed');
    if (result.errcode) throw new DingtalkSdkError(JSON.stringify(result));
    const { ticket, expires_in } = result;
    await this.setCache(cacheKey, ticket, { ttl: expires_in });
    return ticket;
  }

  async getAuthInfo({ suiteKey, suiteSecret, corpId }) {
    const { config } = this;
    const { isvAppAuthInfoUrl: url } = config;
    const timestamp = Date.now();
    const suiteTicket = await this.getSuiteTicket(suiteKey);
    const signature = await this.signature(timestamp, suiteTicket, suiteSecret);
    const method = 'POST';
    const params = { accessKey: suiteKey, timestamp, suiteTicket, signature };
    const data = { auth_corpid: corpId };
    const { data: result } = await this.axios({ url, params, method, data });
    if (result.errcode) throw new DingtalkSdkError(JSON.stringify(result));
    return result;
  }

  async getAgent({ suiteKey, suiteSecret, corpId, agentId }) {
    const { config } = this;
    const { isvAppAgentUrl: url } = config;
    const timestamp = Date.now();
    const suiteTicket = await this.getSuiteTicket(suiteKey);
    const signature = await this.signature(timestamp, suiteTicket, suiteSecret);
    const method = 'POST';
    const params = { accessKey: suiteKey, timestamp, suiteTicket, signature };
    const data = { suite_key: suiteKey, auth_corpid: corpId, agentid: parseInt(agentId) };
    const { data: result } = await this.axios({ url, params, method, data });
    if (result.errcode) throw new DingtalkSdkError(JSON.stringify(result));
    return result;
  }

  getAgentId(agents, appId) {
    const { agentid } = agents.find(agent => agent.appid === appId);
    return agentid;
  }

  async execute(request) {
    const { config } = this;
    const { baseUrl } = config;
    const access_token = await this.getToken(config);
    const url = baseUrl + request.url;
    const options = deepmerge(request, { url, params: { access_token } });
    const { data: response } = await this.axios(options);
    return response;
  }

  async callback(request) {
    const { appMode, appKey, suiteKey, eventToken, eventAesKey } = this.config;
    const key = appMode === 'isv' ? suiteKey : appKey;
    const dingtalkSdkEvent = new DingtalkSdkEvent({ token: eventToken, aesKey: eventAesKey, key });
    const event = await dingtalkSdkEvent.decrypt(request);
    const { EventType } = event;
    switch (EventType) {
      default: break;
      // update suiteTicket in cache
      case 'suite_ticket': {
        const { SuiteKey, SuiteTicket } = event;
        const { cache } = this.config;
        const cacheKey = [ cache.prefix, 'suiteTicket', SuiteKey ].join('.');
        await this.setCache(cacheKey, SuiteTicket);
      }
    }
    const { timestamp } = request;
    const response = dingtalkSdkEvent.response({ timestamp });
    return { event, response };
  }
}

module.exports = DingtalkSdk;
