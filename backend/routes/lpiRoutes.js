const express = require('express');
const router = express.Router();
const { fetchNewSensorDataAndSaveLPI } = require('../services/lpiService');
router.post('/compute-lpi', async (req, res) => {
    try {
        await fetchNewSensorDataAndSaveLPI();
        res.status(200).json({ message: 'LPI data computed and saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to compute and save LPI' });
    }
});

module.exports = router;
