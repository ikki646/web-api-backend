require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON

// MongoDB connection URI from .env
const userName = process.env.USER_NAME;
const userPassword = process.env.USER_PASSWORD;
const clusterName = process.env.CLUSTER_NAME;
const dbName = process.env.DB_NAME;

const timeCollection = "StartTime";
const moneyCollection = "MoneyRaised";

const mongoConnectionString = `mongodb+srv://${userName}:${userPassword}@${clusterName}.w25bq.mongodb.net/?retryWrites=true&w=majority&appName=${clusterName}`;

// Route: /start
app.post('/start-time/set', async (req, res) => {
    let client;

    try {
        const { timestamp } = req.body;

        if (!timestamp) {
            return res.status(400).json({ error: "Timestamp is required in the body." });
        }

        // Ensure the provided timestamp is valid
        const newTimestamp = new Date(timestamp);
        if (isNaN(newTimestamp)) {
            return res.status(400).json({ error: "Invalid timestamp format." });
        }

        // Update the first record
        client = new MongoClient(mongoConnectionString);
        const db = client.db(dbName);
        const collection = db.collection(timeCollection);
        const result = await collection.updateOne(
            {}, // Empty filter to match the first record
            { $set: { timestamp: newTimestamp } }, // Update with provided timestamp
            { sort: { createdAt: 1 } } // Optional: Ensure deterministic selection
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "No document found to update." });
        }

        res.status(200).json({
            message: "Timestamp updated successfully",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Error in /setTime route:", error);
        res.status(500).json({ error: "An error occurred while updating the timestamp." });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

app.post('/start-time/add', async (req, res) => {
    let client;

    try {
        const { timestamp } = req.body;

        if (!timestamp) {
            return res.status(400).json({ error: "Timestamp is required in the body." });
        }

        // Ensure the provided timestamp is valid
        const addTimestamp = new Date(timestamp);
        if (isNaN(addTimestamp)) {
            return res.status(400).json({ error: "Invalid timestamp format." });
        }

        // Calculate the new timestamp by adding the provided value to the current datetime
        const currentTimestamp = new Date();
        const newTimestamp = new Date(currentTimestamp.getTime() + addTimestamp.getTime());

        // Update the first record
        client = new MongoClient(mongoConnectionString);
        const db = client.db(dbName);
        const collection = db.collection(timeCollection);
        const result = await collection.updateOne(
            {}, // Empty filter to match the first record
            { $set: { timestamp: newTimestamp } }, // Update with the calculated timestamp
            { sort: { createdAt: 1 } } // Optional: Ensure deterministic selection
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "No document found to update." });
        }

        res.status(200).json({
            message: "Timestamp updated successfully",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Error in /start-time/add route:", error);
        res.status(500).json({ error: "An error occurred while updating the timestamp." });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

app.get('/start-time', async (req, res) => {
    let client;

    try {
        client = new MongoClient(mongoConnectionString);
        await client.connect();

        const db = client.db(dbName);
        const collection = db.collection(timeCollection);

        // Retrieve the single DateTime value
        const result = await collection.findOne({}, { projection: { _id: 0, timestamp: 1 } });

        if (result && result.timestamp) {
            res.json(result);
        } else {
            res.status(404).json({ error: 'DateTime value not found' });
        }
    } catch (error) {
        console.error('Error fetching DateTime:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

app.post('/money-raised/set', async (req, res) => {
    let client;

    try {
        const { value } = req.body;

        // Validate the input
        if (typeof value !== 'number') {
            return res.status(400).json({ error: "A numeric 'value' is required in the body." });
        }

        // Connect to the database
        client = new MongoClient(mongoConnectionString);
        const db = client.db(dbName);
        const collection = db.collection(moneyCollection);

        // Set the "money" field to the provided value
        const result = await collection.updateOne(
            {}, // Empty filter to match the first record
            { $set: { money: value } }, // Set the "money" field to the provided value
            { sort: { createdAt: 1 } } // Optional: Ensure deterministic selection
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "No document found to update." });
        }

        res.status(200).json({
            message: "Money value set successfully",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Error in /money/set route:", error);
        res.status(500).json({ error: "An error occurred while setting the money value." });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

app.post('/money-raised/add', async (req, res) => {
    let client;

    try {
        let { value } = req.body;
        value = Number(value);

        if (isNaN(value)) {
            return res.status(400).json({ error: "A numeric 'value' is required in the body." });
        }

        // Connect to the database
        client = new MongoClient(mongoConnectionString);
        const db = client.db(dbName);
        const collection = db.collection(moneyCollection);

        // Add the provided value to the existing "money" field
        const result = await collection.updateOne(
            {}, // Empty filter to match the first record
            { $inc: { money: value } }, // Increment the "money" field by the provided value
            { sort: { createdAt: 1 } } // Optional: Ensure deterministic selection
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "No document found to update." });
        }

        res.status(200).json({
            message: "Money value updated successfully",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Error in /money/add route:", error);
        res.status(500).json({ error: "An error occurred while updating the money value." });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

app.get('/money-raised', async (req, res) => {
    let client;

    try {
        // Connect to the database
        client = new MongoClient(mongoConnectionString);
        const db = client.db(dbName);
        const collection = db.collection(moneyCollection);

        // Find the first document and retrieve the "money" field
        const result = await collection.findOne({}, { projection: { _id: 0, money: 1 } });

        if (!result || result.money === undefined) {
            return res.status(404).json({ message: "Money value not found." });
        }

        res.status(200).json({ money: result.money });
    } catch (error) {
        console.error("Error in /money route:", error);
        res.status(500).json({ error: "An error occurred while retrieving the money value." });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});