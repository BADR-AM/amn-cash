import sqlite3 from 'sqlite3';

function cleanDb(path) {
  const d = new sqlite3.Database(path, (err) => {
    if (err) return;
    d.run("DELETE FROM devices WHERE status = 'PENDING_PAIR' OR device_id = 'dev_mobile_companion'", (err2) => {
      d.all('SELECT device_id, device_name, status, total_messages FROM devices', (e, rows) => {
        console.log(path, 'Cleaned Devices:', rows);
        d.close();
      });
    });
  });
}

cleanDb('D:/sherif/PROJECT/amn cash/data/amn_cash.sqlite');
cleanDb(process.env.APPDATA + '/amn-cash/data/amn_cash.sqlite');
