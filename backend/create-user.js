const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // modelo de utilizador

// Ligar à base de dados
mongoose.connect('mongodb://localhost:27017/energia')
  .then(async () => {
    console.log('Ligado ao MongoDB');

    // Personaliza aqui:
    const username = 'cliente2';
    const plainPassword = 'cliente123';
    const role = 'Cliente'; // ou 'Tecnico'

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    try {
      const user = await User.create({ username, password: hashedPassword, role });
      console.log('Utilizador criado:', user);
    } catch (err) {
      console.error('Erro ao criar utilizador:', err.message);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => console.error('Erro de ligação ao MongoDB:', err));
