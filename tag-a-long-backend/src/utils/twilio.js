const twilio = require('twilio');

let client;

const getClient = () => {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
};

const sendOTP = async (phone, otp) => {
  await getClient().messages.create({
    body: `Your Tag-A-Long verification code is: ${otp}. It expires in 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
};

module.exports = { sendOTP };
