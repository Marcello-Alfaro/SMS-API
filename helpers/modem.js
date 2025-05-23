import { SERIAL_PORT } from '../config/config.js';
import SerialPortGSM from 'serialport-gsm';
import ErrorObject from './errorObject.js';
import logger from './logger.js';

export default class Modem {
  static #modem = SerialPortGSM.Modem();
  static #options = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    rtscts: false,
    xon: false,
    xoff: false,
    xany: false,
    autoDeleteOnReceive: true,
    enableConcatenation: true,
    incomingCallIndication: true,
    incomingSMSIndication: true,
    pin: '',
    customInitCommand: 'AT+IPR=115200',
    cnmiCommand: 'AT+CNMI=2,1,0,2,1',
    logger: console,
  };
  static #isInitialized = false;

  static async init() {
    try {
      await new Promise((res, rej) => {
        this.#modem.open(
          SERIAL_PORT,
          this.#options,
          (err) => err && rej(new ErrorObject(err.message))
        );

        this.#modem.on('open', () => {
          this.#modem.initializeModem(({ status, data }) => {
            if (status !== 'success') return rej(new ErrorObject(data));

            this.#isInitialized = true;
            this.#modem.executeCommand('AT+CMEE=2');
            this.#modem.executeCommand('AT+CSCS="GSM"');

            this.emptySimInbox();

            res(logger.info(data));
          });
        });
      });
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
  }

  static getInstance() {
    try {
      if (!this.#isInitialized)
        throw new ErrorObject("Failed cannot get modem instance as it's not initialized.");

      return this.#modem;
    } catch (err) {
      throw err;
    }
  }

  static getSignalStrength() {
    try {
      if (!this.#isInitialized)
        throw new ErrorObject('Failed to get signal strength, modem is not initialized.');

      return new Promise((res) =>
        this.#modem.executeCommand('AT+CSQ', ({ data: { result } }) => res(result.trim()))
      );
    } catch (err) {
      throw err;
    }
  }

  static emptySimInbox() {
    this.#modem.getSimInbox(async ({ data }) => {
      try {
        if (data.length === 0) return;
        this.#modem.deleteAllSimMessages((result) => logger.info(result));

        await new Promise((res) => setTimeout(res, 3600000));
        this.emptySimInbox();
      } catch (err) {
        logger.error(err);
      }
    });
  }

  static async sendSMS(number, message, flash = false) {
    try {
      if ((await this.getSignalStrength()) === '0,0')
        throw new ErrorObject(
          'Cannot attempt to send SMS as the signal is too weak or absent; try again later.',
          503
        );

      let execCount = 0;
      return new Promise((res, rej) =>
        this.#modem.sendSMS(number, message, flash, (result) => {
          execCount++;
          if (execCount !== 2) return;
          if (result.status === 'success') return res(result.data.response);
          if (result.status === 'fail') return rej(new ErrorObject(result.data.response));
        })
      );
    } catch (err) {
      throw err;
    }
  }
}
