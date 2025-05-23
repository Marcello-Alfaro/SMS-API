import express from 'express';
import smsController from '../controllers/sms.js';
const router = express.Router();

router.post('/sms/send-message', smsController.postSendSMS);

export default router;
