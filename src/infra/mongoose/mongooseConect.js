const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

const DATA_BACKUP_PATH = path.join(__dirname, '..', '..', 'data', 'backup.json');
async function loadBackupData() {
  try {
    if (fs.existsSync(DATA_BACKUP_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_BACKUP_PATH, 'utf8'));
      console.log('Dados carregados do backup local');
      return data;
    }
  } catch (error) {
    console.log('Não foi possível carregar backup:', error.message);
  }
  return null;
}

async function saveBackupData() {
  try {
    const User = mongoose.model('User');
    const DetailedAccount = mongoose.model('DetailedAccount');
    const Account = mongoose.model('Account');
    const Card = mongoose.model('Card');
    const Investment = mongoose.model('Investment');
    
    const users = await User.find();
    const transactions = await DetailedAccount.find();
    const accounts = await Account.find();
    const cards = await Card.find();
    const investments = await Investment.find();
    
    const backupData = { users, transactions, accounts, cards, investments };
    
    const dir = path.dirname(DATA_BACKUP_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(DATA_BACKUP_PATH, JSON.stringify(backupData, null, 2));
    console.log('Dados salvos no backup local');
  } catch (error) {
    console.log('Erro ao salvar backup:', error.message);
  }
}

async function restoreBackupData(backupData) {
  try {
    if (backupData && Object.keys(backupData).length > 0) {
      const User = mongoose.model('User');
      const DetailedAccount = mongoose.model('DetailedAccount');
      const Account = mongoose.model('Account');
      const Card = mongoose.model('Card');
      const Investment = mongoose.model('Investment');
      
      if (backupData.users && backupData.users.length > 0) {
        for (const user of backupData.users) {
          await User.findOneAndUpdate(
            { _id: user._id },
            user,
            { upsert: true, new: true }
          );
        }
        console.log(`${backupData.users.length} usuários restaurados`);
      }
      
      if (backupData.accounts && backupData.accounts.length > 0) {
        for (const account of backupData.accounts) {
          await Account.findOneAndUpdate(
            { _id: account._id },
            account,
            { upsert: true, new: true }
          );
        }
        console.log(`${backupData.accounts.length} contas restauradas`);
      }
      
      if (backupData.transactions && backupData.transactions.length > 0) {
        for (const transaction of backupData.transactions) {
          await DetailedAccount.findOneAndUpdate(
            { _id: transaction._id },
            transaction,
            { upsert: true, new: true }
          );
        }
        console.log(`${backupData.transactions.length} transações restauradas`);
      }
      
      if (backupData.cards && backupData.cards.length > 0) {
        for (const card of backupData.cards) {
          await Card.findOneAndUpdate(
            { _id: card._id },
            card,
            { upsert: true, new: true }
          );
        }
        console.log(`${backupData.cards.length} cartões restaurados`);
      }
      
      if (backupData.investments && backupData.investments.length > 0) {
        for (const investment of backupData.investments) {
          await Investment.findOneAndUpdate(
            { _id: investment._id },
            investment,
            { upsert: true, new: true }
          );
        }
        console.log(`${backupData.investments.length} investimentos restaurados`);
      }
      
      console.log('Todos os dados foram restaurados do backup');
    }
  } catch (error) {
    console.log('Erro ao restaurar backup:', error.message);
  }
}

async function connectDB() {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.MONGO_URI) {
      const backupData = await loadBackupData();
      const mongod = await MongoMemoryServer.create();
      const mongoUri = mongod.getUri();
      await mongoose.connect(mongoUri);
      console.log('MongoDB em memória + backup JSON ativo');
      if (backupData && Object.keys(backupData).some(key => backupData[key]?.length > 0)) {
        setTimeout(async () => {
          await restoreBackupData(backupData);
          console.log('Dados do backup JSON carregados no MongoDB');
        }, 1000);
      } else {
        console.log('Backup vazio - banco limpo para começar');
      }
      
      process.on('SIGINT', async () => {
        console.log('Salvando dados antes de encerrar...');
        try {
          await saveBackupData();
          console.log('Backup salvo com sucesso!');
        } catch (error) {
          console.error('Erro ao salvar backup:', error.message);
        }
        process.exit(0);
      });
      setInterval(async () => {
        try {
          await saveBackupData();
          console.log('Auto-backup realizado');
        } catch (error) {
          
        }
      }, 60000);

      console.log('Sistema ativo: MongoDB (sessão) + JSON (backup automático)');
      
    } else {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Conectado ao MongoDB');
    }
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
  }
}

async function getCurrentMongoData() {
  try {
    const User = mongoose.model('User');
    const DetailedAccount = mongoose.model('DetailedAccount');
    const Account = mongoose.model('Account');
    const Card = mongoose.model('Card');
    const Investment = mongoose.model('Investment');
    
    const users = await User.find();
    const transactions = await DetailedAccount.find();
    const accounts = await Account.find();
    const cards = await Card.find();
    const investments = await Investment.find();
    
    return { users, transactions, accounts, cards, investments };
  } catch (error) {
    console.log('Erro ao obter dados do MongoDB:', error.message);
    return { users: [], transactions: [], accounts: [], cards: [], investments: [] };
  }
}

module.exports = connectDB;