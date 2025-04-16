require("dotenv").config();
const express = require("express");
const oracledb = require("oracledb");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(bodyParser.json());
app.use(cors());

async function connectDB() {
    try {
        return await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectionString: process.env.DB_CONNECTION_STRING,
        });
    } catch (err) {
        console.error("Database connection error:", err);
        throw err;
    }
}

// 🔹 SIGNUP API
app.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    try {
        const db = await connectDB();
        const checkUser = await db.execute(
            "SELECT username FROM SYSTEM.USERS WHERE username = :username",
            { username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (checkUser.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
            "INSERT INTO SYSTEM.USERS (username, password) VALUES (:username, :password)",
            { username, password: hashedPassword },
            { autoCommit: true }
        );

        res.json({ message: "User registered successfully!" });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ message: "Error registering user", error: err.message });
    }
});

// 🔹 LOGIN API
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const db = await connectDB();
        const result = await db.execute(
            "SELECT username, password AS hashed_password FROM SYSTEM.USERS WHERE username = :username",
            { username },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = result.rows[0];
        const hashedPassword = user.HASHED_PASSWORD;

        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.json({ message: "Login successful!" });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Error logging in", error: err.message });
    }
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
