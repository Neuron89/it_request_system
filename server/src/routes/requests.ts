import { Router, Request, Response } from 'express';
import db from '../db/connection';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createRequestSchema, reviewRequestSchema } from '@itr/shared';

const router = Router();

// Generate request number
async function generateRequestNumber(type: string): Promise<string> {
  const prefix = type === 'hardware' ? 'HW' : type === 'software' ? 'SW' : type === 'permission' ? 'PM' : type === 'access' ? 'AC' : 'OT';
  const year = new Date().getFullYear();
  const count = await db('requests')
    .where('request_number', 'like', `${prefix}-${year}-%`)
    .count('id as count')
    .first();
  const num = (parseInt(String(count?.count || 0)) + 1).toString().padStart(4, '0');
  return `${prefix}-${year}-${num}`;
}

// Create request
router.post('/', authenticate, validate(createRequestSchema), async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const requestNumber = await generateRequestNumber(data.request_type);

    // Get user's manager
    const user = await db('users').where({ id: req.user!.id }).first();
    const managerId = user?.manager_id || null;

    const [request] = await db('requests').insert({
      request_number: requestNumber,
      requester_id: req.user!.id,
      request_type: data.request_type,
      status: 'submitted',
      urgency: data.urgency,
      title: data.title,
      justification: data.justification,
      manager_id: managerId,
      hardware_specs: data.hardware_specs ? JSON.stringify(data.hardware_specs) : null,
      software_details: data.software_details ? JSON.stringify(data.software_details) : null,
      permission_details: data.permission_details ? JSON.stringify(data.permission_details) : null,
      access_details: data.access_details ? JSON.stringify(data.access_details) : null,
      other_details: data.other_details ? JSON.stringify(data.other_details) : null,
    }).returning('*');

    // Add history entry
    await db('request_history').insert({
      request_id: request.id,
      from_status: null,
      to_status: 'submitted',
      changed_by: req.user!.id,
      comment: 'Request submitted',
    });

    // Auto-move to manager_review if they have a manager
    if (managerId) {
      await db('requests').where({ id: request.id }).update({ status: 'manager_review' });
      await db('request_history').insert({
        request_id: request.id,
        from_status: 'submitted',
        to_status: 'manager_review',
        changed_by: req.user!.id,
        comment: 'Sent to manager for review',
      });
    }

    res.status(201).json(request);
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// List requests (with filters)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, type, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = db('requests')
      .leftJoin('users as requester', 'requests.requester_id', 'requester.id')
      .leftJoin('users as manager', 'requests.manager_id', 'manager.id')
      .leftJoin('departments', 'requester.department_id', 'departments.id')
      .select(
        'requests.*',
        'requester.name as requester_name',
        'requester.email as requester_email',
        'departments.name as requester_department',
        'manager.name as manager_name',
        'manager.email as manager_email'
      );

    // Role-based filtering
    if (req.user!.role === 'employee') {
      query = query.where('requests.requester_id', req.user!.id);
    } else if (req.user!.role === 'manager') {
      query = query.where(function() {
        this.where('requests.manager_id', req.user!.id)
          .orWhere('requests.requester_id', req.user!.id);
      });
    }
    // it_admin sees everything

    if (status) query = query.where('requests.status', status as string);
    if (type) query = query.where('requests.request_type', type as string);

    const countQuery = query.clone().clearSelect().count('requests.id as total').first();
    const [{ total }] = await Promise.all([countQuery]);

    const data = await query
      .orderBy('requests.created_at', 'desc')
      .limit(parseInt(limit as string))
      .offset(offset);

    res.json({
      data,
      total: parseInt(String(total)),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: Math.ceil(parseInt(String(total)) / parseInt(limit as string)),
    });
  } catch (err) {
    console.error('List requests error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single request
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const request = await db('requests')
      .leftJoin('users as requester', 'requests.requester_id', 'requester.id')
      .leftJoin('users as manager', 'requests.manager_id', 'manager.id')
      .leftJoin('users as it_admin', 'requests.it_admin_id', 'it_admin.id')
      .leftJoin('departments', 'requester.department_id', 'departments.id')
      .select(
        'requests.*',
        'requester.name as requester_name',
        'requester.email as requester_email',
        'departments.name as requester_department',
        'manager.name as manager_name',
        'manager.email as manager_email',
        'it_admin.name as it_admin_name'
      )
      .where('requests.id', req.params.id)
      .first();

    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    // Get comments
    const comments = await db('request_comments')
      .join('users', 'request_comments.user_id', 'users.id')
      .select('request_comments.*', 'users.name as user_name')
      .where({ request_id: request.id })
      .orderBy('request_comments.created_at', 'asc');

    // Get history
    const history = await db('request_history')
      .join('users', 'request_history.changed_by', 'users.id')
      .select('request_history.*', 'users.name as changed_by_name')
      .where({ request_id: request.id })
      .orderBy('request_history.created_at', 'asc');

    res.json({ ...request, comments, history });
  } catch (err) {
    console.error('Get request error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Manager review
router.post('/:id/manager-review', authenticate, authorize('manager', 'it_admin'), validate(reviewRequestSchema), async (req: Request, res: Response) => {
  try {
    const request = await db('requests').where({ id: req.params.id }).first();
    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    if (request.status !== 'manager_review') {
      res.status(400).json({ message: 'Request is not pending manager review' });
      return;
    }

    const { decision, notes } = req.body;
    const newStatus = decision === 'approved' ? 'it_review' : 'denied';

    await db('requests').where({ id: request.id }).update({
      status: newStatus,
      manager_notes: notes || null,
      manager_decision_at: new Date(),
    });

    await db('request_history').insert({
      request_id: request.id,
      from_status: 'manager_review',
      to_status: newStatus,
      changed_by: req.user!.id,
      comment: decision === 'approved'
        ? `Manager approved: ${notes || 'No notes'}`
        : `Manager denied: ${notes || 'No reason given'}`,
    });

    res.json({ message: `Request ${decision}`, status: newStatus });
  } catch (err) {
    console.error('Manager review error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// IT Admin review
router.post('/:id/it-review', authenticate, authorize('it_admin'), validate(reviewRequestSchema), async (req: Request, res: Response) => {
  try {
    const request = await db('requests').where({ id: req.params.id }).first();
    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    if (request.status !== 'it_review' && request.status !== 'submitted') {
      res.status(400).json({ message: 'Request is not pending IT review' });
      return;
    }

    const { decision, notes } = req.body;
    const newStatus = decision === 'approved' ? 'approved' : 'denied';

    await db('requests').where({ id: request.id }).update({
      status: newStatus,
      it_admin_id: req.user!.id,
      it_admin_notes: notes || null,
      it_decision_at: new Date(),
    });

    await db('request_history').insert({
      request_id: request.id,
      from_status: request.status,
      to_status: newStatus,
      changed_by: req.user!.id,
      comment: decision === 'approved'
        ? `IT approved: ${notes || 'No notes'}`
        : `IT denied: ${notes || 'No reason given'}`,
    });

    res.json({ message: `Request ${decision}`, status: newStatus });
  } catch (err) {
    console.error('IT review error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add comment
router.post('/:id/comments', authenticate, async (req: Request, res: Response) => {
  try {
    const { comment } = req.body;
    if (!comment?.trim()) {
      res.status(400).json({ message: 'Comment is required' });
      return;
    }

    const [newComment] = await db('request_comments').insert({
      request_id: parseInt(req.params.id),
      user_id: req.user!.id,
      comment: comment.trim(),
    }).returning('*');

    res.status(201).json({ ...newComment, user_name: req.user!.name });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update status (IT admin - mark in_progress or completed)
router.patch('/:id/status', authenticate, authorize('it_admin'), async (req: Request, res: Response) => {
  try {
    const { status, comment } = req.body;
    const request = await db('requests').where({ id: req.params.id }).first();
    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    await db('requests').where({ id: request.id }).update({ status });
    await db('request_history').insert({
      request_id: request.id,
      from_status: request.status,
      to_status: status,
      changed_by: req.user!.id,
      comment: comment || `Status changed to ${status}`,
    });

    res.json({ message: 'Status updated', status });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel request (requester only)
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const request = await db('requests').where({ id: req.params.id }).first();
    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    if (request.requester_id !== req.user!.id && req.user!.role !== 'it_admin') {
      res.status(403).json({ message: 'Only the requester can cancel' });
      return;
    }

    if (['completed', 'cancelled'].includes(request.status)) {
      res.status(400).json({ message: 'Cannot cancel this request' });
      return;
    }

    await db('requests').where({ id: request.id }).update({ status: 'cancelled' });
    await db('request_history').insert({
      request_id: request.id,
      from_status: request.status,
      to_status: 'cancelled',
      changed_by: req.user!.id,
      comment: 'Request cancelled',
    });

    res.json({ message: 'Request cancelled' });
  } catch (err) {
    console.error('Cancel request error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
