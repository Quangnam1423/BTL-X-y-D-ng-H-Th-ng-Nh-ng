const db = require('../config/firebase');

console.log('GET /sensor hit');

exports.sendSensorData = async (req, res) => {
    try {
        const { r, g, b, c, lux, datetime } = req.body;
        const ref = db.ref('sensorData');
        const newRef = ref.push(); // auto ID
        await newRef.set({ r, g, b, c, lux, datetime });

        res.status(200).json({ message: 'Data saved to Firebase' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to send data' });
    }
};
exports.getSensorData = async (req, res) => {
    try {
        const ref = db.ref('sensorData');
        const snapshot = await ref.once('value');
        const data = snapshot.val();
        res.status(200).json(data || {});
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
};