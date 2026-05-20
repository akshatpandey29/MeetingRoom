const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'plaxonic65@gmail.com',
    pass: 'hhdiuzxudwrgpyqt'
  }
});

transporter.sendMail({
  from: 'plaxonic65@gmail.com',
  to: 'plaxonic65@gmail.com',
  subject: 'Test Email',
  text: 'Email is working!'
}, (err, info) => {
  if(err) console.log('ERROR:', err.message);
  else console.log('SUCCESS:', info.messageId);
});