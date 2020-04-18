'use strict';

const cron = require('node-cron');
const mysql = require('mysql2');
const { parsed: config } = require('dotenv').config();

// dingtalk sdk
const DingtalkSdk = require('../src');
const dingtalkSdk = new DingtalkSdk(config);
const { suiteId, suiteKey } = dingtalkSdk.config;

// dingtalk cloud push rds
const { pushHost: host, pushPort: port, pushUsername: user, pushPassword: password, pushDatabase: database } = config;
const Model = mysql.createConnection({ host, port, user, password, database }).promise();

// schedule
const updateSuiteTicket = async () => {
  // get biz list from Dingtalk Cloud Push RDS if unparsed
  // NOTE: Do NOT parse suite_ticket biz status!!!
  const [ bizList ] = await Model.query('SELECT * FROM `open_sync_biz_data` WHERE `status` = 0;');
  if (!bizList && bizList.length === 0) return;
  Promise.all(bizList.map(async biz => {
    const { biz_id, biz_type, biz_data } = biz;
    if (biz_type !== 2 || biz_id !== suiteId) return;
    // update suiteTicket cache if matched
    const { suiteTicket } = JSON.parse(biz_data);
    await dingtalkSdk.setSuiteTicket(suiteKey, suiteTicket);
    const cache = await dingtalkSdk.getSuiteTicket(suiteKey);
    console.log({ suiteTicket: cache });
  }));
};

// task
console.log('Schedule is running...');
const task = cron.schedule('*/10 * * * * *', async () => {
  console.log(__filename, new Date());
  await updateSuiteTicket();
}, {
  scheduled: false,
});
task.start();
