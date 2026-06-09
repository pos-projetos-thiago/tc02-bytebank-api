const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Caminho para o banco SQLite
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'bytebank.db');

// Garantir que o diretório existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Conectar ao banco SQLite
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar SQLite:', err.message);
  } else {
    console.log('✅ Conectado ao SQLite:', DB_PATH);
  }
});

// Criar tabelas se não existirem
const initTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabela de usuários
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de contas
      db.run(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          user_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Tabela de transações
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          account_id TEXT NOT NULL,
          type TEXT NOT NULL,
          value REAL NOT NULL,
          from_field TEXT,
          to_field TEXT,
          anexo TEXT,
          url_anexo TEXT,
          date DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (account_id) REFERENCES accounts (id)
        )
      `);

      // Tabela de cartões
      db.run(`
        CREATE TABLE IF NOT EXISTS cards (
          id TEXT PRIMARY KEY,
          account_id TEXT NOT NULL,
          type TEXT NOT NULL,
          is_blocked BOOLEAN DEFAULT 0,
          number TEXT NOT NULL,
          due_date DATETIME NOT NULL,
          functions TEXT NOT NULL,
          cvc TEXT NOT NULL,
          payment_date DATETIME,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (account_id) REFERENCES accounts (id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabelas:', err.message);
          reject(err);
        } else {
          console.log('📋 Tabelas SQLite inicializadas');
          resolve();
        }
      });
    });
  });
};

// Funções de backup e restore
const backupToSQLite = async (mongoData) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Limpar dados antigos
      db.run('DELETE FROM transactions');
      db.run('DELETE FROM cards');
      db.run('DELETE FROM accounts');
      db.run('DELETE FROM users');

      // Inserir usuários
      if (mongoData.users && mongoData.users.length > 0) {
        const stmt = db.prepare(`
          INSERT INTO users (id, username, email, password, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        mongoData.users.forEach(user => {
          stmt.run(
            user._id,
            user.username,
            user.email,
            user.password,
            user.createdAt,
            user.updatedAt
          );
        });
        stmt.finalize();
      }

      // Inserir contas
      if (mongoData.accounts && mongoData.accounts.length > 0) {
        const stmt = db.prepare(`
          INSERT INTO accounts (id, type, user_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        mongoData.accounts.forEach(account => {
          stmt.run(
            account._id,
            account.type,
            account.userId,
            account.createdAt,
            account.updatedAt
          );
        });
        stmt.finalize();
      }

      // Inserir transações
      if (mongoData.transactions && mongoData.transactions.length > 0) {
        const stmt = db.prepare(`
          INSERT INTO transactions (id, account_id, type, value, from_field, to_field, anexo, url_anexo, date, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        mongoData.transactions.forEach(transaction => {
          stmt.run(
            transaction._id,
            transaction.accountId,
            transaction.type,
            transaction.value,
            transaction.from,
            transaction.to,
            transaction.anexo,
            transaction.urlAnexo,
            transaction.date,
            transaction.createdAt,
            transaction.updatedAt
          );
        });
        stmt.finalize();
      }

      // Inserir cartões
      if (mongoData.cards && mongoData.cards.length > 0) {
        const stmt = db.prepare(`
          INSERT INTO cards (id, account_id, type, is_blocked, number, due_date, functions, cvc, payment_date, name, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        mongoData.cards.forEach(card => {
          stmt.run(
            card._id,
            card.accountId,
            card.type,
            card.is_blocked ? 1 : 0,
            card.number,
            card.dueDate,
            card.functions,
            card.cvc,
            card.paymentDate,
            card.name,
            card.createdAt,
            card.updatedAt
          );
        });
        stmt.finalize(() => {
          console.log('💾 Dados salvos no SQLite');
          resolve();
        });
      } else {
        console.log('💾 Dados salvos no SQLite');
        resolve();
      }
    });
  });
};

const restoreFromSQLite = async () => {
  return new Promise((resolve, reject) => {
    const data = { users: [], accounts: [], transactions: [], cards: [] };
    
    db.serialize(() => {
      // Buscar usuários
      db.all('SELECT * FROM users', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        data.users = rows.map(row => ({
          _id: row.id,
          username: row.username,
          email: row.email,
          password: row.password,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          __v: 0
        }));

        // Buscar contas
        db.all('SELECT * FROM accounts', (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          data.accounts = rows.map(row => ({
            _id: row.id,
            type: row.type,
            userId: row.user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            __v: 0
          }));

          // Buscar transações
          db.all('SELECT * FROM transactions', (err, rows) => {
            if (err) {
              reject(err);
              return;
            }
            
            data.transactions = rows.map(row => ({
              _id: row.id,
              accountId: row.account_id,
              type: row.type,
              value: row.value,
              from: row.from_field,
              to: row.to_field,
              anexo: row.anexo,
              urlAnexo: row.url_anexo,
              date: row.date,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              __v: 0
            }));

            // Buscar cartões
            db.all('SELECT * FROM cards', (err, rows) => {
              if (err) {
                reject(err);
                return;
              }
              
              data.cards = rows.map(row => ({
                _id: row.id,
                accountId: row.account_id,
                type: row.type,
                is_blocked: row.is_blocked === 1,
                number: row.number,
                dueDate: row.due_date,
                functions: row.functions,
                cvc: row.cvc,
                paymentDate: row.payment_date,
                name: row.name,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                __v: 0
              }));

              console.log('📂 Dados restaurados do SQLite:', {
                users: data.users.length,
                accounts: data.accounts.length, 
                transactions: data.transactions.length,
                cards: data.cards.length
              });
              
              resolve(data);
            });
          });
        });
      });
    });
  });
};

module.exports = {
  db,
  initTables,
  backupToSQLite,
  restoreFromSQLite
};