import express from 'express';
import cors from 'cors';
import smsRoutes from './routes/sms.js';
import {
  PORT,
  API_PATH,
  ORIGIN_URL,
  FROM_EMAIL,
  TO_EMAIL,
  SENDGRID_API_KEY,
} from './config/config.js';
import { Resolver } from 'dns/promises';
import errHandler from './middlewares/errHandler.js';
import logger from './helpers/logger.js';
import sgMail from '@sendgrid/mail';
import Socket from './socket.js';
import Modem from './helpers/modem.js';

try {
  sgMail.setApiKey(SENDGRID_API_KEY);

  const app = express();
  app.use(express.json());
  app.use(cors({ origin: ORIGIN_URL, methods: ['GET', 'POST'] }));
  app.use(API_PATH, smsRoutes);
  app.use(errHandler);

  const server = app.listen(PORT, () => logger.info(`SMS-API started on port ${PORT}`));

  await Modem.init();
  Socket.init(server);

  Modem.getInstance().on('onNewMessage', async ([message]) => {
    try {
      const { sender, message: msg } = message;

      await new Resolver().resolve('google.com');

      await sgMail.send({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: `You have a new message from ${sender ?? 'Unknown'}`,
        html: msg,
      });
    } catch (err) {
      logger.error(err);
      await Modem.sendSMS(FORWARD_NUMBER, message.message);
    }
  });

  Modem.getInstance().on('onNewIncomingCall', function () {
    try {
      this.hangupCall();
    } catch (err) {
      logger.error(err);
    }
  });
} catch (err) {
  logger.error(err);
}
