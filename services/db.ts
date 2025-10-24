
import initSqlJs from 'sql.js';
import { CameraCheckRecord, ExportData, JornadaCheckRecord, Server } from '../types';

type Database = initSqlJs.Database;

let db: Database | null = null;
const DB_KEY_IN_IDB = 'sqlite_db_file';

// Helper to interact with IndexedDB for storing the DB file
const idb = {
  get: (): Promise<Uint8Array | undefined> => new Promise((resolve, reject) => {
    const request = indexedDB.open('ChequeosDB', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => {
      const tx = request.result.transaction('files', 'readonly');
      const getRequest = tx.objectStore('files').get(DB_KEY_IN_IDB);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = (e) => reject(e);
      tx.oncomplete = () => request.result.close();
    };
    request.onerror = (e) => reject(e);
  }),
  set: (data: Uint8Array): Promise<void> => new Promise((resolve, reject) => {
    const request = indexedDB.open('ChequeosDB', 1);
    request.onsuccess = () => {
      const tx = request.result.transaction('files', 'readwrite');
      const setRequest = tx.objectStore('files').put(data, DB_KEY_IN_IDB);
      setRequest.onsuccess = () => resolve();
      setRequest.onerror = (e) => reject(e);
      tx.oncomplete = () => request.result.close();
    };
    request.onerror = (e) => reject(e);
  }),
};

const createDb = (SQL: initSqlJs.SqlJsStatic) => {
  db = new SQL.Database();
  // Create schema
  db.exec(`
    CREATE TABLE config (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE operators (name TEXT PRIMARY KEY);
    CREATE TABLE servers (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE camera_history (id TEXT PRIMARY KEY, date TEXT, data TEXT);
    CREATE TABLE jornada_history (id TEXT PRIMARY KEY, date TEXT, data TEXT);
  `);
};

export const saveDb = async () => {
  if (db) {
    const data = db.export();
    await idb.set(data);
  }
};

export const initDb = async (): Promise<void> => {
  try {
    // Fetch the wasm binary file explicitly to avoid fs errors in certain environments
    const wasmUrl = 'https://aistudiocdn.com/sql.js@^1.10.3/dist/sql-wasm.wasm';
    const wasmBinary = await fetch(wasmUrl).then(res => res.arrayBuffer());

    // Initialize sql.js with the pre-fetched wasm binary
    const SQL = await initSqlJs({ wasmBinary });

    const storedDb = await idb.get();
    if (storedDb) {
      db = new SQL.Database(storedDb);
    } else {
      createDb(SQL);
      await migrateFromLocalStorage(); // Migrate only if DB is new
      await saveDb();
    }
  } catch(e) {
    console.error("Failed to initialize database", e);
  }
};

// --- MIGRATION from localStorage ---
const migrateFromLocalStorage = async () => {
    console.log("Checking for localStorage data to migrate...");
    let migrated = false;
    try {
        const storedOperators = localStorage.getItem('operators');
        if (storedOperators) {
            migrated = true;
            setOperators(JSON.parse(storedOperators));
        }

        const storedServers = localStorage.getItem('servers');
        if (storedServers) {
            migrated = true;
            setServers(JSON.parse(storedServers));
        }

        const storedHelpText = localStorage.getItem('helpText');
        if (storedHelpText) {
            migrated = true;
            setHelpText(storedHelpText);
        }

        const storedCameraHistory = localStorage.getItem('checkHistory');
        if (storedCameraHistory) {
            migrated = true;
            const history: CameraCheckRecord[] = JSON.parse(storedCameraHistory);
            history.forEach(r => addCameraCheckRecordFromMigration(r));
        }

        const storedJornadaHistory = localStorage.getItem('jornadaHistory');
        if (storedJornadaHistory) {
            migrated = true;
            const history: JornadaCheckRecord[] = JSON.parse(storedJornadaHistory);
            history.forEach(r => addJornadaCheckRecordFromMigration(r));
        }
        
        if (migrated) {
            console.log("Migration from localStorage complete. Clearing old data.");
            localStorage.removeItem('operators');
            localStorage.removeItem('servers');
            localStorage.removeItem('helpText');
            localStorage.removeItem('checkHistory');
            localStorage.removeItem('jornadaHistory');
        } else {
            console.log("No localStorage data found to migrate.");
        }
    } catch (e) {
        console.error("Error during localStorage migration:", e);
    }
}

// --- DATA ACCESS FUNCTIONS ---

// Operators
export const getOperators = (): string[] => {
  if (!db) return [];
  const res = db.exec("SELECT name FROM operators ORDER BY name ASC");
  if (!res.length) return [];
  return res[0].values.map(row => row[0] as string);
};
export const setOperators = (operators: string[]) => {
  if (!db) return;
  db.exec("DELETE FROM operators");
  const stmt = db.prepare("INSERT INTO operators (name) VALUES (?)");
  operators.forEach(op => stmt.run([op]));
  stmt.free();
};

// Servers
export const getServers = (): Server[] => {
  if (!db) return [];
  const res = db.exec("SELECT data FROM servers");
  if (!res.length) return [];
  return res[0].values.map(row => JSON.parse(row[0] as string));
};
export const setServers = (servers: Server[]) => {
  if (!db) return;
  db.exec("DELETE FROM servers");
  const stmt = db.prepare("INSERT INTO servers (id, data) VALUES (?, ?)");
  servers.forEach(s => stmt.run([s.id, JSON.stringify(s)]));
  stmt.free();
};

// Help Text
export const getHelpText = (): string => {
  if (!db) return '';
  const res = db.exec("SELECT value FROM config WHERE key = 'helpText'");
  if (!res.length || !res[0].values.length) return '';
  return res[0].values[0][0] as string;
};
export const setHelpText = (text: string) => {
  if (!db) return;
  db.exec("INSERT OR REPLACE INTO config (key, value) VALUES ('helpText', ?)", [text]);
};

// Camera History
export const getCameraHistory = (): CameraCheckRecord[] => {
  if (!db) return [];
  const res = db.exec("SELECT data FROM camera_history ORDER BY date DESC");
  if (!res.length) return [];
  return res[0].values.map(row => JSON.parse(row[0] as string));
};
export const addCameraCheckRecord = (record: Omit<CameraCheckRecord, 'id' | 'date'>) => {
  if (!db) return null;
  const newRecord: CameraCheckRecord = {
    ...record,
    id: new Date().toISOString() + Math.random(),
    date: new Date().toISOString(),
  };
  db.exec("INSERT INTO camera_history (id, date, data) VALUES (?, ?, ?)", [newRecord.id, newRecord.date, JSON.stringify(newRecord)]);
  return newRecord;
};
const addCameraCheckRecordFromMigration = (record: CameraCheckRecord) => {
    if(!db) return;
    db.exec("INSERT INTO camera_history (id, date, data) VALUES (?, ?, ?)", [record.id, record.date, JSON.stringify(record)]);
}

// Jornada History
export const getJornadaHistory = (): JornadaCheckRecord[] => {
  if (!db) return [];
  const res = db.exec("SELECT data FROM jornada_history ORDER BY date DESC");
  if (!res.length) return [];
  return res[0].values.map(row => JSON.parse(row[0] as string));
};
export const addJornadaCheckRecord = (record: Omit<JornadaCheckRecord, 'id' | 'date'>) => {
  if (!db) return null;
  const newRecord: JornadaCheckRecord = {
    ...record,
    id: new Date().toISOString() + Math.random(),
    date: new Date().toISOString(),
  };
  db.exec("INSERT INTO jornada_history (id, date, data) VALUES (?, ?, ?)", [newRecord.id, newRecord.date, JSON.stringify(newRecord)]);
  return newRecord;
};
const addJornadaCheckRecordFromMigration = (record: JornadaCheckRecord) => {
    if (!db) return;
    db.exec("INSERT INTO jornada_history (id, date, data) VALUES (?, ?, ?)", [record.id, record.date, JSON.stringify(record)]);
}

export const updateJornadaCheckRecord = (record: JornadaCheckRecord) => {
    if (!db) return;
    db.exec("UPDATE jornada_history SET data = ? WHERE id = ?", [JSON.stringify(record), record.id]);
};

// Import / Export
export const getExportData = (): ExportData => {
    return {
        operators: getOperators(),
        servers: getServers(),
        helpText: getHelpText(),
        checkHistory: getCameraHistory(),
        jornadaHistory: getJornadaHistory(),
    };
};

export const importData = (data: ExportData) => {
    if (!db) return;
    db.exec("DELETE FROM operators");
    db.exec("DELETE FROM servers");
    db.exec("DELETE FROM config");
    db.exec("DELETE FROM camera_history");
    db.exec("DELETE FROM jornada_history");

    setOperators(data.operators);
    setServers(data.servers);
    setHelpText(data.helpText);

    const camStmt = db.prepare("INSERT INTO camera_history (id, date, data) VALUES (?, ?, ?)");
    data.checkHistory.forEach(r => camStmt.run([r.id, r.date, JSON.stringify(r)]));
    camStmt.free();

    const jorStmt = db.prepare("INSERT INTO jornada_history (id, date, data) VALUES (?, ?, ?)");
    data.jornadaHistory.forEach(r => jorStmt.run([r.id, r.date, JSON.stringify(r)]));
    jorStmt.free();
};
