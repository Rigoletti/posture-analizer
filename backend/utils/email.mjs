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
            <h3>Hello ${firstName || 'user'}!</h3>
            <p>Your verification code: <strong>${code}</strong></p>
            <p>Code expires in 15 minutes.</p>
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
        subject: 'Welcome to Posture Analyzer!',
        html: `<h3>Welcome ${firstName || 'user'}!</h3><p>Your account has been activated.</p>`,
        text: `Welcome ${firstName || 'user'}! Your account has been activated.`
      });
    } catch (err) {
      // silent
    }

    return true;
  }
}

const emailSender = new EmailSender();
export default emailSender;