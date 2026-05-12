const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connected successfully');
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };