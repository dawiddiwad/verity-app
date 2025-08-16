import initSqlJs from 'sql.js/dist/sql-wasm.js';
import type { Database } from 'sql.js';
import { StoredAnalysis, Job, ResumeData } from '../types';

let db: Database;
let SQL: any;

const DB_NAME_IDB = 'ResumeAnalyzerIDB_SQLite';
const DB_VERSION_IDB = 1;
const DB_STORE_NAME_IDB = 'sqliteStore';
const DB_KEY_IDB = 'dbFile';

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME_IDB, DB_VERSION_IDB);
    request.onerror = () => reject('Error opening IndexedDB');
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(DB_STORE_NAME_IDB);
    };
  });
}

async function getIdbValue<T>(key: string): Promise<T | undefined> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction(DB_STORE_NAME_IDB, 'readonly');
    const request = transaction.objectStore(DB_STORE_NAME_IDB).get(key);
    request.onerror = () => reject('Error getting value from IndexedDB');
    request.onsuccess = () => resolve(request.result);
  });
}

async function setIdbValue<T>(key: string, value: T): Promise<void> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction(DB_STORE_NAME_IDB, 'readwrite');
    transaction.objectStore(DB_STORE_NAME_IDB).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject('Error setting value in IndexedDB');
  });
}

export async function initDB(): Promise<{ dbExists: boolean }> {
  if (db) return { dbExists: true };

  // The UMD module loaded via esm.sh might have the main export on a `default` property.
  const loader = (initSqlJs as any).default || initSqlJs;

  // Manually fetch wasm binary to avoid issues with Node.js environment detection
  // by some CDNs/bundlers which can cause 'fs' errors.
  const wasmBinary = await fetch('https://sql.js.org/dist/sql-wasm.wasm')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch wasm file: ${response.statusText}`);
      }
      return response.arrayBuffer();
    });
    
  SQL = await loader({ wasmBinary });

  const existingDbData = await getIdbValue<Uint8Array>(DB_KEY_IDB);
  if (existingDbData) {
    db = new SQL.Database(existingDbData);
    return { dbExists: true };
  }

  return { dbExists: false };
}

export async function createNewDB(): Promise<void> {
  db = new SQL.Database();
  const schema = `
    CREATE TABLE jobs (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE analysisResults (
      id INTEGER PRIMARY KEY,
      jobId INTEGER NOT NULL,
      jobTitle TEXT NOT NULL,
      fileName TEXT NOT NULL,
      resumeHash TEXT NOT NULL,
      jobDescHash TEXT NOT NULL,
      jobDescription TEXT NOT NULL,
      resumeData TEXT NOT NULL,
      analysis TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      resumeFile BLOB,
      resumeMimeType TEXT,
      FOREIGN KEY(jobId) REFERENCES jobs(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_analysis_jobId ON analysisResults (jobId);
    CREATE INDEX idx_analysis_hashes ON analysisResults (resumeHash, jobDescHash);
  `;
  db.exec(schema);
  await saveDB();
}

async function saveDB(): Promise<void> {
  const data = db.export();
  await setIdbValue(DB_KEY_IDB, data);
}

export function normalizeText(text: string): string {
  if (typeof text !== 'string') return '';
  return text.replace(/\r\n/g, '\n').trim();
}

export async function createHash(text: string): Promise<string> {
  const normalizedText = normalizeText(text);
  const buffer = new TextEncoder().encode(normalizedText);
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


// --- Job Functions ---

export async function addJob(title: string, description: string): Promise<Job> {
  const now = new Date().toISOString();
  db.run('INSERT INTO jobs (title, description, createdAt) VALUES (?, ?, ?)', [title, description, now]);
  
  const res = db.exec("SELECT * FROM jobs WHERE id = last_insert_rowid()");
  await saveDB();

  const row = res[0].values[0];
  return {
    id: row[0] as number,
    title: row[1] as string,
    description: row[2] as string,
    createdAt: new Date(row[3] as string),
  };
}

export async function getAllJobs(): Promise<Job[]> {
  const res = db.exec("SELECT * FROM jobs ORDER BY createdAt DESC");
  if (res.length === 0) return [];
  return res[0].values.map(row => ({
    id: row[0] as number,
    title: row[1] as string,
    description: row[2] as string,
    createdAt: new Date(row[3] as string),
  }));
}

export async function deleteJobAndAnalyses(jobId: number): Promise<void> {
  db.run("DELETE FROM jobs WHERE id = ?", [jobId]);
  await saveDB();
}

// --- Analysis Functions ---

export async function addAnalysis(analysisData: Omit<StoredAnalysis, 'id' | 'createdAt'>): Promise<StoredAnalysis> {
  const now = new Date().toISOString();
  const stmt = db.prepare("INSERT INTO analysisResults (jobId, jobTitle, fileName, resumeHash, jobDescHash, jobDescription, resumeData, analysis, createdAt, resumeFile, resumeMimeType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  const { fileBlob, fileMimeType, ...resumeDataForJson } = analysisData.resumeData;

  stmt.bind([
    analysisData.jobId,
    analysisData.jobTitle,
    analysisData.fileName,
    analysisData.resumeHash,
    analysisData.jobDescHash,
    analysisData.jobDescription,
    JSON.stringify(resumeDataForJson),
    JSON.stringify(analysisData.analysis),
    now,
    fileBlob,
    fileMimeType,
  ]);
  stmt.step();
  stmt.free();

  const res = db.exec("SELECT * FROM analysisResults WHERE id = last_insert_rowid()");
  await saveDB();
  
  const row = res[0].values[0];
  const storedResumeData = JSON.parse(row[7] as string);

  return {
    id: row[0] as number,
    jobId: row[1] as number,
    jobTitle: row[2] as string,
    fileName: row[3] as string,
    resumeHash: row[4] as string,
    jobDescHash: row[5] as string,
    jobDescription: row[6] as string,
    resumeData: {
      ...storedResumeData,
      fileBlob: row[10] as Uint8Array,
      fileMimeType: row[11] as string,
    } as ResumeData,
    analysis: JSON.parse(row[8] as string),
    createdAt: new Date(row[9] as string),
  };
}

export async function getAllAnalyses(): Promise<StoredAnalysis[]> {
  const res = db.exec("SELECT * FROM analysisResults ORDER BY createdAt DESC");
  if (res.length === 0) return [];
  return res[0].values.map(row => {
    const storedResumeData = JSON.parse(row[7] as string);
    return {
        id: row[0] as number,
        jobId: row[1] as number,
        jobTitle: row[2] as string,
        fileName: row[3] as string,
        resumeHash: row[4] as string,
        jobDescHash: row[5] as string,
        jobDescription: row[6] as string,
        resumeData: {
            ...storedResumeData,
            fileName: storedResumeData.fileName || row[3], // Backwards compatibility
            fileBlob: row[10] as Uint8Array,
            fileMimeType: row[11] as string,
        } as ResumeData,
        analysis: JSON.parse(row[8] as string),
        createdAt: new Date(row[9] as string),
    };
  });
}

export async function getAnalysisHashesForJob(jobId: number): Promise<string[]> {
    const res = db.exec("SELECT resumeHash FROM analysisResults WHERE jobId = ?", [jobId]);
    if (res.length === 0) return [];
    return res[0].values.map(row => row[0] as string);
}

export async function deleteAnalysis(id: number): Promise<void> {
  db.run("DELETE FROM analysisResults WHERE id = ?", [id]);
  await saveDB();
}

export async function clearAllAnalyses(jobId: number): Promise<void> {
  db.run("DELETE FROM analysisResults WHERE jobId = ?", [jobId]);
  await saveDB();
}


// --- DB File Import/Export ---

export async function exportDBFile(): Promise<void> {
  const data = db.export();
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `resume_analyzer_${new Date().toISOString().split('T')[0]}.db`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function importDBFile(file: File): Promise<void> {
  try {
    const buffer = await file.arrayBuffer();
    // Test if it's a valid SQLite file before replacing
    const testDb = new SQL.Database(new Uint8Array(buffer));
    testDb.close(); // If it doesn't throw, it's likely a valid DB file
    
    db = new SQL.Database(new Uint8Array(buffer));
    await saveDB();
  } catch (e) {
    console.error("Import failed:", e);
    throw new Error("The selected file is not a valid database file. Please import a file that was previously exported from this application.");
  }
}