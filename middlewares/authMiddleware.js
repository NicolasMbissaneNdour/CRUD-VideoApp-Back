const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');

const authMiddleware = async (req,res,next) => {
  const authorization = req.headers.authorization;
  if(!authorization) {
    return res.status(200).json({
      status: 'ERROR',
      message: "Vous n'etes pas connecté"
    });
  }
  const token = authorization.replace('Bearer ','');
  try {
    jwt.verify(token,process.env.JWT_KEY,async (error,payload)=>{
      if (error) {
        return res.status(200).json({
          status: 'ERROR',
          message: "Vous n'etes pas connecté"
        });
      }
      const user = await User.findById(payload.id);
      if (user) {
        req.user = user;
        next();
      }
      else {
        return res.status(200).json({
          status: 'ERROR',
          message: "Vous n'etes pas connecté"
        });
      }
    });
  } catch (error) {
    return res.status(200).json({
      status: 'ERROR',
      message: 'Erreur interne réssauez plus tard'
    });
  }
  
}

module.exports = authMiddleware;