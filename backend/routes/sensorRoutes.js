const express = require('express');
const router = express.Router();
const { sendSensorData, getSensorData } = require('../controllers/sensorController');

console.log('Sensor routes loaded');
router.post('/sensor', sendSensorData);

router.get('/sensor', getSensorData);
module.exports = router;
