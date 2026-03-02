import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const avatarsThumbnailsDir = path.join(avatarsDir, 'thumbnails');

console.log('=== AVATAR UPLOAD CONFIGURATION ===');
console.log('Uploads directory:', uploadsDir);
console.log('Avatars directory:', avatarsDir);
console.log('Thumbnails directory:', avatarsThumbnailsDir);

// Создаем все необходимые директории
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(avatarsDir)) {
  console.log('Creating avatars directory...');
  fs.mkdirSync(avatarsDir, { recursive: true });
}

if (!fs.existsSync(avatarsThumbnailsDir)) {
  console.log('Creating avatars thumbnails directory...');
  fs.mkdirSync(avatarsThumbnailsDir, { recursive: true });
}

console.log('Directories created successfully');
console.log('=============================');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log('=== AVATAR FILE FILTER CHECK ===');
  console.log('Checking file:', file.originalname);
  console.log('Mimetype:', file.mimetype);
  
  // Проверяем MIME тип изображения
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  console.log('Is MIME type allowed?', allowedMimeTypes.includes(file.mimetype));
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log('File accepted');
    cb(null, true);
  } else {
    console.log('File rejected - MIME:', file.mimetype);
    cb(new Error('Только изображения (JPEG, PNG, GIF, WEBP) разрешены'), false);
  }
};

export const uploadAvatar = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
}).single('avatar');

export const handleAvatarUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Файл не загружен'
      });
    }

    console.log('=== PROCESSING AVATAR UPLOAD ===');
    console.log('Original file size:', req.file.size, 'bytes');
    console.log('Mimetype:', req.file.mimetype);

    const userId = req.user._id.toString();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    
    // Генерируем имена файлов
    const avatarFilename = `avatar-${userId}-${timestamp}-${randomString}.jpg`;
    const thumbnailFilename = `thumbnail-${userId}-${timestamp}-${randomString}.jpg`;
    
    const avatarPath = path.join(avatarsDir, avatarFilename);
    const thumbnailPath = path.join(avatarsThumbnailsDir, thumbnailFilename);
    
    const relativeAvatarPath = `/uploads/avatars/${avatarFilename}`;
    const relativeThumbnailPath = `/uploads/avatars/thumbnails/${thumbnailFilename}`;

    console.log('Saving avatar to:', avatarPath);
    console.log('Saving thumbnail to:', thumbnailPath);

    // Оптимизируем и сохраняем основное изображение
    await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toFile(avatarPath);

    // Создаем миниатюру
    await sharp(req.file.buffer)
      .resize(100, 100, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    console.log('Avatar saved successfully');
    console.log('=============================');

    // Удаляем старый аватар, если он есть
    if (req.user.avatar) {
      const oldAvatarPath = path.join(uploadsDir, req.user.avatar.replace('/uploads/', ''));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
        console.log('Old avatar deleted:', oldAvatarPath);
      }
    }

    if (req.user.avatarThumbnail) {
      const oldThumbnailPath = path.join(uploadsDir, req.user.avatarThumbnail.replace('/uploads/', ''));
      if (fs.existsSync(oldThumbnailPath)) {
        fs.unlinkSync(oldThumbnailPath);
        console.log('Old thumbnail deleted:', oldThumbnailPath);
      }
    }

    // Добавляем пути к файлам в запрос
    req.avatarPath = relativeAvatarPath;
    req.thumbnailPath = relativeThumbnailPath;
    
    next();
  } catch (error) {
    console.error('=== AVATAR PROCESSING ERROR ===');
    console.error('Error details:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Ошибка при обработке изображения'
    });
  }
};

export const handleUploadError = (err, req, res, next) => {
  console.error('=== AVATAR UPLOAD ERROR ===');
  console.error('Error details:', err);
  console.error('Error code:', err.code);
  console.error('Error message:', err.message);
  
  if (err instanceof multer.MulterError) {
    console.error('Multer error code:', err.code);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Файл слишком большой. Максимальный размер: 5MB'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Можно загрузить только один файл'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: `Ошибка загрузки файла: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Ошибка при загрузке аватара'
    });
  }
  next();
};

export const deleteAvatarFile = (avatarPath, thumbnailPath) => {
  console.log('Attempting to delete avatar files:');
  console.log('Avatar:', avatarPath);
  console.log('Thumbnail:', thumbnailPath);
  
  if (avatarPath) {
    const fullAvatarPath = path.join(uploadsDir, avatarPath.replace('/uploads/', ''));
    if (fs.existsSync(fullAvatarPath)) {
      try {
        fs.unlinkSync(fullAvatarPath);
        console.log('Avatar file deleted:', fullAvatarPath);
      } catch (error) {
        console.error('Error deleting avatar file:', error);
      }
    }
  }
  
  if (thumbnailPath) {
    const fullThumbnailPath = path.join(uploadsDir, thumbnailPath.replace('/uploads/', ''));
    if (fs.existsSync(fullThumbnailPath)) {
      try {
        fs.unlinkSync(fullThumbnailPath);
        console.log('Thumbnail file deleted:', fullThumbnailPath);
      } catch (error) {
        console.error('Error deleting thumbnail file:', error);
      }
    }
  }
};