'use strict';

// https://ding-doc.dingtalk.com/doc#/faquestions/ltr370

const querystring = require('querystring');
const DingtalkSdkEvent = require('../src/event');

const token = '123456';
const aesKey = '4g5j64qlyl3zvetqxz5jiocdr586fn2zvjpa8zls3ij';
const key = 'suite4xxxxxxxxxxxxxxx';
const dingtalkSdkEvent = new DingtalkSdkEvent({ token, aesKey, key });

const query = querystring.parse('signature=5a65ceeef9aab2d149439f82dc191dd6c5cbe2c0&timestamp=1445827045067&nonce=nEXhMP4r');
const encrypt = '1a3NBxmCFwkCJvfoQ7WhJHB+iX3qHPsc9JbaDznE1i03peOk1LaOQoRz3+nlyGNhwmwJ3vDMG+OzrHMeiZI7gTRWVdUBmfxjZ8Ej23JVYa9VrYeJ5as7XM/ZpulX8NEQis44w53h1qAgnC3PRzM7Zc/D6Ibr0rgUathB6zRHP8PYrfgnNOS9PhSBdHlegK+AGGanfwjXuQ9+0pZcy0w9lQ==';
const { signature, timestamp, nonce } = query;
const event = dingtalkSdkEvent.parse({ signature, timestamp, nonce, encrypt });
const response = dingtalkSdkEvent.response({ timestamp });

console.log({ event, response });
