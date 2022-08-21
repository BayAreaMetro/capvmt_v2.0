'use strict';
/*eslint no-process-env:0*/

// Development specific configuration
// ==================================
module.exports = {

  // Sequelize connection opions
  sequelize: {
    uri: process.env.SQL_URI,
    options: {
        dialect: 'mssql',
        // logging: false,
        // storage: 'dev.sqlite',
        // encrypt: false,
        // define: {
        //     timestamps: false
        // }
    }
  },

  // Seed database on startup
  seedDB: false

};
