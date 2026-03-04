import { Router, Request, Response } from 'express';
import db from '../db/connection';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    let baseQuery = db('requests');

    if (req.user!.role === 'employee') {
      baseQuery = baseQuery.where('requester_id', req.user!.id);
    } else if (req.user!.role === 'manager') {
      baseQuery = baseQuery.where(function() {
        this.where('manager_id', req.user!.id).orWhere('requester_id', req.user!.id);
      });
    }

    // Counts by status
    const statusCounts = await baseQuery.clone()
      .select('status')
      .count('id as count')
      .groupBy('status');

    // Counts by type
    const typeCounts = await baseQuery.clone()
      .select('request_type')
      .count('id as count')
      .groupBy('request_type');

    // Recent requests
    const recent = await baseQuery.clone()
      .leftJoin('users as requester', 'requests.requester_id', 'requester.id')
      .select('requests.id', 'requests.request_number', 'requests.title', 'requests.status', 'requests.request_type', 'requests.urgency', 'requests.created_at', 'requester.name as requester_name')
      .orderBy('requests.created_at', 'desc')
      .limit(10);

    // Pending manager review count (for managers)
    let pendingManagerReview = 0;
    if (req.user!.role === 'manager' || req.user!.role === 'it_admin') {
      const result = await db('requests')
        .where('status', 'manager_review')
        .andWhere(function() {
          if (req.user!.role === 'manager') {
            this.where('manager_id', req.user!.id);
          }
        })
        .count('id as count')
        .first();
      pendingManagerReview = parseInt(String(result?.count || 0));
    }

    // Pending IT review count (for IT admins)
    let pendingItReview = 0;
    if (req.user!.role === 'it_admin') {
      const result = await db('requests')
        .where('status', 'it_review')
        .count('id as count')
        .first();
      pendingItReview = parseInt(String(result?.count || 0));
    }

    res.json({
      statusCounts: Object.fromEntries(statusCounts.map((r: any) => [r.status, parseInt(String(r.count))])),
      typeCounts: Object.fromEntries(typeCounts.map((r: any) => [r.request_type, parseInt(String(r.count))])),
      recent,
      pendingManagerReview,
      pendingItReview,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
