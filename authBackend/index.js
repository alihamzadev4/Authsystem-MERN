const dotenv = require("dotenv"); //load env variables
dotenv.config(); //config() is a method to load env
const bodyParser = require("body-parser"); // middleware to parse the request data based on content type either its json or url encoded
const express = require("express");
var mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // generate salt, which will combines with password and create hashed password
const jwt = require("jsonwebtoken"); //middleware to give access to routes only those users who has authenticated
const cors = require("cors");
const User = require("./Models/SignupData.js");
const app = express();
app.use(bodyParser.json());
app.use(cors());
const port = process.env.PORT || 3001;
const mongoDB = process.env.MONGOURL;

mongoose
  .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("db connected successfully");
    app.listen(port, () => {
      console.log(`Server listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.post("/api/users", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      first_name,
      last_name,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const accessToken = jwt.sign(
      { email: user.email },
      process.env.ACCESS_TOKEN_SECRET
    );
    res.status(200).json({ accessToken, message: "Login successful" });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
