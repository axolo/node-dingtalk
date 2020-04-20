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
   * corp | dingtalk | accessToken | appId
   * corp | dingtalk | jsapiTicket | appId
   * isv  | dingtalk | suiteTicket | appId
   * isv  | dingtalk | accessToken | appId.corpId
   * isv  | dingtalk | jsapiTicket | appId.corpId
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
   * @see https://ding-doc.dingtalk.com/doc#/serverapi2/eev437/1b3959fa
   * @param {object} { appKey, appSecret }，企业应用appKey, appSecret
   * @return {string} access_token，企业内部应用令牌
   * @memberof DingtalkSdk
   */
  async getCorpAppToken({ appKey, appSecret }) {
    const { config } = this;
    const { corpAppAuthTokenUrl: url, cache, appId } = config;
    const cacheKey = [ cache.prefix, 'accessToken', appId ].join('.');
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
   * @param {string} appId appId
   * @return {string} suiteTicket
   * @memberof DingtalkSdk
   */
  async getSuiteTicket(appId) {
    const { config } = this;
    const { suiteTicket, cache } = config;
    const cacheKey = [ cache.prefix, 'suiteTicket', appId ].join('.');
    const cacheValue = await this.getCache(cacheKey);
    if (cacheValue) return cacheValue;
    return [ appId, suiteTicket ].join('.');
  }

  /**
   * **设置票据套件**
   *
   * 比如：轮询钉钉云推送RDS数据源获取更新，若`appId`匹配则推送
   *
   * @see https://ding-doc.dingtalk.com/doc#/ln6dmh/troq7i/k9Zn4
   * @param {string} appId appId
   * @param {string} suiteTicket suiteTicket
   * @return {string} 缓存并返回套件票据
   * @memberof DingtalkSdk
   */
  async setSuiteTicket(appId, suiteTicket) {
    const { appId: configAppId, cache } = this.config;
    if (appId !== configAppId) throw new DingtalkSdkError('appId not match');
    const cacheKey = [ cache.prefix, 'suiteTicket', appId ].join('.');
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
    const { isvAppAuthTokenUrl: url, cache, appId } = config;
    const cacheKey = [ cache.prefix, 'accessToken', appId, corpId ].join('.');
    const cacheValue = await this.getCache(cacheKey);
    if (cacheValue) return cacheValue;
    const timestamp = Date.now();
    const suiteTicket = await this.getSuiteTicket(appId);
    const signature = await this.signature(timestamp, suiteTicket, suiteSecret);
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
   * **获取JSAPI票据**
   *
   * @see https://ding-doc.dingtalk.com/doc#/dev/uwa7vs
   * @param {object} { accessToken, type = 'jsapi' }，令牌及票据类型
   * @return {string} JSAPI票据
   * @memberof DingtalkSdk
   */
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

  /**
   * **获取企业授权信息**
   *
   * @see https://ding-doc.dingtalk.com/doc#/serverapi3/fmdqvx
   * @param {object} { suiteKey, suiteSecret, corpId }
   * @return {object} 企业授权信息
   * @memberof DingtalkSdk
   */
  async getAuthInfo({ suiteKey, suiteSecret, corpId }) {
    const { config } = this;
    const { isvAppAuthInfoUrl: url, appId } = config;
    const timestamp = Date.now();
    const suiteTicket = await this.getSuiteTicket(appId);
    const signature = await this.signature(timestamp, suiteTicket, suiteSecret);
    const method = 'POST';
    const params = { accessKey: suiteKey, timestamp, suiteTicket, signature };
    const data = { auth_corpid: corpId };
    const { data: result } = await this.axios({ url, params, method, data });
    if (result.errcode) throw new DingtalkSdkError(JSON.stringify(result));
    return result;
  }

  /**
   * **获取授权应用信息**
   *
   * **注意：**同一个`appId`的应用在不同企业其`agentId`不尽相同
   *
   * @ https://ding-doc.dingtalk.com/doc#/serverapi3/vfitg0
   * @param {object} { suiteKey, suiteSecret, corpId, agentId }
   * @return {object} 授权应用信息
   * @memberof DingtalkSdk
   */
  async getAgent({ suiteKey, suiteSecret, corpId, agentId }) {
    const { config } = this;
    const { isvAppAgentUrl: url, appId } = config;
    const timestamp = Date.now();
    const suiteTicket = await this.getSuiteTicket(appId);
    const signature = await this.signature(timestamp, suiteTicket, suiteSecret);
    const method = 'POST';
    const params = { accessKey: suiteKey, timestamp, suiteTicket, signature };
    const data = { suite_key: suiteKey, auth_corpid: corpId, agentid: parseInt(agentId) };
    const { data: result } = await this.axios({ url, params, method, data });
    if (result.errcode) throw new DingtalkSdkError(JSON.stringify(result));
    return result;
  }

  /**
   * **获取AgentId**
   *
   * @param {array} agents 授权应用列表
   * @param {string | number} appId 应用ID
   * @return {string | number} 授权应用ID
   * @memberof DingtalkSdk
   */
  getAgentId(agents, appId) {
    const { agentid } = agents.find(agent => agent.appid === appId);
    return agentid;
  }

  /**
   * **请求API**
   *
   * @param {object} request 请求
   * @param {object} params 其他参数，corpId = ISV应用授权企业ID
   * @return {object} 响应
   * @memberof DingtalkSdk
   */
  async execute(request, params) {
    const { config } = this;
    const { baseUrl } = config;
    const access_token = await this.getToken({ ...config, ...params });
    const url = baseUrl + request.url;
    const options = deepmerge(request, { url, params: { access_token } });
    const { data: response } = await this.axios(options);
    return response;
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
    const { EventType } = event;
    switch (EventType) {
      default: break;
      case 'suite_ticket': { // update suiteTicket in cache
        const { SuiteKey, SuiteTicket } = event;
        await this.setSuiteTicket(SuiteKey, SuiteTicket);
        break;
      }
    }
    const { timestamp } = request;
    const response = dingtalkSdkEvent.response({ timestamp });
    return { event, response };
  }
}

module.exports = DingtalkSdk;
