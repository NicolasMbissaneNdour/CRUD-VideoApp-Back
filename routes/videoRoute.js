const express = require('express');
const router = express.Router();
const multer = require('multer');
const Video = require('../models/videoSchema');
const authMiddleware = require('../middlewares/authMiddleware');
const fs = require('fs');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    if (file.mimetype == 'video/mp4') {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix+'.mp4')
    }
    else {
      cb(new Error('Type de format non pris en charge'));
    }
   
  }
});

const upload = multer({ storage: storage }).single('video');


router.get('/videos',async (req,res) => {
  try {
    //console.log(req.headers.range);
    const videos = await Video.find();
    //console.log(videos);
    return res.status(200).json({
      status: 'OK',
      videos: videos
    });
  } catch (error) {
    return res.status(200).json({
      status: 'ERROR',
      message: "Erreur interne réessayez plus tard!"
    });
  }
  
});

router.post('/videos',authMiddleware, async (req,res) => {
  upload(req,res,async(error) => {
    if (error) {
      return res.status(200).json({
        status: 'ERROR',
        message: error.message
      })
    }
    if (!req.body.title) {
      return res.status(200).json({
        status: 'ERROR',
        message: 'Le titre de la video est obligatoire'
      });
    }

    
    const video = new Video({
      title: req.body.title,
      link: req.file.path,
      user_id: req.user._id
    });

    try {
      const result = await video.save();
      return res.status(200).json({
        status: 'OK',
        video: result
      });
    } catch (error) {
      console.log(error);
      return res.status(200).json({
        status: 'ERROR',
        message: "Erreur interne réessayez plus tard!"
      });
    }

  });
  
});

router.get('/videos/:id',async (req,res) => {
  if (!req.params.id) {
    return res.status(200).json({
      status: 'ERROR',
      message: 'Vidéo introuvable'
    });
  }

  const video = await Video.findById(req.params.id);
    if (video) {
      return res.status(200).json({
        status: 'OK',
        video: video
      });
    }
    return res.status(200).json({
      status: 'ERROR',
      message: 'Vidéo introuvable'
    });
  
});

router.get('/videostream/:id',async (req,res) =>{
  if (!req.params.id) {
    return res.status(200).json({
      status: 'ERROR',
      message: 'Vidéo introuvable'
    });
  }

  //Ensure that the client want to read an video
  const range = req.headers.range;
  
  if (!range) {
    return res.status(200).json({
      status: 'ERROR',
      message: 'Vidéo introuvable'
    });
  }

  const video = await Video.findById(`${req.params.id}`);

  let videoPath;
  video ? videoPath = video.link : videoPath = "uploads/video-1633612534268-977920340.mp4";
  const videoSize = fs.statSync(videoPath).size;
  

  //Parse range
  const CHUNK_SIZE = 10 ** 6;
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  //Create headers
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };
  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);
  
  // create video read stream for this particular chunk
  const videoStream = fs.createReadStream(videoPath, { start, end });
  // Stream the video chunk to the client
  videoStream.pipe(res);

});

router.delete('/videos/:id',authMiddleware,async (req,res) => {
  try {
    const video = await Video.findOne({ _id: `${req.params.id}`,user_id: req.user._id }) //Video.findById(`${req.params.id}`);
    if (!video) {
      return res.status(200).json({
        status: 'ERROR',
        message: 'Vidéo introuvable'
      });
    }
    
    const result = await video.delete();
    
    fs.rmSync(video.link);
    if (result) {
      return res.status(200).json({
        status: 'OK',
        message: 'Vidéo supprimé'
      });
    }
  } catch (error) {
      return res.status(200).json({
        status: 'ERROR',
        message: "Erreur interne réessayez ultérieurement"
      });
  }

});

router.put('/videos/:id',authMiddleware,async (req,res) => {

  try {
    const video = await Video.findOne({_id:req.params.id,user_id:req.user._id});
    if (!video) {
      return res.status(200).json({
        status: "ERROR",
        message: "Action non autorisé"
      });
    }
    
    upload(req,res,async (error)=>{
      if (error) {
        console.log(error);
        return res.status(200).json({
          status: "ERROR",
          message: "Erreur interne réessayez ultèrieurement"
        });
      }
      video.title = req.body.title;
      
      if(req.file) {
        fs.rmSync(video.link);
        video.link = req.file.path;
        
      }
      const result = await video.save();
      console.log(result);
      return res.status(200).json({
        status: "OK",
        video
      });
    });
    
  } catch (error) {
    return res.status(200).json({
      status: "ERROR",
      message: "Erreur interne réesayez plus tard"
    });
  }

  
  
});

module.exports = router;