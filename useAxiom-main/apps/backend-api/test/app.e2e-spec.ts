import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { prisma } from '@useaxiom/database';

describe('useAxiom Backend Routes (e2e)', () => {
  let app: INestApplication<App>;
  const orgId = '77777777-7777-7777-7777-777777777777';
  const userId = '88888888-8888-8888-8888-888888888888';

  beforeAll(async () => {
    await prisma.organization.upsert({
      where: { id: orgId },
      update: {},
      create: {
        id: orgId,
        name: 'Sprint 3 Test Org',
      },
    });

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        organization_id: orgId,
        role: 'EMPLOYEE',
        name: 'Sprint 3 Developer',
        phone_number: '1234567890',
      },
    });
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  describe('Project & Milestone & Task Integration CRUD', () => {
    let createdProjectId: string;
    let createdMilestoneId: string;
    let createdTaskId: string;

    it('POST /api/v1/projects (Create Project)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('x-organization-id', orgId)
        .send({
          name: 'Sprint 3 Launch Campaign',
          objective: 'Test milestone and state machine workflows',
          target_deadline: '2026-12-01T00:00:00.000Z',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      createdProjectId = res.body.id;
    });

    it('POST /api/v1/projects/:id/milestones (Create Milestone)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${createdProjectId}/milestones`)
        .set('x-organization-id', orgId)
        .send({
          name: 'Milestone 1: Prototype',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Milestone 1: Prototype');
      expect(res.body.project_id).toBe(createdProjectId);
      createdMilestoneId = res.body.id;
    });

    it('GET /api/v1/projects/:id/milestones (List Milestones)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${createdProjectId}/milestones`)
        .set('x-organization-id', orgId)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].id).toBe(createdMilestoneId);
    });

    it('POST /api/v1/tasks (Create Task under Milestone)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('x-organization-id', orgId)
        .send({
          project_id: createdProjectId,
          milestone_id: createdMilestoneId,
          title: 'Design UI Schema Mockup',
          description: 'Establish draft CSS models',
          estimated_hours: 8.5,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('PROPOSED');
      expect(res.body.project_id).toBe(createdProjectId);
      expect(res.body.milestone_id).toBe(createdMilestoneId);
      createdTaskId = res.body.id;
    });

    it('GET /api/v1/projects/:id/tasks (List Project Tasks)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${createdProjectId}/tasks`)
        .set('x-organization-id', orgId)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].id).toBe(createdTaskId);
    });

    it('GET /api/v1/tasks/:id (Get Task Details)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${createdTaskId}`)
        .set('x-organization-id', orgId)
        .expect(200);

      expect(res.body.id).toBe(createdTaskId);
      expect(res.body.title).toBe('Design UI Schema Mockup');
    });

    it('PUT /api/v1/tasks/:id (Update Task fields)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/tasks/${createdTaskId}`)
        .set('x-organization-id', orgId)
        .send({
          title: 'Design UI Schema Mockup V2',
          estimated_hours: 10,
        })
        .expect(200);

      expect(res.body.title).toBe('Design UI Schema Mockup V2');
      expect(res.body.estimated_hours).toBe('10');
    });

    it('POST /api/v1/tasks/:id/approve (Single Task Approval)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${createdTaskId}/approve`)
        .set('x-organization-id', orgId)
        .send({
          assignee_id_override: userId,
          estimated_hours_override: 12,
        })
        .expect(200);

      expect(res.body.status).toBe('PENDING');
      expect(res.body.estimated_hours).toBe('12');
    });

    it('PUT /api/v1/tasks/:id (State Transition - Invalid)', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/tasks/${createdTaskId}`)
        .set('x-organization-id', orgId)
        .send({
          status: 'COMPLETED',
        })
        .expect(400);
    });

    it('PUT /api/v1/tasks/:id (State Transition - Valid)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/tasks/${createdTaskId}`)
        .set('x-organization-id', orgId)
        .send({
          status: 'IN_PROGRESS',
        })
        .expect(200);

      expect(res.body.status).toBe('IN_PROGRESS');
    });

    it('POST /api/v1/tasks/:id/assign (Assign Task)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${createdTaskId}/assign`)
        .set('x-organization-id', orgId)
        .send({
          userId: userId,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.task_id).toBe(createdTaskId);
      expect(res.body.user_id).toBe(userId);
    });

    it('POST /api/v1/projects/:id/approve-plan (Project Plan Approval - Cascades)', async () => {
      const taskRes = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('x-organization-id', orgId)
        .send({
          project_id: createdProjectId,
          title: 'Secondary proposed task',
          description: 'A second task',
          estimated_hours: 5,
        })
        .expect(201);

      const secondTaskId = taskRes.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/projects/${createdProjectId}/approve-plan`)
        .set('x-organization-id', orgId)
        .expect(200);

      const detailRes = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${secondTaskId}`)
        .set('x-organization-id', orgId)
        .expect(200);

      expect(detailRes.body.status).toBe('PENDING');
    });

    it('DELETE /api/v1/tasks/:id (Soft Delete Task)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/tasks/${createdTaskId}`)
        .set('x-organization-id', orgId)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/v1/tasks/${createdTaskId}`)
        .set('x-organization-id', orgId)
        .expect(404);
    });
  });

  describe('Analytics routes (Skeletons)', () => {
    it('GET /api/v1/analytics/dashboard', () => {
      return request(app.getHttpServer())
        .get('/api/v1/analytics/dashboard?timeframe=14d5')
        .expect(200)
        .expect((res) => {
          expect(res.body.active_projects).toBe(3);
          expect(res.body.timeframe).toBe('14d5');
        });
    });

    it('GET /api/v1/analytics/team-workload', () => {
      return request(app.getHttpServer())
        .get('/api/v1/analytics/team-workload')
        .expect(200)
        .expect((res) => {
          expect(res.body.workloads).toBeDefined();
        });
    });
  });

  afterAll(async () => {
    await prisma.assignment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.milestone.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    await app.close();
  });

  afterEach(async () => {
    await app.close();
  });
});
