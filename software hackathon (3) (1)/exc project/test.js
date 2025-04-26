const oracledb = require("oracledb");

async function testDB() {
    try {
        const db = await oracledb.getConnection({
            user: "system",
            password: "PRATYAKSH",
            connectionString: "localhost:1521/XE"
        });
        console.log("Connected to Oracle DB!");
        await db.close();
    } catch (err) {
        console.error("Database connection error:", err.message);
    }
}

testDB();
