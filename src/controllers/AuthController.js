const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

const User = require('../models/User');

const routes = express.Router();

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });
}

routes.post('/register', async (req, res) => {
  const { email } = req.body;
  try {
    if(await User.findOne({ email }))
      return res.status(400).send({ error: 'Usuario ja existe.' });

    const user = await User.create(req.body);

    user.password = undefined;

    return res.send({ 
      user,
      token: generateToken({ id: user.id }),
    });

  }catch(err) {
    return res.status(400).send({ error: 'Falha no registro.' });
  }
});

routes.post('/authenticate', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if(!user)
      return res.status(400).send({ error: 'Usuario nao encontrado.' });

    if(!await bcrypt.compare(password, user.password))
      return res.status(400).send({ error: 'Senha invalida.' });
    
    user.password = undefined;// remove o password da resposta da requisição

    res.send({
      user,
      token: generateToken({ id: user.id }),
    });
});

module.exports = app => app.use('/auth', routes);