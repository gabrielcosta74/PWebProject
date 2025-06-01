const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const User = require('../models/User');
const Instalacao = require('../models/Instalacao');
const Producao = require('../models/Producao');
const Consumo = require('../models/Consumo');
const sendEmail = require('../utils/sendEmail');

// Middleware: apenas GestorOperacoes
const onlyGestor = [auth, checkRole('GestorOperacoes')];

// GET /api/gestor/clientes
router.get('/clientes', onlyGestor, async (req, res) => {
  try {
    const clientes = await User.find({ role: 'Cliente' }).select('-password');

    const dados = await Promise.all(clientes.map(async (cliente) => {
      const instalacoes = await Instalacao.find({ cliente: cliente._id });

      const detalhes = await Promise.all(instalacoes.map(async (inst) => {
        const producao = await Producao.find({ instalacao: inst._id });
        const consumo = await Consumo.find({ instalacao: inst._id });
        
        const totalProducao = producao.reduce((sum, p) => sum + p.valor, 0);
        const totalConsumo = consumo.reduce((sum, c) => sum + c.valor, 0);
        const creditos = totalProducao - totalConsumo;

        return {
          ...inst.toObject(),
          totalProducao: totalProducao.toFixed(2),
          totalConsumo: totalConsumo.toFixed(2),
          creditos: creditos.toFixed(2)
        };
      }));

      return {
        clienteId: cliente._id,
        username: cliente.username,
        email: cliente.email,
        instalacoes: detalhes
      };
    }));

    res.json(dados);
  } catch (err) {
    console.error('[ERRO listar clientes]', err);
    res.status(500).json({ message: 'Erro ao buscar dados dos clientes' });
  }
});

// Atualizar produção (Gestor de Operações)
router.post('/atualizar-producao/:instalacaoId', onlyGestor, async (req, res) => {
    const instalacaoId = req.params.instalacaoId;
  
    try {
      const resApi = await fetch(`http://localhost:4000/producao`);
      const dataApi = await resApi.json();
      const valor = dataApi.energiaProduzida;
  
      const instalacao = await Instalacao.findById(instalacaoId);
      if (!instalacao) return res.status(404).json({ message: 'Instalação não encontrada' });
  
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  
      const producaoExistente = await Producao.findOne({
        instalacao: instalacaoId,
        timestamp: { $gte: inicioMes }
      });
  
      if (producaoExistente) {
        producaoExistente.valor = valor;
        producaoExistente.timestamp = dataApi.timestamp || Date.now();
        await producaoExistente.save();
      } else {
        await Producao.create({
          instalacao: instalacaoId,
          cliente: instalacao.cliente,
          valor,
          timestamp: dataApi.timestamp || Date.now()
        });
      }
  
      res.json({ message: 'Produção atualizada com sucesso', valor });
    } catch (err) {
      console.error('[ERRO atualizar produção]', err);
      res.status(500).json({ message: 'Erro ao atualizar produção' });
    }
  });
  
  
  
  
  
  router.post('/atualizar-consumo/:instalacaoId', onlyGestor, async (req, res) => {
    const instalacaoId = req.params.instalacaoId;
  
    try {
      const resApi = await fetch(`http://localhost:4000/consumo`);
      const dataApi = await resApi.json();
      const valor = dataApi.energiaConsumida;
  
      const instalacao = await Instalacao.findById(instalacaoId);
      if (!instalacao) return res.status(404).json({ message: 'Instalação não encontrada' });
  
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  
      const consumoExistente = await Consumo.findOne({
        instalacao: instalacaoId,
        timestamp: { $gte: inicioMes }
      });
  
      if (consumoExistente) {
        consumoExistente.valor = valor;
        consumoExistente.timestamp = dataApi.timestamp || Date.now();
        await consumoExistente.save();
      } else {
        await Consumo.create({
          instalacao: instalacaoId,
          cliente: instalacao.cliente,
          valor,
          timestamp: dataApi.timestamp || Date.now()
        });
      }
  
      res.json({ message: 'Consumo atualizado com sucesso', valor });
    } catch (err) {
      console.error('[ERRO atualizar consumo]', err);
      res.status(500).json({ message: 'Erro ao atualizar consumo' });
    }
  });
  
  
