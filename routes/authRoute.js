const express = require('express');
const router = express.Router();
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/signup',async (req,res) => {
  const userBody = req.body.user;
  if (userBody) {
    try {
      const verifUser = await User.findOne({email:userBody.email});
      if (verifUser) {
        return res.status(200).json({
          status:'ERROR',
          message: `l'Addresse ${userBody.email} existe déjà`
        });
      }
      const newPassword = await bcrypt.hash(userBody.password,10);
      const user = new User({email:userBody.email,password:newPassword});
      await user.save();
      const token = jwt.sign({id:user._id},process.env.JWT_KEY);
      return res.status(200).json({
        status:'OK',
        token: token,
        user_id: user._id
      });
      
    } catch (error) {
      console.log(error);
      return res.status(200).json({
        status:'ERROR',
        message: 'Internal error try later'
      });
    }
    
  }
  
});

router.post('/signin',async (req,res) => {
  const userBody = req.body.user;
  if (userBody) {
    try {
      const user = await User.findOne({email:userBody.email});
      if (!user) {
        return res.status(200).json({
          status: 'ERROR',
          message: "Email ou mot de passe incorrect!"
        });
      }

      const match = await bcrypt.compare(userBody.password,user.password);
      if (!match) {
        return res.status(200).json({
          status: 'ERROR',
          message: "Email ou mot de passe incorrect!"
        });
      }  

      const token = jwt.sign({id:user._id},process.env.JWT_KEY);
      return res.status(200).json({
        status:'OK',
        token: token,
        user_id: user._id
      });
      
    } catch (error) {
      console.log(error);
      return res.status(200).json({
        status:'ERROR',
        message: 'Internal error try later'
      });
    }
  }

});

module.exports = router;