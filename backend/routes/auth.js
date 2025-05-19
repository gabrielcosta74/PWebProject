const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Apenas login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'Utilizador não encontrado' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: 'Palavra-passe incorreta' });

  // ✅ JWT inclui agora o `role`
  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

// Endpoint para verificar token
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    username: req.user.username,
    role: req.user.role
  });
});

module.exports = router;
