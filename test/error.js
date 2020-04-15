'use strict';

// error
const DingtalkError = require('../src/lib/dingtalk-error');
const error = new DingtalkError('test error');
console.log(error.name);
throw error;
