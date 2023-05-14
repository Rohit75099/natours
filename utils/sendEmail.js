const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name;
    this.url = url;
    this.from = `Rohit Nitanjan <${process.env.EMAIL_FROM}>`;
  }

  transporter() {
    if (process.env.NODE_ENV === 'prod') {
      return nodemailer.createTransport({
        // host: 'smtp-relay.sendinblue.com',
        // port: 587,
        service: 'Gmail',
        auth: {
          user: process.env.SENDINBLUE_USERNAME,
          pass: process.env.SENDINBLUE_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    const emailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    this.transporter()
      .sendMail(emailOptions)
      .then((res) => console.log('SUCCESS:', res))
      .catch((err) => console.log('ERROR:', err));
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome To Natours Family!!!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Reset Password | Link valid for 10 mins');
  }
};
