const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage, session } = require('electron');
const path = require('path');

// Константы 

const isDev = process.env.NODE_ENV === 'development';
const DEV_URL = 'http://localhost:5173';
const PROD_PATH = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');

let mainWindow = null;
let tray = null;
let isQuitting = false;

// Разрешаем загрузку моделей TensorFlow.js по HTTPS 
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors,ChromeWhatsNewUI');
app.commandLine.appendSwitch('cors-exempt-headers', 'x-goog-*');
// Отключаем DNS-предзагрузку, чтобы избежать конфликтов
app.commandLine.appendSwitch('disable-dns-prefetch');

// Настройки сессии 

function setupSession() {
  const ses = session.defaultSession;

  // Разрешаем доступ к веб-камере
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'mediaKeySystem', 'camera'];
    callback(allowedPermissions.includes(permission));
  });

  // Разрешаем доступ к камере без всплывающего запроса
  ses.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    const allowedPermissions = ['media', 'mediaKeySystem', 'camera'];
    return allowedPermissions.includes(permission);
  });

  // Разрешаем ВСЕ сетевые запросы (модели TF загружаются с tfhub.dev, googleapis.com и др.)
  ses.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: false });
  });

  // Увеличиваем размер кэша для моделей
  ses.setCacheSize(200 * 1024 * 1024); // 200 MB
}

// Создание окна 

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Posture Analyzer',
    icon: path.join(__dirname, '..', 'frontend', 'public', 'vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      // Отключаем webSecurity для загрузки моделей TensorFlow.js из внешних источников
      // Это необходимо, т.к. @tensorflow-models/pose-detection загружает модель с tfhub.dev
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
    show: false, 
  });

  // Загружаем приложение
  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(PROD_PATH);
  }

  // Показываем окно после готовности
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // При закрытии окна — не выходим, а скрываем в трей
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

 // Отключаем ограничение производительности фоновых вкладок — критично для фонового ана-лиза
  mainWindow.webContents.setBackgroundThrottling(false);
}


function createTray() {
  // Создаём иконку для трея (16x16)
  const iconPath = path.join(__dirname, '..', 'frontend', 'public', 'vite.svg');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip('Posture Analyzer');

  updateTrayMenu('idle');

  // ЛКМ — показать/скрыть окно
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function updateTrayMenu(status) {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Показать окно',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: status === 'running' ? ' Анализ активен' : '⏸ Анализ остановлен',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Выход',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  if (tray) {
    tray.setContextMenu(contextMenu);
  }
}

function setupIPC() {
  // Отправка нативного уведомления
  ipcMain.on('show-notification', (event, { title, body }) => {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title || 'Posture Analyzer',
        body: body || '',
        icon: path.join(__dirname, '..', 'frontend', 'public', 'vite.svg'),
      });
      notification.on('click', () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      });
      notification.show();
    }
  });

  // Обновление статуса в трее
  ipcMain.on('update-tray-status', (event, status) => {
    updateTrayMenu(status);
  });

  // Получение информации о платформе
  ipcMain.handle('get-platform', () => {
    return {
      platform: process.platform,
      isElectron: true,
    };
  });

  // Проверка доступности камеры
  ipcMain.handle('check-camera', async () => {
    try {
      const { systemPreferences } = require('electron');
      if (process.platform === 'darwin') {
        return systemPreferences.getMediaAccessStatus('camera');
      }
      return 'granted'; // На Windows/Linux считаем, что доступ есть
    } catch {
      return 'granted';
    }
  });
}

//  Жизненный цикл приложения 

app.whenReady().then(() => {
  setupSession();
  createWindow();
  createTray();
  setupIPC();

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  // Не выходим — приложение должно жить в трее
  // Выход только через меню "Выход"
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Предотвращаем выход при закрытии всех окон
app.on('will-quit', () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
});
