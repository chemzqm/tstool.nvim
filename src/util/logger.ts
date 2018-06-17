import os = require('os')
import path = require('path')
import fs = require('fs')
import * as log4js from 'log4js'

const MAX_LOG_SIZE = 1024 * 1024
const MAX_LOG_BACKUPS = 10
const LOG_FILE_PATH = process.env.NVIM_TSTOOL_LOG_FILE || path.join(os.tmpdir(), 'tstool-nvim.log')

const level = process.env.NVIM_TSTOOL_LOG_LEVEL || 'debug'

log4js.configure({
  appenders: {
    out: {
      type: 'file',
      filename: LOG_FILE_PATH,
      maxLogSize: MAX_LOG_SIZE,
      backups: MAX_LOG_BACKUPS,
      layout: {
        type: 'pattern',
        // Format log in following pattern:
        // yyyy-MM-dd HH:mm:ss.mil $Level (pid:$pid) $categroy - $message.
        pattern: `%d{ISO8601} %p (pid:${process.pid}) [%c] - %m`,
      },
    }
  },
  categories: {
    default: { appenders: [ 'out' ], level}
  }
})

module.exports = (name = 'tstool-nvim'):log4js.Logger => {
  return log4js.getLogger(name)
}
