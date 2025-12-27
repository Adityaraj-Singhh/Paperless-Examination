import { Router } from 'express';
import authRoutes from './auth.routes';
import universityRoutes from './university.routes';
import userRoutes from './user.routes';
import schoolRoutes from './school.routes';
import departmentRoutes from './department.routes';
import programmeRoutes from './programme.routes';
import courseRoutes from './course.routes';

/**
 * Main Router
 * Aggregates all API routes
 */
const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/universities', universityRoutes);
router.use('/users', userRoutes);
router.use('/schools', schoolRoutes);
router.use('/departments', departmentRoutes);
router.use('/programmes', programmeRoutes);
router.use('/courses', courseRoutes);

export default router;
