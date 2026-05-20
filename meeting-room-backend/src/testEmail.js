const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'akshat4ever1@gmail.com',
    pass: 'cupsxmzguvleolgf'
  }
});

transporter.sendMail({
  from: 'akshat4ever1@gmail.com',
  to: 'aksha4ever1@gmail.com',
  subject: 'RoomBook Test Email',
  text: 'Email is working!'
}, (err, info) => {
  if(err) console.log('ERROR:', err.message);
  else console.log('SUCCESS:', info.messageId);
});