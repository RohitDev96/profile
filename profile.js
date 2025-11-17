// ================================================
//   MINDMETRICS PROFILE BACKEND (Node.js + MongoDB)
// ================================================

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors({ origin: "*" }));  // Allow all origins
app.use(express.json({ limit: "25mb" })); // Allow large base64 images

// ------------------------------------------------
// MONGODB CONNECTION
// ------------------------------------------------
const uri = "mongodb+srv://rohit127634_db_user:9y23ssKikk6H0CCO@cluster0.7koxajh.mongodb.net/?retryWrites=true&w=majority";

const dbName = "MindMatrics";   // <-- DB NAME
const collectionName = "users"; // <-- COLLECTION

const client = new MongoClient(uri);
let usersCollection;

// ------------------------------------------------
// DATABASE INIT + SCHEMA VALIDATION
// ------------------------------------------------
async function connectDB() {
    try {
        await client.connect();
        console.log("✅ MongoDB Connected!");

        const db = client.db(dbName);

        // Apply schema validator
        await db.command({
            collMod: collectionName,
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    required: ["email"],
                    properties: {
                        email: { bsonType: "string" },

                        fullName: { bsonType: ["string", "null"] },
                        phone: { bsonType: ["string", "null"] },
                        bio: { bsonType: ["string", "null"] },

                        dob: { bsonType: ["string", "null"] },
                        age: { bsonType: ["int", "null"] },

                        gender: { bsonType: ["string", "null"] },

                        profileImage: { bsonType: ["string", "null"] }
                    }
                }
            },
            validationLevel: "moderate"
        }).catch(async (err) => {
            if (err.codeName === "NamespaceNotFound") {
                // Create collection if not exists
                await db.createCollection(collectionName, {
                    validator: {
                        $jsonSchema: {
                            bsonType: "object",
                            required: ["email"],
                            properties: {
                                email: { bsonType: "string" },
                                fullName: { bsonType: ["string", "null"] },
                                phone: { bsonType: ["string", "null"] },
                                bio: { bsonType: ["string", "null"] },
                                dob: { bsonType: ["string", "null"] },
                                age: { bsonType: ["int", "null"] },
                                gender: { bsonType: ["string", "null"] },
                                profileImage: { bsonType: ["string", "null"] }
                            }
                        }
                    }
                });
                console.log("📁 New users collection created!");
            } else {
                console.error("⚠️ Schema update error:", err);
            }
        });

        usersCollection = db.collection(collectionName);
        console.log("📂 Connected to users collection");

    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
    }
}
connectDB();

// ------------------------------------------------
// 1️⃣ GET PROFILE BY EMAIL
// ------------------------------------------------
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

// ------------------------------------------------
// 2️⃣ SAVE / UPDATE PROFILE
// ------------------------------------------------
app.post("/save-profile-by-email", async (req, res) => {
    const { email, fullName, phone, bio, dob, age, gender, profileImage } = req.body;

    if (!email) return res.json({ status: "error", error: "Email is required" });

    try {
        const ageNumber = age ? Number(age) : null;

        const updateData = {
            email,
            fullName: fullName || null,
            phone: phone || null,
            bio: bio || null,
            dob: dob || null,
            age: ageNumber,
            gender: gender || null,
            profileImage: profileImage || null
        };

        await usersCollection.updateOne(
            { email },
            { $set: updateData },
            { upsert: true }
        );

        console.log("✅ Profile saved for:", email);
        res.json({ status: "success", email });

    } catch (err) {
        console.error("❌ Save Error:", err);
        res.json({ status: "error", error: err.message });
    }
});

// ------------------------------------------------
// DEFAULT ROUTE
// ------------------------------------------------
app.get("/", (req, res) => {
    res.send("✅ MindMetrics Profile API (MongoDB) is running...");
});

// ------------------------------------------------
// START SERVER
// ------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
