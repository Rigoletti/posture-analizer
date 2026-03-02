import axios from 'axios';
import qs from 'querystring';
import https from 'https';
import User from '../models/User.mjs';
import { generateToken, setTokenCookie } from '../middleware/auth.mjs';

// Создаем экземпляр axios с увеличенными таймаутами
const axiosInstance = axios.create({
  timeout: 10000, // 10 секунд таймаут
  httpsAgent: new https.Agent({ 
    keepAlive: true,
    rejectUnauthorized: false // Для локальной разработки
  })
});

const parseYandexName = (yandexUser) => {
  let lastName = yandexUser.last_name || '';
  let firstName = yandexUser.first_name || '';
  let middleName = yandexUser.middle_name || '';
  
  if (!lastName && !firstName) {
    const login = yandexUser.login || 'Пользователь';
    firstName = login;
    lastName = '';
  }
  
  return { lastName, firstName, middleName };
};

export const yandexAuth = (req, res) => {
  try {
    const { YANDEX_CLIENT_ID, YANDEX_REDIRECT_URI } = process.env;
    
    const params = qs.stringify({
      response_type: 'code',
      client_id: YANDEX_CLIENT_ID,
      redirect_uri: YANDEX_REDIRECT_URI,
      scope: 'login:info login:email login:avatar',
      force_confirm: true
    });
    
    const authUrl = `${process.env.YANDEX_AUTH_URL}?${params}`;
    console.log('Yandex auth URL generated:', authUrl);
    
    res.status(200).json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Yandex auth initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при инициализации авторизации через Яндекс'
    });
  }
};

export const yandexCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      console.error('No code provided in callback');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=Ошибка авторизации через Яндекс`);
    }

    console.log('Exchanging code for token...');
    
    // Обмен кода на токен
    let tokenResponse;
    try {
      tokenResponse = await axiosInstance.post(
        process.env.YANDEX_TOKEN_URL,
        qs.stringify({
          grant_type: 'authorization_code',
          code: code,
          client_id: process.env.YANDEX_CLIENT_ID,
          client_secret: process.env.YANDEX_CLIENT_SECRET
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError.message);
      if (tokenError.code === 'ETIMEDOUT') {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=Сервер Яндекса не отвечает. Попробуйте позже.`);
      }
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=Ошибка при получении токена доступа`);
    }
    
    const { access_token } = tokenResponse.data;
    
    if (!access_token) {
      console.error('No access token in response');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=Не удалось получить токен доступа`);
    }

    console.log('Token received, fetching user info...');
    
    // Получение информации о пользователе
    let userInfoResponse;
    try {
      userInfoResponse = await axiosInstance.get(process.env.YANDEX_USER_INFO_URL, {
        headers: {
          'Authorization': `OAuth ${access_token}`
        },
        params: {
          format: 'json'
        }
      });
    } catch (userInfoError) {
      console.error('User info error:', userInfoError.message);
      if (userInfoError.code === 'ETIMEDOUT') {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=Таймаут при получении данных пользователя`);
      }
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=Ошибка при получении данных пользователя`);
    }
    
    const yandexUser = userInfoResponse.data;
    console.log('Yandex user data received successfully');
    
    // Поиск или создание пользователя
    let user = await User.findByYandexId(yandexUser.id);
    
    if (!user) {
      if (yandexUser.default_email) {
        user = await User.findOne({ email: yandexUser.default_email });
        
        if (user) {
          user.yandexId = yandexUser.id;
          user.authProvider = 'yandex';
          
          if (yandexUser.is_avatar_empty === false) {
            user.yandexAvatar = `https://avatars.yandex.net/get-yapic/${yandexUser.default_avatar_id}/islands-200`;
          }
          
          if (!user.emailVerified) {
            user.emailVerified = true;
          }
          
          await user.save();
        }
      }
      
      if (!user) {
        const { lastName, firstName, middleName } = parseYandexName(yandexUser);
        
        user = new User({
          lastName,
          firstName,
          middleName,
          email: yandexUser.default_email || `${yandexUser.id}@yandex.ru`,
          emailVerified: true,
          yandexId: yandexUser.id,
          authProvider: 'yandex'
        });
        
        if (yandexUser.is_avatar_empty === false) {
          user.yandexAvatar = `https://avatars.yandex.net/get-yapic/${yandexUser.default_avatar_id}/islands-200`;
        }
        
        await user.save();
      }
    }
    
    await user.updateLastLogin();
    
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    
    const userResponse = {
      _id: user._id,
      lastName: user.lastName,
      firstName: user.firstName,
      middleName: user.middleName,
      fullName: user.fullName,
      shortName: user.shortName,
      email: user.email,
      role: user.role,
      postureSettings: user.postureSettings,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      authProvider: user.authProvider,
      yandexAvatar: user.yandexAvatar
    };
    
    const userDataEncoded = encodeURIComponent(JSON.stringify(userResponse));
    res.redirect(`${process.env.FRONTEND_URL}/yandex-callback?user=${userDataEncoded}&token=${token}`);
    
  } catch (error) {
    console.error('Yandex callback error:', error);
    
    let errorMessage = 'Ошибка при авторизации через Яндекс';
    if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Превышено время ожидания ответа от Яндекса. Попробуйте позже.';
    } else if (error.response) {
      console.error('Yandex API error:', error.response.data);
      errorMessage = error.response.data.error_description || errorMessage;
    }
    
    res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`);
  }
};

export const yandexAuthStatus = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не авторизован'
      });
    }
    
    res.status(200).json({
      success: true,
      isYandexUser: user.authProvider === 'yandex',
      yandexAvatar: user.yandexAvatar || null
    });
    
  } catch (error) {
    console.error('Yandex auth status error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при проверке статуса Яндекс авторизации'
    });
  }
};

export const disconnectYandex = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.authProvider !== 'yandex') {
      return res.status(400).json({
        success: false,
        error: 'Аккаунт не привязан к Яндексу'
      });
    }
    
    user.yandexId = undefined;
    user.yandexAvatar = undefined;
    user.authProvider = 'local';
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Яндекс аккаунт успешно отключен'
    });
    
  } catch (error) {
    console.error('Disconnect Yandex error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при отключении Яндекса'
    });
  }
};