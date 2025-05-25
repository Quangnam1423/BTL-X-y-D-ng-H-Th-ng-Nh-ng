const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');
const statRoutes = require('./routes/statRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const lpiRoutes = require('./routes/lpiRoutes');
const { fetchNewSensorDataAndSaveLPI } = require('./services/lpiService');

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

fetchNewSensorDataAndSaveLPI();
cron.schedule('*/30 * * * *', async () => {
  console.log('⏱️ Running LPI fetch job every 30 minutes');
  try {
    await fetchNewSensorDataAndSaveLPI();
    console.log('✅ LPI data updated successfully.');
  } catch (err) {
    console.error('❌ LPI fetch job failed:', err);
  }
});

// Routes
app.use('/api', sensorRoutes);
app.use('/api', lpiRoutes);
app.use('/api/stat', statRoutes);

// Start server
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {

  console.log(`🚀 Server running on port ${PORT}`);
});
