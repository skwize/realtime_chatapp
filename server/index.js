const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoute = require("./routes/userRouter")



require("dotenv").config();
const app = express();

app.use(express.json());
app.use(cors());
app.use("/api/users",userRoute)

app.get('/', (req, res) => {
    res.send("Welcome to our chatAPIs")
});

const port = process.env.PORT || 3000;

app.listen(port, (err) => {
    if (err) throw err;
    console.log(`Server has running on: http://localhost:${port}`);
});

mongoose.connect(process.env.LOCAL_URI).then(() => {
    console.log("MongoDB is connected!")
}).catch((err)=>{
    console.error("MongoDB connection failed: "+err.message)
})