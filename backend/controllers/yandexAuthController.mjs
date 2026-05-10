import axios from 'axios';
import qs from 'querystring';
import https from 'https';
import User from '../models/User.mjs';
import { generateToken, setTokenCookie } from '../middleware/auth.mjs';

const axiosInstance = axios.create({
  timeout: 15000,
  httpsAgent: new https.Agent({ 
    keepAlive: true,
    rejectUnauthorized: false
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
    console.log('=== Yandex Auth ===');
    console.log('Auth URL:', authUrl);
    console.log('Redirect URI (backend):', YANDEX_REDIRECT_URI);
    
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
  console.log('=== Yandex Callback on BACKEND ===');
  console.log('Query params:', req.query);
  
  try {
    const { code, error, error_description } = req.query;
    
    if (error) {
      console.error('Yandex returned error:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(error_description || error)}`);
    }
    
    if (!code) {
      console.error('No code provided in callback');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=Ошибка авторизации через Яндекс: код не получен`);
    }

    console.log('Exchanging code for token...');
    
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
      console.log('Token exchange successful');
    } catch (tokenError) {
      console.error('Token exchange error:', tokenError.message);
      if (tokenError.response) {
        console.error('Token error response:', tokenError.response.data);
      }
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=Ошибка при получении токена доступа`);
    }
    
    const { access_token } = tokenResponse.data;
    
    if (!access_token) {
      console.error('No access token in response');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=Не удалось получить токен доступа`);
    }

    console.log('Token received, fetching user info...');
    
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
      console.log('User info received');
    } catch (userInfoError) {
      console.error('User info error:', userInfoError.message);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=Ошибка при получении данных пользователя`);
    }
    
    const yandexUser = userInfoResponse.data;
    console.log('Yandex user:', { 
      id: yandexUser.id, 
      email: yandexUser.default_email,
      first_name: yandexUser.first_name 
    });
    
    let user = await User.findOne({ yandexId: yandexUser.id });
    
    if (!user && yandexUser.default_email) {
      user = await User.findOne({ email: yandexUser.default_email });
      
      if (user) {
        console.log('Linking existing user with Yandex');
        user.yandexId = yandexUser.id;
        user.authProvider = 'yandex';
        
        if (yandexUser.is_avatar_empty === false && yandexUser.default_avatar_id) {
          user.yandexAvatar = `https://avatars.yandex.net/get-yapic/${yandexUser.default_avatar_id}/islands-200`;
        }
        
        if (!user.emailVerified) {
          user.emailVerified = true;
        }
        
        await user.save();
      }
    }
    
    if (!user) {
      console.log('Creating new user from Yandex');
      const lastName = yandexUser.last_name || '';
      const firstName = yandexUser.first_name || yandexUser.login || 'Пользователь';
      const middleName = yandexUser.middle_name || '';
      
      user = new User({
        lastName,
        firstName,
        middleName,
        email: yandexUser.default_email || `${yandexUser.id}@yandex.ru`,
        emailVerified: true,
        yandexId: yandexUser.id,
        authProvider: 'yandex'
      });
      
      if (yandexUser.is_avatar_empty === false && yandexUser.default_avatar_id) {
        user.yandexAvatar = `https://avatars.yandex.net/get-yapic/${yandexUser.default_avatar_id}/islands-200`;
      }
      
      await user.save();
    }
    
    await user.updateLastLogin();
    
    const token = generateToken(user._id);
    setTokenCookie(res, token);
    
    const userResponse = {
      _id: user._id,
      lastName: user.lastName || '',
      firstName: user.firstName || '',
      middleName: user.middleName || '',
      fullName: user.fullName,
      shortName: user.shortName,
      email: user.email,
      role: user.role,
      postureSettings: user.postureSettings || { notificationsEnabled: true, calibrationDone: false },
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      authProvider: user.authProvider,
      yandexAvatar: user.yandexAvatar || null
    };
    
    const userDataEncoded = encodeURIComponent(JSON.stringify(userResponse));
    const redirectUrl = `${process.env.FRONTEND_URL}/yandex-callback?user=${userDataEncoded}`;
    console.log('Redirecting to frontend:', redirectUrl);
    
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Yandex callback critical error:', error);
    const errorMessage = encodeURIComponent(error.message || 'Неизвестная ошибка при авторизации');
    res.redirect(`${process.env.FRONTEND_URL}/login?error=${errorMessage}`);
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
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не авторизован'
      });
    }
    
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