const UserModel = require("../models/UserModel");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const createToken = (_id) => {
    const jwtkey = process.env.JWT_SECRET_KEY;

    return jwt.sign({_id}, jwtkey, {expiresIn: "3d"});
}

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        let user = await UserModel.findOne({email});

        if (user) return res.status(400).json("User with the given email already exist...");

        if (!name || !email || !password) return res.status(400).json("All fields are required!");

        if (!validator.isEmail(email)) return res.status(400).json("Email is invalid");

        if (!validator.isStrongPassword(password)) return res.status(400).json("Password must be a strong!");


        

        user = new UserModel({name, email, password});
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();

        const token = createToken(user._id);

        res.status(200).json({_id: user._id, name, email, token});
    }catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await UserModel.findOne({ email })

        if(!user) {
            return res.status(400).json("Invalid Email or password");
        }

        const isValidPassword = await bcrypt.compare(password, user.password)

        if(!isValidPassword){
            return res.status(400).json("Invalid Email or password")
        }

        const token = createToken(user._id);

        res.status(200).json({_id: user._id, name:user.name, email, token});

    }catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

const findUser = async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await UserModel.findById(userId);
        if(!user) return res.status(400).json("User does not exist")
        res.status(200).json(user)
    }catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};

const getUsers = async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await UserModel.find();
        if(!user) return res.status(400).json("Users does not exist")
        res.status(200).json(user)
    }catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
};


module.exports = {registerUser, loginUser, findUser, getUsers}