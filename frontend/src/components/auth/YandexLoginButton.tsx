import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { yandexAuthApi } from '../../api/yandexAuth';
import yandexIconUrl from '../../assets/img/icons/icon_yandex.svg';

interface YandexLoginButtonProps {
  mode?: 'login' | 'connect';
  fullWidth?: boolean;
}

const YandexLoginButton: React.FC<YandexLoginButtonProps> = ({ 
  mode = 'login', 
  fullWidth = true 
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await yandexAuthApi.redirectToYandex();
    } catch (error) {
      console.error('Yandex login error:', error);
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      onClick={handleClick}
      disabled={loading}
      fullWidth={fullWidth}
      startIcon={
        <img 
          src={yandexIconUrl} 
          alt="" 
          style={{ 
            width: 28, 
            height: 28,
            display: 'block'
          }} 
        />
      }
      sx={{
        color: '#333',
        borderColor: '#ddd',
        backgroundColor: '#fff',
        fontSize: '16px',
        fontWeight: 500,
        textTransform: 'none',
        borderRadius: '8px',
        padding: '10px 28px',
        minWidth: '160px',
        boxShadow: 'none',
        '&:hover': {
          borderColor: '#FC3F1D',
          backgroundColor: '#fff',
          boxShadow: 'none',
        },
        '& .MuiButton-startIcon': {
          marginRight: '10px',
        },
        '&.Mui-disabled': {
          backgroundColor: '#F2F2F2',
          color: '#999',
          borderColor: '#ddd',
        },
      }}
    >
      {loading ? 'Загрузка...' : (mode === 'login' ? 'Войти через Яндекс' : 'Подключить Яндекс')}
    </Button>
  );
};

export default YandexLoginButton;