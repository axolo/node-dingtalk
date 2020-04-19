'use strict';

// **Usage:**
// let route `POST /dingtalk/callback` accessable on internet.
// set dingtalk app callback URL point to link of route `POST /dingtalk/callback`.
// see https://ding-doc.dingtalk.com/doc#/serverapi3/igq88i for more help.

const { httpPort = 300 } = process.env;

console.log(`HTTP Server is running at: ${httpPort}`);
