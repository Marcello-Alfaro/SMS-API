import Modem from '../helpers/modem.js';

export default {
  async postSendSMS(req, res, next) {
    try {
      const { message, number, flash } = req.body;
      const response = await Modem.sendSMS(number, message, flash);

      res.status(200).json({ message: response });
    } catch (err) {
      next(err);
    }
  },
};
