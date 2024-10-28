const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Set up SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
app.use(bodyParser.json());
app.use(cors());

// Send Email Route
app.post('/send-email', (req, res) => {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
        return res.status(400).send({ error: 'Email, subject, and message are required' });
    }

    const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL, // Your verified SendGrid sender email
        subject: subject,
        text: message,
    };

    sgMail
        .send(msg)
        .then(() => {
            res.status(200).send({ success: true, message: 'Email sent' });
        })
        .catch((error) => {
            console.error('Error sending email:', error);
            res.status(500).send({ success: false, error: error.message });
        });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
