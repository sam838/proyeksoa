const mysql= require('mysql');
const pool= mysql.createPool({
    host: 'remotemysql.com',
    user: 'vqTKuXxZAU',
    password: 'A24Wfa6YyI',
    database: 'vqTKuXxZAU'
});

const getConn= () => {
    try {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if (err) reject(err);
                else resolve(conn)
            });
        });
    } catch (error) {
        console.log(error);
    }
};

const executeQuery= (conn, query) => {
    try {
        return new Promise((resolve, reject) => {
            conn.query(query, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
    } catch (error) {
        console.log(error);
    }
};

module.exports= {
    'getConn': getConn,
    'executeQuery': executeQuery
};