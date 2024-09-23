import {
  API_PATH,
  API_URL,
  SOCKET_NAMESPACE,
  JWT_SECRET,
  SENDGRID_API_KEY,
  FROM_EMAIL,
} from './config/config.js';
import logger from './helpers/logger.js';
import io from 'socket.io-client';
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';
import Modem from './helpers/modem.js';

try {
  logger.info(`SMS service started! - Running Node.js version ${process.version}`);

  const receivers = ['marcello.alfaro1@gmail.com'];

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
    const signalStrength = await Modem.getSignalStrength();

    logger.info(`Signal strength: ${signalStrength}`);

    socket.emit('signal-strength', signalStrength);

    setTimeout(signalStrengthUpdater, 5000);
  })();

  socket.on('send-message', async ({ number, message, flash }, res) => {
    try {
      const result = await Modem.sendSMS(number.replace(/\s+/g, ''), message, flash);

      res({ ok: true, message: result.data.response });
    } catch (err) {
      logger.error(err);
      res({ ok: false, message: err.data.response });
    }
  });

  Modem.getInstance().on('onNewMessage', async ([message]) => {
    try {
      const { sender, message: msg } = message;
      socket.emit('new-message', message);

      await Promise.all(
        receivers.map(async (to) =>
          sgMail.send({
            to,
            from: FROM_EMAIL,
            subject: `You have a new message from message ${sender ?? 'Unknown'}`,
            html: msg,
          })
        )
      );
    } catch (err) {
      logger.error(err);
    }
  });

  Modem.getInstance().on('onNewIncomingCall', async function ({ data: { number } }) {
    try {
      this.hangupCall();
      await Modem.sendSMS(
        number,
        `Hola, lo siento, no puedo contestar debido a que no me encuentro en el país. Por favor déjame un mensaje SMS o WhatsApp con el motivo de tu llamada.`
      );
    } catch (err) {
      logger.error(err);
    }
  });

  socket.on('connect_error', (err) => logger.error(`Connection error due to ${err.message}`));
} catch (err) {
  logger.error(err);
}

/* 

[
  {
    sender: 'CLARO',
    message: 'Apreciado Cliente le informamos que el registro del IMEI 866192034280196 fue Exitoso',
    index: 4,
    msgStatus: 4,
    dateTimeSent: 2024-09-02T18:23:58.000Z,
    header: {
      encoding: '7bit',
      smsc: '573103804459',
      smscType: 'INTERNATIONAL',
      smscPlan: 'ISDN'
    }
  }
]

*/
