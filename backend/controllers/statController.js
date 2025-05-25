const pool = require('../config/mysql');

exports.getLatestLpiData = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r, g, b, c, lux, datetime, lpi 
       FROM sensor_lpi 
       ORDER BY datetime DESC 
       LIMIT 1`
    );
    res.status(200).json(rows[0] || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch latest LPI data' });
  }
};

exports.getLast24Records = async (req, res) => {
  try {
    const query = `
      SELECT * FROM sensor_lpi 
      ORDER BY datetime DESC 
      LIMIT 24
    `;

    const [rows] = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch latest 24 records' });
  }
};

exports.getAverages = async (req, res) => {
  try {
    const [monthly] = await pool.query(
      `SELECT 
         ROUND(AVG(lux), 2) AS avgLuxMonth, 
         ROUND(AVG(lpi), 2) AS avgLpiMonth 
       FROM sensor_lpi 
       WHERE MONTH(datetime) = MONTH(CURRENT_DATE()) 
         AND YEAR(datetime) = YEAR(CURRENT_DATE())`
    );

    const [yearly] = await pool.query(
      `SELECT 
         ROUND(AVG(lux), 2) AS avgLuxYear, 
         ROUND(AVG(lpi), 2) AS avgLpiYear 
       FROM sensor_lpi 
       WHERE YEAR(datetime) = YEAR(CURRENT_DATE())`
    );

    res.status(200).json({ ...monthly[0], ...yearly[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to calculate averages' });
  }
};

