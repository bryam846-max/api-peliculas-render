const { Sequelize } = require('sequelize');

let sequelize;


if (process.env.DATABASE_URL) {
    // Conexion para Render (PostgreSQL)
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });
} else {
    // Conexion local para desarrollo (SQLite)
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: 'database.sqlite',
        logging: false
    });
}

module.exports = sequelize;