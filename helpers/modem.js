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
  static #number = '+573116029691';

  static async init() {
    try {
      return new Promise((res, rej) => {
        this.#modem.open(SERIAL_PORT, this.#options);

        this.#modem.on('open', () => {
          // Initialize modem
          this.#modem.initializeModem((data) => {
            if (!data) return rej(new ErrorObject('Failed to initialized the modem.'));
            logger.info('Modem initialized!');

            this.#isInitialized = true;
            this.#modem.executeCommand('AT+CMEE=2');
            res();
          });
        });
      });
    } catch (err) {
      throw err;
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

  static getNumber() {
    return this.#number;
  }

  static async getSignalStrength() {
    try {
      if (!this.#isInitialized)
        throw new ErrorObject('Failed to get signal strength, modem is not initialized.');

      return await new Promise((res) =>
        this.#modem.executeCommand('AT+CSQ', ({ data: { result } }) => res(result.trim()))
      );
    } catch (err) {
      throw err;
    }
  }

  static async sendSMS(number, message, flash = false) {
    try {
      if ((await this.getSignalStrength()) === '0,0')
        throw new ErrorObject('Cannot attempt to send SMS as the signal is too weak or absent.');

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
