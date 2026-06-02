import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailSender {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const configs = [
      {
        host: '77.88.21.57',
        port: 465,
        secure: true,
        auth: {
          user: 'banthill@yandex.ru',
          pass: 'mpbvscligzihgncr'
        },
        tls: {
          rejectUnauthorized: false,
          servername: 'smtp.yandex.ru'
        }
      },
      {
        host: 'smtp.yandex.ru',
        port: 465,
        secure: true,
        auth: {
          user: 'banthill@yandex.ru',
          pass: 'mpbvscligzihgncr'
        },
        tls: { rejectUnauthorized: false }
      }
    ];

    for (const config of configs) {
      try {
        this.transporter = nodemailer.createTransport(config);
        break;
      } catch (err) {
        continue;
      }
    }
  }

  async sendVerificationCodeEmail(email, code, firstName) {
    console.log(`\nVerification code for ${email}: ${code}\n`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: '"Posture Analyzer" <banthill@yandex.ru>',
          to: email,
          subject: 'Email verification code',
          html: `
            <h3>Приветствую ${firstName || 'user'}!</h3>
            <p>Твой код: <strong>${code}</strong></p>
            <p>Код действует 15 минут.</p>
          `,
          text: `Your verification code: ${code}\n\nExpires in 15 minutes.`
        });
        console.log(`Email sent to ${email}\n`);
      } catch (err) {
        console.log(`Failed to send email, but code is logged above\n`);
      }
    }

    return true;
  }

  async sendWelcomeEmail(email, firstName) {
    if (!this.transporter) return true;

    try {
      await this.transporter.sendMail({
        from: '"Posture Analyzer" <banthill@yandex.ru>',
        to: email,
        subject: 'Добро пожаловать на Posture Analyzer!',
        html: `<h3>Здравствуйте ${firstName || 'user'}!</h3><p>Твой аккаунт активирован.</p>`,
        text: `Здравствуйте ${firstName || 'user'}! Твой аккаунт активирован.`
      });
    } catch (err) {

    }

    return true;
  }
}

const emailSender = new EmailSender();
export default emailSender;