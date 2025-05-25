require('dotenv').config(); // Luôn đứng đầu file

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const credentialPath = path.resolve(__dirname, '..', process.env.FIREBASE_CREDENTIAL || '');

console.log("🔥 Absolute Credential Path:", credentialPath);
console.log("🔥 File exists:", fs.existsSync(credentialPath));

if (!fs.existsSync(credentialPath)) {
    throw new Error("❌ Credential file not found!");
}

const serviceAccount = require(credentialPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();
module.exports = db;
