const twilio = require('twilio');

let client;

const getClient = () => {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
};

const sendVerification = async (phone) => {
  await getClient().verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to: phone, channel: 'sms' });
};

const checkVerification = async (phone, code) => {
  const result = await getClient().verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to: phone, code });
  return result.status === 'approved';
};

module.exports = { sendVerification, checkVerification };
