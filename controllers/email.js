const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (req, res) => {
    const { to, subject, body } = req.body;

    const msg = {
        to,
        from: "shaikh56742@gmail.com",
        subject,
        text: body,
        // html: `<strong>${body}</strong>`,
    }
    console.log(msg);

    try {
        await sgMail.send(msg);
        res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        res.status(500).json({ message: "Email not sent" });
        console.log(error);
    }
}

module.exports = { sendEmail };
