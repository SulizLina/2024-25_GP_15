// This file contains the code to send an email using the SendGrid API.
export function sendEmail({ email, subject, message }) {

    if (!email || !subject || !message) {
      throw new Error('Email, subject, and message are required');
    }
  
     fetch('http://localhost:8080/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        subject,
        message
      }),
     }).then(res => res.json())
      .then((response) => { 
        return response;
      })
      .catch((error) => {
        console.error('Error sending email:', error);
        return { success: false };
    });
  
    return { success: true };
  
    // console.log( process.env.REACT_APP_SENDGRID_API_KEY , "API KEY")
    // fetch("https://api.sendgrid.com/v3/mail/send",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       "Authorization": `Bearer ${process.env.REACT_APP_SENDGRID_API_KEY}`,
    //     },
    //     mode: 'no-cors', 
    //     body: JSON.stringify({
    //       personalizations: [
    //         {
    //           to: [
    //             {
    //               email: email,
    //             },
    //           ],
    //           subject: subject,
    //         },
    //       ],
    //       from: {
    //         email: process.env.REACT_APP_SENDGRID_FROM_EMAIL,
    //       },
    //       content: [
    //         {
    //           type: "text/plain",
    //           value: message,
    //         },
    //       ],
    //     }),
    //   }
    // ).then(res => res.json())
    //   .then((some) => {
    //     console.log('Email sent:', some);
    //     return { success: true };
    //   })
    //   .catch((error) => {
    //     console.error('Error sending email:', error);
    //     return { success: false };
    // });
  }
  