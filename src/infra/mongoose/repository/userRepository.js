const { User } = require('../modelos');

const create = async (userData) => {
    const user = new User(userData);
    return user.save();
};

const getById = async (id) => {
  return User.findById(id);
};

const get = async (user={}) => {
    return User.find(user);
};

const findById = async (id) => {
    return User.findById(id);
};

const updateById = async (id, updateData) => {
    return User.findByIdAndUpdate(id, updateData, { 
        new: true, // Retorna o documento atualizado
        runValidators: true // Executa validações do schema
    });
};

module.exports = {
  create,
  getById,
  get,
  findById,
  updateById
};