import { Router } from 'express';
import authRoutes from './auth.routes';

/**
 * Main Router
 * Aggregates all API routes
 */
const router = Router();

// Mount routes
router.use('/auth', authRoutes);

// Future routes
// router.use('/universities', universityRoutes);
// router.use('/schools', schoolRoutes);
// router.use('/departments', departmentRoutes);
// router.use('/courses', courseRoutes);
// router.use('/exams', examRoutes);
// router.use('/questions', questionRoutes);
// router.use('/papers', paperRoutes);
// router.use('/evaluations', evaluationRoutes);
// router.use('/results', resultRoutes);
// router.use('/users', userRoutes);
// router.use('/audit', auditRoutes);

export default router;
