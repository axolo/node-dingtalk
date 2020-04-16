'use strict';

// error
const DingtalkSdkError = require('../src/error');
const error = new DingtalkSdkError('test error');
throw error;
