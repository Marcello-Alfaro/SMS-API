import {
  API_PATH,
  API_URL,
  SOCKET_NAMESPACE,
  JWT_SECRET,
  SENDGRID_API_KEY,
  FROM_EMAIL,
  TO_EMAIL,
  FORWARD_TO_NUMBER,
} from './config/config.js';
import { Resolver } from 'dns/promises';
import logger from './helpers/logger.js';
import io from 'socket.io-client';
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';
import Modem from './helpers/modem.js';

try {
  logger.info(`SMS service started! - Running Node.js version ${process.version}`);

  sgMail.setApiKey(SENDGRID_API_KEY);

  await Modem.init();

  const socket = new io(API_URL + SOCKET_NAMESPACE, {
    path: `${API_PATH}.io/`,
    auth: {
      token: jwt.sign(Modem.getNumber(), JWT_SECRET),
    },
  });

  logger.info('Establishing connection with main server...');

  socket.on('connect', () => logger.info('Connection with main server established!'));

  socket.on('disconnect', (reason) =>
    logger.warn(`Connection with main server lost due to ${reason}`)
  );

  (async function signalStrengthUpdater() {
    try {
      const signalStrength = await Modem.getSignalStrength();

      socket.emit('signal-strength', signalStrength);

      setTimeout(signalStrengthUpdater, 5000);
    } catch (err) {
      logger.error(err);
    }
  })();

  socket.on('send-message', async ({ number, message, flash }, res) => {
    try {
      const response = await Modem.sendSMS(number.replace(/\s+/g, ''), message, flash);

      res({ ok: true, message: response });
    } catch (err) {
      logger.error(err);
      res({ ok: false, message: err.message });
    }
  });

  Modem.getInstance().on('onNewMessage', async ([message]) => {
    try {
      const { sender, message: msg } = message;

      await new Resolver().resolve('google.com');

      socket.emit('new-message', message);

      await sgMail.send({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: `You have a new message from ${sender ?? 'Unknown'}`,
        html: msg,
      });
    } catch (err) {
      logger.error(err);
      Modem.sendSMS(FORWARD_TO_NUMBER, message.message);
    }
  });

  Modem.getInstance().on('onNewIncomingCall', function () {
    try {
      this.hangupCall();
    } catch (err) {
      logger.error(err);
    }
  });

  socket.on('connect_error', (err) => logger.error(`Connection error due to ${err.message}`));

  process
    .on('unhandledRejection', (reason) => logger.error(`Unhandled Promise Rejection ${reason}`))
    .on('uncaughtException', (err) => {
      logger.fatal(err);
      process.exit(1);
    });
} catch (err) {
  logger.error(err);
}
