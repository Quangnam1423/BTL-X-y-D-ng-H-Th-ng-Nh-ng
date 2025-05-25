const express = require('express');
const router = express.Router();
const {
  getLatestLpiData,
  getLast24Records,
  getAverages
} = require('../controllers/statController');

router.get('/latest', getLatestLpiData);
router.get('/averages', getAverages);
router.get('/history', getLast24Records);


module.exports = router;
