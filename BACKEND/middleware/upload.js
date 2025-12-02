import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

function checkFileType(file, cb) {
  const filetypes = /glb|gltf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // const mimetype = filetypes.test(file.mimetype); // mimetype for glb/gltf can vary, relying on extname for now

  if (extname) {
    return cb(null, true);
  } else {
    cb('Error: GLB/GLTF Images Only!');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

export default upload;
