const express = require('express');
const app = express();
const videoRouter = require('./routes/videoRoute');
const authRouter = require('./routes/authRoute');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');


mongoose.connect(process.env.MONGO_URL,(error)=>{
  if (error) {
    console.log(error);
    return false;
  }

  console.log('Connected to mongodb succesfully!');
});


app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());
app.use(videoRouter);
app.use(authRouter);



app.listen(3000,()=>{
  console.log('Server is running on port 3000');
  console.log(process.env.MONGO_URL);
});