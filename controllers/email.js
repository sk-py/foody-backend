// // const sgMail = require("@sendgrid/mail");

// // sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// const sendEmail = async (req, res) => {
//     const { to, subject, body } = req.body;

//     const msg = {
//         to,
//         from: "shaikh56742@gmail.com",
//         subject,
//         text: body,
//         // html: `<strong>${body}</strong>`,
//     }
//     console.log(msg);

//     try {
//         await sgMail.send(msg);
//         res.status(200).json({ message: "Email sent successfully" });
//     } catch (error) {
//         res.status(500).json({ message: "Email not sent" });
//         console.log(error);
//     }
// }

// module.exports = { sendEmail };

const nodemailer = require("nodemailer");

const pass = process.env.APP_PASS;

let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "shaikh56742@gmail.com",
    pass: pass,
  },
});

// let mailDetails = {
//   from: "shaikh56742@gmail.com",
//   to: "shifakhan122004@gmail.com",
//   subject: "Test mail",
//   text: "Hello :)",
// };

// const send = mailTransporter.sendMail(mailDetails, function (err, data) {
//   if (err) {
//     console.log("Error Occurs");
//   } else {
//     console.log("Email sent successfully");
//   }
// });

const sendEmail = async (req, res) => {
  const { to, subject, body } = req.body;

  const msg = {
    to,
    from: "shaikh56742@gmail.com",
    subject,
    text: body,
    // html: `<strong>${body}</strong>`,
  };
  console.log(msg);

  try {
    const response = await mailTransporter.sendMail(
      msg,
      function (err, data) {
        if (err) {
          console.log("Error Occurs");
        } else {
          console.log("Email sent successfully");
          return data;
        }
      }
    );

    console.log(response);

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Email not sent" });
    console.log(error);
  }
};

module.exports = { sendEmail };
