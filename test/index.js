'use strict';

const Dingtalk = require('../src');
const { parsed: config } = require('dotenv').config();

const dingtalk = new Dingtalk(config);

dingtalk.execute({
  url: '/user',
  data: { username: 'admin' },
}).catch(err => {
  console.log(err);
}).then(res => {
  console.log(res.data);
});
