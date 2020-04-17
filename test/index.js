'use strict';

const DingtalkSdk = require('../src');
const { parsed: config } = require('dotenv').config();

const dingtalkSdk = new DingtalkSdk(config);

dingtalkSdk.execute({
  url: '/user/simplelist',
  params: { department_id: 1 },
}).catch(err => {
  console.log(err);
}).then(res => {
  console.log(res);
});