// Endpoint para obter valores (produção, consumo e créditos) por instalação
router.get('/valores/:instalacaoId', auth, checkRole('GestorOperacoes'), async (req, res) => {
    const { instalacaoId } = req.params;
  
    try {
      // Última produção
      const ultimaProducao = await Producao.findOne({ instalacao: instalacaoId }).sort({ timestamp: -1 });
  
      // Último consumo
      const ultimoConsumo = await Consumo.findOne({ instalacao: instalacaoId }).sort({ timestamp: -1 });
  
      // Créditos (producao - consumo acumulado do mês)
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  
      const producoesMes = await Producao.find({
        instalacao: instalacaoId,
        timestamp: { $gte: inicioMes }
      });
  
      const consumosMes = await Consumo.find({
        instalacao: instalacaoId,
        timestamp: { $gte: inicioMes }
      });
  
      const totalProducao = producoesMes.reduce((sum, p) => sum + p.valor, 0);
      const totalConsumo = consumosMes.reduce((sum, c) => sum + c.valor, 0);
  
      res.json({
        producao: ultimaProducao ? ultimaProducao.valor.toFixed(2) : null,
        consumo: ultimoConsumo ? ultimoConsumo.valor.toFixed(2) : null,
        creditos: (totalProducao - totalConsumo).toFixed(2)
      });
    } catch (err) {
      console.error('[ERRO valores por instalação]', err);
      res.status(500).json({ message: 'Erro ao obter valores da instalação' });
    }
  });

  router.get('/clientes-detalhado', auth, checkRole('GestorOperacoes'), async (req, res) => {
    try {
      const clientes = await User.find({ role: 'Cliente' }).select('-password');
  
      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  
      const resultado = await Promise.all(clientes.map(async (cliente) => {
        const instalacoes = await Instalacao.find({ cliente: cliente._id });
  
        let creditosTotaisCliente = 0;
        let creditosMesCliente = 0;
  
        const detalhesInstalacoes = await Promise.all(instalacoes.map(async (inst) => {
          // Produção total da instalação
          const producoes = await Producao.find({ instalacao: inst._id });
          const consumos = await Consumo.find({ instalacao: inst._id });
  
          const producaoTotal = producoes.reduce((sum, p) => sum + p.valor, 0);
          const consumoTotal = consumos.reduce((sum, c) => sum + c.valor, 0);
          const creditosTotais = producaoTotal - consumoTotal;
  
          // Produção e consumo do mês
          const producaoMes = producoes.filter(p => p.timestamp >= inicioMes).reduce((sum, p) => sum + p.valor, 0);
          const consumoMes = consumos.filter(c => c.timestamp >= inicioMes).reduce((sum, c) => sum + c.valor, 0);
          const creditosMes = producaoMes - consumoMes;
  
          creditosTotaisCliente += creditosTotais;
          creditosMesCliente += creditosMes;
  
          return {
            instalacaoId: inst._id,
            localizacao: inst.localizacao,
            capacidadeKW: inst.capacidadeKW,
            marcaPainel: inst.marcaPainel,
            certificado: inst.certificado,
            status: inst.status,
            producaoMes: producaoMes.toFixed(2),
            consumoMes: consumoMes.toFixed(2),
            creditosMes: creditosMes.toFixed(2),
            creditosTotais: creditosTotais.toFixed(2)
          };
        }));
  
        return {
          clienteId: cliente._id,
          username: cliente.username,
          email: cliente.email,
          creditosMes: creditosMesCliente.toFixed(2),
          creditosTotais: creditosTotaisCliente.toFixed(2),
          instalacoes: detalhesInstalacoes
        };
      }));
  
      res.json(resultado);
    } catch (err) {
      console.error('[ERRO clientes-detalhado]', err);
      res.status(500).json({ message: 'Erro ao buscar dados detalhados' });
    }
  });

  router.post('/enviar-emails', onlyGestor, async (req, res) => {
    try {
      const clientes = await User.find({ role: 'Cliente' });
  
      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  
      for (const cliente of clientes) {
        const instalacoes = await Instalacao.find({ cliente: cliente._id });
  
        let producaoMes = 0;
        let consumoMes = 0;
  
        for (const inst of instalacoes) {
          const producoes = await Producao.find({
            instalacao: inst._id,
            timestamp: { $gte: inicioMes }
          });
          const consumos = await Consumo.find({
            instalacao: inst._id,
            timestamp: { $gte: inicioMes }
          });
  
          producaoMes += producoes.reduce((sum, p) => sum + p.valor, 0);
          consumoMes += consumos.reduce((sum, c) => sum + c.valor, 0);
        }
  
        const creditosMes = producaoMes - consumoMes;
  
        if (cliente.email) {
          await sendEmail({
            to: cliente.email,
            subject: 'Relatório Mensal de Créditos de Energia',
            text: `Olá ${cliente.username},
  
  Aqui está o seu resumo mensal de energia:
  
  🔋 Produção: ${producaoMes.toFixed(2)} kWh
  💡 Consumo: ${consumoMes.toFixed(2)} kWh
  ✅ Créditos acumulados no mês: ${creditosMes.toFixed(2)} kWh
  
  Obrigado por usar a plataforma EnergiaSolar!`
          });
        }
      }
  
      res.json({ message: 'E-mails enviados com sucesso!' });
    } catch (err) {
      console.error('[ERRO ENVIAR EMAILS]', err);
      res.status(500).json({ message: 'Erro ao enviar e-mails' });
    }
  });


module.exports = router;
