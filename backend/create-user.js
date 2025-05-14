// backend/create-user.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // caminho para o teu modelo

// Liga ao MongoDB
mongoose.connect('mongodb://localhost:27017/energia')
  .then(async () => {
    console.log('Ligado ao MongoDB');

    const username = 'admin';
    const plainPassword = 'admin123';

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    try {
      const user = await User.create({ username, password: hashedPassword });
      console.log('Utilizador criado:', user);
    } catch (err) {
      console.error('Erro ao criar utilizador:', err.message);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => console.error('Erro de ligação ao MongoDB:', err));
