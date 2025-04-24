import { API_PATH, ORIGIN_URL } from './config/config.js';
import { WebSocketServer } from 'ws';
import logger from './helpers/logger.js';
import Modem from './helpers/modem.js';

export default class Socket {
  static #decoder = new TextDecoder('utf-8');
  static #webSocketServer = new WebSocketServer({ noServer: true });

  static init(server) {
    server.on('upgrade', async (req, socket, head) => {
      try {
        if (req.headers.origin !== ORIGIN_URL)
          throw new Error(`Blocked connection from unauthorized domain (${req.headers.origin}).`);

        if (req.url === `${API_PATH}.ws/clients`) {
          this.#webSocketServer.handleUpgrade(req, socket, head, async (ws) => {
            const ip = req.headers['x-forwarded-for'];

            ws.keepAlive = function () {
              if (this.readyState !== WebSocket.OPEN) return;

              this.isAlive = false;
              this.ping();
              setTimeout(() => (!this.isAlive ? this.terminate() : this.keepAlive()), 15000);
            };

            ws.signalStrengthUpdater = async function () {
              if (ws.readyState !== ws.OPEN) return;

              const signalStrength = await Modem.getSignalStrength();

              ws.send(JSON.stringify({ action: 'sim-signal-quality', signalStrength }));

              await new Promise((res) => setTimeout(res, 5000));
              this.signalStrengthUpdater();
            };

            ws.keepAlive();

            ws.on('pong', () => (ws.isAlive = true));

            ws.on('message', async (message) => {
              const data = this.#decodeJSON(message);
              const { action } = data;

              if (action === 'send-message') {
                try {
                  const { number, message, flash } = data;
                  const response = await Modem.sendSMS(number.replace(/\s+/g, ''), message, flash);

                  res({ ok: true, message: response });
                } catch (err) {
                  logger.error(err);
                  res({ ok: false, message: err.message });
                }
              }
            });

            ws.on('close', (code) => {
              logger.warn(`WebSocket connection with client ${ip} was lost due to ${code}.`);
            });

            ws.on('error', (err) => {
              logger.error(`WebSocket connection with client ${ip} encounter an error ${err}.`);
              ws.terminate();
            });

            logger.info(`WebSocket connection with client ${ip} established.`);

            await ws.signalStrengthUpdater();
          });
        } else {
          socket.destroy();
        }
      } catch (err) {
        logger.error(err);
        socket.destroy();
      }
    });
  }

  static #decodeJSON(message) {
    try {
      return JSON.parse(this.#decoder.decode(message));
    } catch (err) {
      throw err;
    }
  }
}
