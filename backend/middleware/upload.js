const multer = require('multer');
const path = require('path');

// Pasta onde os certificados serão guardados
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/certificados/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `certificado_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Apenas ficheiros PDF são permitidos'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
