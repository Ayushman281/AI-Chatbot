import express from 'express';
import queryRouter from './query-router.js';
// import other routers as needed

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ message: 'API is working' });
});

// Mount the query router at /query
router.use('/query', queryRouter);

export default router;
