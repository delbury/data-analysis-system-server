import mysql, { ConnectionConfig } from 'mysql';

const mysqlConfig: ConnectionConfig = {
  host: 'localhost',
  user: 'user',
  password: '123456a',
  // port: 3306,
  // database: ''
};

const createConnection = () => {
  const cnt = mysql.createConnection({
    ...mysqlConfig,
  });
  cnt.connect(err => {
    if(err) throw err;
    console.log('mysql connected !');

    cnt.end();
  });
};

export const run = () => {
  createConnection();
};
