'use strict';

const DingTalkEncryptor = require('dingtalk-encrypt');
const utils = require('dingtalk-encrypt/Utils');

/**
 * **钉钉回调事件**
 *
 * @class DintalkSdkEvent
 */
class DintalkSdkEvent {
  /**
   * **创建钉钉回调事件实例**
   *
   * @param {object} config 配置，需包含`{ token, aesKey, key }`
   * @memberof DintalkSdkEvent
   */
  constructor(config) {
    this.config = config;
    const { token, aesKey, key } = this.config;
    this.crypto = new DingTalkEncryptor(token, aesKey, key);
  }

  /**
   * **处理回调**
   *
   * 1. 解密回调数据，返回给应用处理
   * 2. 加密响应数据，反馈给钉钉推送
   * 3. 更新相关缓存，如：`suiteTicket`
   *
   * @param {object} { signature, timestamp, nonce, encrypt }，回调数据
   * @return {object} { event, response }，事件数据及响应数据
   * @memberof DintalkSdkEvent
   */
  parse({ signature, timestamp, nonce, encrypt }) {
    try {
      const { crypto } = this;
      const json = crypto.getDecryptMsg(signature, timestamp, nonce, encrypt);
      const event = JSON.parse(json);
      return event;
    } catch (err) {
      throw err;
    }
  }

  /**
   * **回调响应**
   *
   * @param {object} { success = 'success', timestamp, random = '随机8位字符' }
   * @return {object} 响应对象
   * @memberof DintalkSdkEvent
   */
  response({ success = 'success', timestamp, random = utils.getRandomStr(8) }) {
    const { crypto } = this;
    const result = crypto.getEncryptedMap(success, timestamp, random);
    return result;
  }
}

module.exports = DintalkSdkEvent;
