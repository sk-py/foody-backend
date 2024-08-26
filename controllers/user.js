const User = require("../models/user");

const handleSignup = async (req,res) => {
    const { email, password } = req.body;    
    console.log(email,password);
    
    await User.create({
        email,
        password
    })

    return res.status(201).json({message:"New User created successfully"})
}

module.exports = {handleSignup}