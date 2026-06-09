const userDTO = require('../../models/User')

async function updateUser({ userId, userData, repository }) {
  try {
    // Buscar usuário atual
    const currentUser = await repository.findById(userId)
    if (!currentUser) {
      throw new Error('Usuário não encontrado')
    }

    // Verificar se email está sendo alterado e se já existe
    if (userData.email && userData.email !== currentUser.email) {
      const existingUser = await repository.get({ email: userData.email })
      if (existingUser && existingUser.length > 0) {
        throw new Error('Este email já está sendo usado por outro usuário')
      }
    }

    // Criar objeto com dados atualizados (só inclui campos que foram enviados)
    const updatedUserData = {}
    if (userData.username) updatedUserData.username = userData.username
    if (userData.email) updatedUserData.email = userData.email
    if (userData.password) updatedUserData.password = userData.password

    // Se não há dados para atualizar
    if (Object.keys(updatedUserData).length === 0) {
      throw new Error('Nenhum dado para atualizar')
    }

    // Atualizar no banco
    const result = await repository.updateById(userId, updatedUserData)
    
    return result
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    throw error
  }
}

module.exports = updateUser