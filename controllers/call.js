const request = require('request');

const { COMPANY_ID, SECRET_TOKEN, USER_ID, PUBLIC_IVR_ID, X_API_KEY } = process.env;


const handleCall = async (req, res) => {

    const { number } = req.body;

    if (!number) {
        return res.status(400).json({ error: "Number is required" });
    }

    const body = {
        "company_id": COMPANY_ID,
        "secret_token": SECRET_TOKEN,
        "type": "1", //1 for peer to peer
        "number": number,
        "public_ivr_id": PUBLIC_IVR_ID,
        "user_id": USER_ID
    }




    var options = {
        'method': 'POST',
        'url': 'https://obd-api.myoperator.co/obd-api-v1',
        'headers': {
            'x-api-key': X_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        res.status(200).json({ message: "Call initiated successfully" });
    });
}

module.exports = { handleCall };