'use strict';
/*eslint no-process-env:0*/

// Production specific configuration
// =================================
module.exports = {
  // Server IP
  ip: process.env.OPENSHIFT_NODEJS_IP
    || process.env.ip
    || undefined,

  // Server port
  port: process.env.OPENSHIFT_NODEJS_PORT
    || process.env.PORT
    || 8080,

    sequelize: {
      uri: 'sqlite://' || process.env.SQL_URI,
      options: {
          logging: false,
          storage: 'dist.sqlite',
          define: {
              timestamps: false
          }
      }
    }
};
