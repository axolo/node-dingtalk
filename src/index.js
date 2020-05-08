'use strict';

const crypto = require('crypto');
const axios = require('axios');
const cacheManager = require('cache-manager');
const deepmerge = require('deepmerge');
const DingtalkSdkError = require('./error');
const DingtalkSdkEvent = require('./event');

/**
 * **钉钉SDK**
 *
 * 钉钉于2019年底修改第三方企业应用架构，从一个套件可不包含或包含多个应用，调整为一个套件有且仅有一个应用。
 * 从此无论企业内部应用还是第三方企业应用，应用均为第一公民，套件遭受降维打击，沦为陪衬。
 * 本SDK亦将应用视为第一公民，以应用为主键，以适应钉钉架构调整。
 * 适应新架构同时兼容历史版本，包含多个应用的历史套件亦可被支持。
 *
 * @class DingtalkSdk
 */
class DingtalkSdk {
  constructor(config) {
    const defaultConfig = {
      axios,
      cacheManager,
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
    this.cache = this.config.cacheManager.caching(this.config.cache);
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
   * corp | dingtalk | jsapiTicket | appKey
   * isv  | dingtalk | suiteTicket | suiteKey
   * isv  | dingtalk | accessToken | suiteKey.corpId
   * isv  | dingtalk | jsapiTicket | suiteKey.corpId
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
  signature(timestamp, suiteTicket, suiteSecret) {
    const data = [ timestamp, suiteTicket ].join('\n');
    const sign = crypto.createHmac('SHA256', suiteSecret).update(data, 'utf8');
    return sign.digest('base64');
  }

  /**
   * **获取钉钉企业内部应用令牌**
   *
   * @see https://ding-doc.dingtalk.com/doc#/serverapi2/eev437/1b3959fa
   * @param {object} { appKey, appSecret } 企业应用appKey, appSecret
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
    if (!result) throw new DingtalkSdkError('get accessToken failed');
    if (result.errcode) throw new DingtalkSdkError(JSON.stringify(result));
    const { access_token, expires_in } = result;
    await this.setCache(cacheKey, access_token, { ttl: expires_in });
    return access_token;
  }

  /**
   * **获取套件票据**
   *
   * 套件票据更新途径：
   *
   * 1. HTTP Event Callback {@link DingtalkSdk#callback}
   * 2. Dingtalk Cloud Push {@link DingtalkSdk#bizSuiteTicket}
   *
   * @see https://ding-doc.dingtalk.com/doc#/ln6dmh/troq7i/k9Zn4
   * @see https://ding-doc.dingtalk.com/doc#/serverapi3/xffxf8
   * @see https://ding-doc.dingtalk.com/doc#/ln6dmh/gnu28b
   * @param {string} suiteKey suiteKey
   * @return {string} suiteTicket
   * @memberof DingtalkSdk
   */
  async getSuiteTicket(suiteKey) {
    const { config } = this;
    const { suiteTicket, cache } = config;
    const cacheKey = [ cache.prefix, 'suiteTicket', suiteKey ].join('.');
    const cacheValue = await this.getCache(cacheKey);
    if (cacheValue) return cacheValue;
    return [ suiteKey, suiteTicket ].join('.');
  }

  /**
   * **设置票据套件**
   *
   * 比如：轮询钉钉云推送RDS数据源获取更新，若`suiteKey`匹配则推送
   *
   * @see https://ding-doc.dingtalk.com/doc#/ln6dmh/troq7i/k9Zn4
   * @param {string} suiteKey suiteKey
   * @param {string} suiteTicket suiteTicket
   * @return {string} 缓存并返回套件票据
   * @memberof DingtalkSdk
   */
  async setSuiteTicket(suiteKey, suiteTicket) {
    const { suiteKey: configSuiteKey, cache } = this.config;
    if (suiteKey !== configSuiteKey) throw new DingtalkSdkError('suiteKey not match');
    const cacheKey = [ cache.prefix, 'suiteTicket', suiteKey ].join('.');
    const result = await this.setCache(cacheKey, suiteTicket);
    return result;
  }

  /**
   * **获取第三方企业应用授权企业令牌**
   *
   * @see https://ding-doc.dingtalk.com/doc#/serverapi3/hv357q
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
    const signature = this.signature(timestamp, suiteTicket, suiteSecret);
    const method = 'POST';
    const params = { accessKey: suiteKey, timestamp, suiteTicket, signature };
    const data = { auth_corpid: corpId };
    const { data: result } = await this.axios({ url, params, method, data });
    if (!result) throw new DingtalkSdkError('get accessToken failed');
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

  /**
   * **获取企业授权信息**
   *
   * @see https://ding-doc.dingtalk.com/doc#/serverapi3/fmdqvx
   * @param {object} {corpId} 企业ID
   * @return {object} 企业授权信息
   * @memberof DingtalkSdk
   */
  async getAuthInfo({ corpId }) {
    const { config } = this;
    const { suiteKey, suiteSecret, isvAppAuthInfoUrl: url } = config;
    const timestamp = Date.now();
    const suiteTicket = await this.getSuiteTicket(suiteKey);
    const signature = this.signature(timestamp, suiteTicket, suiteSecret);
    const method = 'POST';
    const params = { accessKey: suiteKey, timestamp, suiteTicket, signature };
    const data = { auth_corpid: corpId };
    const { data: result } = await this.axios({ url, params, method, data });
    if (result.errcode) throw new DingtalkSdkError(JSON.stringify(result));
    return result;
  }

  async getAgentId({ corpId } = {}) {
    const { config } = this;
    const { agentId, appMode, appId } = config;
    if (appMode !== 'isv') return parseInt(agentId);
    const authInfo = await this.getAuthInfo({ corpId });
    const { auth_info: { agent } } = authInfo;
    const { agentid } = agent.find(agent => agent.appid === parseInt(appId));
    return agentid;
  }

  /**
   * **获取授权应用信息**
   *
   * **注意：**同一个`appId`的应用在不同企业其`agentId`不尽相同
   *
   * @ https://ding-doc.dingtalk.com/doc#/serverapi3/vfitg0
   * @param {object} {corpId,agentId} 企业ID、应用代理ID
   * @return {object} 授权应用信息
   * @memberof DingtalkSdk
   */
  async getAgent({ corpId, agentId }) {
    const { config } = this;
    const { suiteKey, suiteSecret, isvAppAgentUrl: url } = config;
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

  /**
   * **获取JSAPI票据**
   *
   * @see https://ding-doc.dingtalk.com/doc#/dev/uwa7vs
   * @param {object} { corpId, type = 'jsapi' } 企业ID及票据类型
   * @return {string} JSAPI票据
   * @memberof DingtalkSdk
   */
  async getJsapiTicket({ corpId, type = 'jsapi' } = {}) {
    const { config } = this;
    const { appMode, appKey, suiteKey, jsapiTicketUrl: url, cache } = config;
    const key = appMode === 'isv' ? suiteKey : appKey;
    const cacheKey = corpId
      ? [ cache.prefix, 'jsapiTicket', key, corpId ].join('.')
      : [ cache.prefix, 'jsapiTicket', key ].join('.');
    const cacheValue = await this.getCache(cacheKey);
    if (cacheValue) return cacheValue;
    const access_token = await this.getToken({ ...config, corpId });
    const params = { access_token, type };
    const { data: result } = await this.axios({ url, params });
    if (!result) throw new DingtalkSdkError('get jsapi ticket failed');
    if (result.errcode) throw new DingtalkSdkError(JSON.stringify(result));
    const { ticket, expires_in } = result;
    await this.setCache(cacheKey, ticket, { ttl: expires_in });
    return ticket;
  }

  /**
   * **请求API**
   *
   * @param {string} api API接口
   * @param {object} request 请求
   * @param {object} scope 范围及其他参数，corpId = ISV应用授权企业ID
   * @return {object} 响应
   * @memberof DingtalkSdk
   */
  async execute(api, request = {}, scope = {}) {
    const { config } = this;
    const { baseUrl } = config;
    const access_token = await this.getToken({ ...config, ...scope });
    const options = deepmerge(request, { params: { access_token } });
    const url = baseUrl + api;
    const { data } = await this.axios(url, options);
    return data;
  }

  /**
   * **处理HTTP事件回调**
   *
   * @see https://ding-doc.dingtalk.com/doc#/serverapi3/xffxf8
   * @param {object} request 加密的事件数据
   * @return {object} 解密的事件数据
   * @memberof DingtalkSdk
   */
  async callback(request) {
    const { appMode, appKey, suiteKey, eventToken, eventAesKey } = this.config;
    const key = appMode === 'isv' ? suiteKey : appKey;
    const dingtalkSdkEvent = new DingtalkSdkEvent({ token: eventToken, aesKey: eventAesKey, key });
    const event = await dingtalkSdkEvent.decrypt(request);
    if (!event) return event;
    const { EventType } = event;
    switch (EventType) {
      default: break;
      // update suiteTicket in cache
      case 'suite_ticket': {
        const { SuiteKey, SuiteTicket } = event;
        await this.setSuiteTicket(SuiteKey, SuiteTicket);
        break;
      }
    }
    // response success to dingtalk
    const { timestamp } = request;
    const response = dingtalkSdkEvent.response({ timestamp });
    return { ...event, response };
  }
}

module.exports = DingtalkSdk;
