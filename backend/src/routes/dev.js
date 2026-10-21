const express = require('express');
const { reset } = require('../data/store');
const router = express.Router();

router.post('/reset', (req, res) => {
  reset();
  res.json({ message: 'Datastore reset to seed data' });
});

module.exports = router;
