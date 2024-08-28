const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const key = "foody_RN_EXPO_@2024";

const handleSignup = async (req, res) => {
  const { email, password, name, mobile } = req.body;

  if (!email || !password || !mobile || !name) {
    return res.status(400).json({ err: "Fields cannot be empty" });
  }

  const alreadyExist = await User.findOne({
    $or: [{ email: email }, { mobile: mobile }],
  });

    console.log("email:", email);
    console.log("mobile:", mobile);
    
    
  if (alreadyExist) {
    let errorMessage = "";
console.log("Alredyexists",alreadyExist);

    if (alreadyExist.email === email && alreadyExist.mobile == mobile) {
        errorMessage = "A user with this email and mobile number already exists";
      } else if (alreadyExist.email === email) {
        errorMessage = "A user with this email already exists";
      } else if (alreadyExist.mobile == mobile) {
        errorMessage = "A user with this mobile number already exists";
      }
    return res
      .status(409)
      .json({ err: errorMessage });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    email,
    name,
    mobile,
    password: hashedPassword,
  });

  let token = jwt.sign(
    {
      id: newUser._id,
      email: newUser.email,
    },
    key
  );

  return res.status(201).json({
    email: newUser.email,
    token,
    mobile: newUser.mobile,
    name: newUser.name,
    msg: "Registration successfull",
  });
};

const handlesignIn = async (req, res) => {
  const { email, password } = req.body;
  //   console.log(req.body);

  if (!email || !password) {
    return res.status(400).json({ err: "Fields cannot be empty" });
  }

  const doExists = await User.findOne({
    $or: [{ email: email }],
  });

  if (!doExists) {
    return res.status(404).json({ err: "Unregistered email" });
  }

  const Verified = await bcrypt.compare(password, doExists.password);

  if (!Verified) {
    return res.status(400).json({ err: "Incorrect password" });
  }

  if (Verified) {
    let token = jwt.sign({ id: doExists._id, email: doExists.email }, key);
    return res.status(200).json({
      email: doExists.email,
      token,
      mobile: doExists.mobile,
      name: doExists.name,
      msg: "Successfully signed in",
    });
  }

  return res
    .status(500)
    .json({ err: "An unexpected server error occurred please try again" });
};

module.exports = { handleSignup, handlesignIn };
