const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/producao', (req, res) => {
  const energiaProduzida = (Math.random() * 20 + 5).toFixed(2); // 1 a 6 kWh
  const instalacaoId = req.query.instalacaoId || 'simulada-001';

  res.json({
    instalacaoId,
    energiaProduzida: parseFloat(energiaProduzida),
    timestamp: new Date().toISOString()
  });
});

// Adiciona no mesmo app (cliente-api)
app.get('/consumo', (req, res) => {
  const energiaConsumida = (Math.random() * 4 + 1).toFixed(2); // 1 a 5 kWh
  const instalacaoId = req.query.instalacaoId || 'simulada-001';

  res.json({
    instalacaoId,
    energiaConsumida: parseFloat(energiaConsumida),
    timestamp: new Date().toISOString()
  });
});


const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API Simulada do Cliente a correr em http://localhost:${PORT}`);
});
