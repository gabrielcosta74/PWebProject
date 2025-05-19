module.exports = function (roleEsperado) {
    return (req, res, next) => {
      if (req.user && req.user.role === roleEsperado) {
        next();
      } else {
        res.status(403).json({ message: 'Acesso negado: role inválido' });
      }
    };
  };
  