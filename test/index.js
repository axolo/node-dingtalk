'use strict';

const Dingtalk = require('../src');
const { parsed: config } = require('dotenv').config();

const dingtalk = new Dingtalk(config);

// execute
dingtalk.execute({
  url: '/user/simplelist',
  params: { department_id: 1 },
}).catch(err => {
  console.log(err);
}).then(res => {
  console.log(res);
});
