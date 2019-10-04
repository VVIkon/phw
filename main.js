#!/usr/bin/node

const config = require('./config/config')
require('./distr/main.js').execute(config)