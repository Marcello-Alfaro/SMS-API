# EasySMS API

A simple API built with Node.js and Express.js that allows users to send and receive SMS messages from anywhere, ensuring continued access to their phone number while traveling or living abroad.

## Features

- Send and receive SMS messages using a **SIM800C module**.
- **Forward incoming SMS messages** to email or another phone number (in case of network issues).
- Easy-to-use API for seamless integration with any application.

## Technologies Used

- **Node.js**: For backend logic and API creation.
- **SIM800C module**: For sending and receiving SMS messages.
- **SendGrid**: For forwarding SMS messages to email.
- **serialport-gsm**: For serial communication between Node.js and the SIM800C module.

## Setup Instructions

### Prerequisites

- **Node.js v18+** .
- A **SIM800C module** connected to your device (e.g., Raspberry Pi).
- **SendGrid** account for email forwarding.

### Environment Variables

- `NODE_ENV`: (e.g., `development`)
- `PORT`: Port number to run the server (e.g., `3000`)
- `API_PATH`: Root path for API endpoints (e.g., `/api`)
- `ORIGIN_URL`: Frontend URL used for CORS validation (e.g., `http://localhost:1234`)
- `SENDGRID_API_KEY`: Your SendGrid API key (for email forwarding).
- `FROM_EMAIL`: Sender email address (for sendGrid)
- `FORWARD_NUMBER`: Optional, a phone number to forward SMS messages in case of network issues.
- `TO_EMAIL`: Email address to send SMS notifications.
- `SERIAL_PORT`: The serial port of the SIM800C module (e.g., `/dev/ttyUSB0`).

### API Endpoints

| Method | Route               | Description                                        |
| ------ | ------------------- | -------------------------------------------------- |
| `POST` | `/sms/send-message` | Sends an SMS message to the provided phone number. |

## POST /sms/send-message

# Request Body:

```json
{
  "number": "+1234567890",
  "message": "Your SMS message content here",
  "flash": true
}
```

# Response:

```json
{
  "status": 200,
  "message": "Message Successfully Sent"
}
```

### Installation

## How to Run

1. Clone the repository.
2. Install dependencies: `npm install`
3. Set up a .env file with the necessary environment variables.
4. Start the server: `npm run start:dev`

### Notes

- Ensure the SIM800C module is properly connected and configured before running the API.
- **Signal Loss**: The module may occasionally lose its signal (0dBm), causing brief interruptions when sending or receiving SMS. This is fixed once the signal is restored.

## Disclaimer

This project is intended solely for academic demonstration and personal portfolio purposes.

🔒 **Unauthorized use, redistribution, or commercial exploitation of any part of this codebase is strictly prohibited.**  
📩 If you wish to use any part of this project, you must obtain prior written permission from the author.

© 2025 Marcello Alfaro. All rights reserved.
