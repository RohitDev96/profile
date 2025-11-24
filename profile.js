// profile.js
// MindMetrics Profile + Prediction API (Node.js + MongoDB)

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "25mb" }));

// ------------- CONFIG -------------
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://rohit127634_db_user:9y23ssKikk6H0CCO@cluster0.7koxajh.mongodb.net/?retryWrites=true&w=majority";

const DB_NAME = "MindMatrics";
const USERS_COLLECTION = "users";
const PREDICTIONS_COLLECTION = "predictions";
// ----------------------------------

// Create MongoDB client (IMPORTANT)
const client = new MongoClient(MONGO_URI);

let db, usersCollection, predictionsCollection;

// ---------------- DB INIT ----------------
async function initDb() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    db = client.db(DB_NAME);

    usersCollection = db.collection(USERS_COLLECTION);

    // Check if predictions collection exists
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const names = collections.map((c) => c.name);

    if (!names.includes(PREDICTIONS_COLLECTION)) {
      await db.createCollection(PREDICTIONS_COLLECTION);
      console.log("📁 Created predictions collection");
    }

    predictionsCollection = db.collection(PREDICTIONS_COLLECTION);

    // Ensure each user gets only one prediction per day
    await predictionsCollection.createIndex(
      { email: 1, date: 1 },
      { unique: true }
    );

    console.log("🔐 Index ensured: predictions(email + date)");

  } catch (err) {
    console.error("❌ DB Init Error:", err);
    process.exit(1);
  }
}

initDb();

/* -------------------------
   PROFILE API
   ------------------------- */

app.get("/get-profile-by-email/:email", async (req, res) => {
  const email = req.params.email;
  if (!email) return res.json({ status: "error", error: "Email missing" });

  try {
    const user = await usersCollection.findOne({ email });
    if (!user) return res.json({ status: "empty" });

    res.json({ status: "success", profile: user });

  } catch (err) {
    console.error("❌ Query Error:", err);
    res.json({ status: "error", error: err.message });
  }
});

app.post("/save-profile-by-email", async (req, res) => {
  const { email, fullName, phone, bio, dob, age, gender, profileImage } = req.body;

  if (!email) return res.json({ status: "error", error: "Email required" });

  try {
    const ageNumber = age ? Number(age) : null;

    const data = {
      email,
      fullName: fullName || null,
      phone: phone || null,
      bio: bio || null,
      dob: dob || null,
      age: Number.isFinite(ageNumber) ? ageNumber : null,
      gender: gender || null,
      profileImage: profileImage || null,
      updatedAt: new Date(),
    };

    await usersCollection.updateOne(
      { email },
      { $set: data },
      { upsert: true }
    );

    console.log("✅ Profile saved:", email);
    res.json({ status: "success", email });

  } catch (err) {
    console.error("❌ Save Error:", err);
    res.json({ status: "error", error: err.message });
  }
});

/* -------------------------
   PREDICTION API
   ------------------------- */

app.post("/savePrediction", async (req, res) => {
  try {
    const { email, prediction, inputs } = req.body;

    const timestampIncoming = req.body.timestamp
      ? new Date(req.body.timestamp)
      : new Date();

    const dateStr =
      req.body.date || timestampIncoming.toISOString().split("T")[0];

    if (!email)
      return res.status(400).json({ status: "error", error: "Email required" });

    // Fetch user details (name, age)
    const user = await usersCollection.findOne({ email });

    const name = user?.fullName || email.split("@")[0];
    const age = user?.age ?? null;

    const doc = {
      email,
      name,
      age,
      prediction: prediction || {},
      inputs: inputs || {},
      timestamp: timestampIncoming,
      date: dateStr,
      updatedAt: new Date(),
    };

    // Upsert (one prediction per day)
    const filter = { email, date: dateStr };
    const update = {
      $set: doc,
      $setOnInsert: { createdAt: new Date() },
    };

    const result = await predictionsCollection.updateOne(filter, update, {
      upsert: true,
    });

    console.log(`✅ Prediction saved for ${email} on ${dateStr}`);

    res.json({
      status: "success",
      email,
      date: dateStr,
      updated: result.modifiedCount,
      created: result.upsertedCount,
    });

  } catch (err) {
    console.error("❌ Prediction Save Error:", err);
    res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/get-predictions/:email", async (req, res) => {
  const email = req.params.email;
  if (!email) return res.json({ status: "error", error: "Email missing" });

  try {
    const items = await predictionsCollection
      .find({ email })
      .sort({ date: -1 })
      .toArray();

    res.json({ status: "success", predictions: items });

  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.json({ status: "error", error: err.message });
  }
});

/* -------------------------
   ROOT ROUTE
   ------------------------- */

app.get("/", (req, res) => {
  res.send("✅ MindMetrics Profile & Prediction API Running");
});

/* -------------------------
   START SERVER
   ------------------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
