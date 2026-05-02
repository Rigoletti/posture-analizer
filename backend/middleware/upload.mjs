import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
const exercisesDir = path.join(uploadsDir, 'exercises');

console.log('=== UPLOAD CONFIGURATION ===');
console.log('Uploads directory:', uploadsDir);
console.log('Exercises directory:', exercisesDir);

// Создаем все необходимые директории
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(exercisesDir)) {
  console.log('Creating exercises directory...');
  fs.mkdirSync(exercisesDir, { recursive: true });
}

console.log('Directories created successfully');
console.log('=============================');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('File upload destination:', exercisesDir);
    cb(null, exercisesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = 'model-' + uniqueSuffix + ext;
    console.log('Generated filename:', filename);
    console.log('Original filename:', file.originalname);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('=== FILE FILTER CHECK ===');
  console.log('Checking file:', file.originalname);
  console.log('Mimetype:', file.mimetype);
  console.log('Size:', file.size, 'bytes');
  
  // Проверяем расширение
  const allowedExtensions = ['.glb', '.gltf'];
  const ext = path.extname(file.originalname).toLowerCase();
  console.log('File extension:', ext);
  
  // Проверяем MIME type
  const allowedMimeTypes = [
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream',
    'text/plain' 
  ];
  
  console.log('Is extension allowed?', allowedExtensions.includes(ext));
  console.log('Is MIME type allowed?', allowedMimeTypes.includes(file.mimetype));
  
  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    console.log('File accepted');
    cb(null, true);
  } else {
    console.log('File rejected - extension:', ext, 'MIME:', file.mimetype);
    cb(new Error(`Только файлы формата ${allowedExtensions.join(', ')} разрешены`), false);
  }
};

export const uploadModel = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
    files: 1
  }
}).single('modelFile'); // Используем .single() для загрузки одного файла

export const uploadModelAny = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
    files: 1
  }
}).any();

export const handleUploadError = (err, req, res, next) => {
  console.error('=== UPLOAD ERROR ===');
  console.error('Error details:', err);
  console.error('Error code:', err.code);
  console.error('Error message:', err.message);
  
  if (err instanceof multer.MulterError) {
    console.error('Multer error code:', err.code);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `Файл слишком большой. Максимальный размер: 200MB. Ваш файл: ${err.message.includes('limit') ? 'превышает лимит' : 'слишком большой'}`
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Можно загрузить только один файл'
      });
    }
    
    if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Слишком много частей в форме'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: `Ошибка загрузки файла: ${err.message}`
    });
  } else if (err) {
    console.error('General upload error:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Ошибка при загрузке файла'
    });
  }
  next();
};

export const deleteModelFile = (filePath) => {
  console.log('Attempting to delete file:', filePath);
  
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log('Файл успешно удален:', filePath);
    } catch (error) {
      console.error('Ошибка при удалении файла:', error);
    }
  } else {
    console.log('Файл не найден или путь не указан:', filePath);
  }
};