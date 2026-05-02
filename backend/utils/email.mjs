import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailSender {
  constructor() {
    console.log('📧 Initializing email sender...');
    console.log('📧 Email user:', process.env.EMAIL_USER ? 'Set' : 'Not set');
    console.log('📧 Frontend URL:', process.env.FRONTEND_URL);
    
    this.transporter = nodemailer.createTransport({
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Тестируем соединение в фоне
    this.testConnection();
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully!');
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      console.log('\n⚠️ Для решения проблемы:');
      console.log('1. Войдите в Yandex почту');
      console.log('2. Перейдите в Настройки → Почтовые программы');
      console.log('3. Включите "С сервера imap.yandex.ru по протоколу IMAP"');
      console.log('4. Выберите "С паролем приложения"');
      console.log('5. Сгенерируйте и используйте пароль приложения в .env');
    }
  }

  async sendVerificationCodeEmail(email, code, firstName) {
    console.log(`📧 Sending verification code to ${email}`);
    console.log(`🔢 Verification code: ${code}`);
    
    const mailOptions = {
      from: `"Posture Analyzer" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Код подтверждения email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); 
                     padding: 30px; border-radius: 10px 10px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Код подтверждения</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333; margin-top: 0;">Здравствуйте, ${firstName}!</h2>
            <p>Спасибо за регистрацию в системе мониторинга осанки Posture Analyzer.</p>
            <p>Для завершения регистрации введите следующий код подтверждения:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #1e293b; color: white; 
                          padding: 20px 40px; border-radius: 10px; font-size: 32px; 
                          font-weight: bold; letter-spacing: 10px; font-family: monospace;">
                ${code}
              </div>
            </div>
            
            <p style="text-align: center; font-size: 18px; font-weight: bold; color: #3b82f6;">
              Код действителен 15 минут
            </p>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #0369a1; font-size: 14px;">
                <strong>Важно:</strong> Не передавайте этот код никому. Если вы не запрашивали подтверждение email, проигнорируйте это письмо.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
              <p style="margin: 5px 0; font-size: 14px;">
                Если вы не регистрировались в нашей системе, пожалуйста, проигнорируйте это письмо.
              </p>
              <p style="margin: 5px 0; font-size: 12px;">
                Это письмо отправлено автоматически, пожалуйста, не отвечайте на него.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Posture Analyzer. Все права защищены.</p>
          </div>
        </div>
      `,
      text: `Здравствуйте, ${firstName}!\n\nСпасибо за регистрацию в системе мониторинга осанки Posture Analyzer.\n\nВаш код подтверждения: ${code}\n\nКод действителен 15 минут.\n\nЕсли вы не регистрировались в нашей системе, пожалуйста, проигнорируйте это письмо.`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification code email sent successfully to ${email}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending verification code email to ${email}:`, error.message);
      return false;
    }
  }

  async sendWelcomeEmail(email, firstName) {
    console.log(`📧 Sending welcome email to ${email}`);
    
    const mailOptions = {
      from: `"Posture Analyzer" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Добро пожаловать в Posture Analyzer!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); 
                     padding: 30px; border-radius: 10px 10px 0 0; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Аккаунт активирован!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333; margin-top: 0;">Поздравляем, ${firstName}!</h2>
            <p>Ваш аккаунт в Posture Analyzer успешно активирован.</p>
            
            <p>Теперь вы можете:</p>
            <ul style="color: #555; line-height: 1.6;">
              <li>📊 <strong>Анализировать осанку</strong> в реальном времени</li>
              <li>💪 <strong>Использовать библиотеку упражнений</strong> для улучшения осанки</li>
              <li>📈 <strong>Отслеживать статистику</strong> и прогресс</li>
              <li>🎯 <strong>Получать персонализированные рекомендации</strong></li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); 
                        color: white; text-decoration: none; padding: 14px 28px; 
                        border-radius: 8px; font-weight: bold; font-size: 16px;">
                Начать использование
              </a>
            </div>
          </div>
        </div>
      `,
      text: `Поздравляем, ${firstName}!\n\nВаш аккаунт в Posture Analyzer успешно активирован.\n\nТеперь вы можете:\n- Анализировать осанку в реальном времени\n- Использовать библиотеку упражнений\n- Отслеживать статистику и прогресс\n- Получать персонализированные рекомендации\n\nНачать использование: ${process.env.FRONTEND_URL}\n\nС уважением,\nКоманда Posture Analyzer`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent successfully to ${email}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error sending welcome email to ${email}:`, error.message);
      return false;
    }
  }
}

const emailSender = new EmailSender();
export default emailSender;