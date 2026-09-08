import { Router } from 'express';
import { getActiveUniversities, setUniversityLocation, findNearestUniversity } from '../controllers/university.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getActiveUniversities);
router.post('/nearest', findNearestUniversity);
router.post('/location', authenticate, setUniversityLocation);

export default router;
