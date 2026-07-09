/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
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
        name: 'Sprint 4 Test Org',
      },
    });

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        organization_id: orgId,
        role: 'EMPLOYEE',
        name: 'Sprint 4 Developer',
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
          name: 'Sprint 4 Launch Campaign',
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

  describe('Task Dependencies & Rules (Sprint 4)', () => {
    let projectId: string;
    let taskAId: string;
    let taskBId: string;

    beforeAll(async () => {
      // Seed a project and two task mappings
      const projectRes = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('x-organization-id', orgId)
        .send({
          name: 'Sprint 4 Dependencies Project',
          objective: 'Test execution blockers and cycle detection',
          target_deadline: '2026-12-05T00:00:00.000Z',
        })
        .expect(201);

      projectId = projectRes.body.id;

      const taskARes = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('x-organization-id', orgId)
        .send({
          project_id: projectId,
          title: 'Prerequisite Task A',
          description: 'Must complete this first',
          estimated_hours: 4,
        })
        .expect(201);

      taskAId = taskARes.body.id;

      const taskBRes = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('x-organization-id', orgId)
        .send({
          project_id: projectId,
          title: 'Dependent Task B',
          description: 'Cannot start until A is done',
          estimated_hours: 6,
        })
        .expect(201);

      taskBId = taskBRes.body.id;

      // Approve both tasks to make them PENDING
      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskAId}/approve`)
        .set('x-organization-id', orgId)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskBId}/approve`)
        .set('x-organization-id', orgId)
        .expect(200);
    });

    it('POST /api/v1/tasks/:id/dependencies (Add Dependency: B depends on A)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskBId}/dependencies`)
        .set('x-organization-id', orgId)
        .send({
          dependsOnTaskId: taskAId,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.task_id).toBe(taskBId);
      expect(res.body.depends_on_task_id).toBe(taskAId);
    });

    it('GET /api/v1/tasks/:id/dependencies (List Dependencies)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskBId}/dependencies`)
        .set('x-organization-id', orgId)
        .expect(200);

      expect(res.body.prerequisites.length).toBe(1);
      expect(res.body.prerequisites[0].id).toBe(taskAId);
    });

    it('POST /api/v1/tasks/:id/dependencies (Self Dependency Block)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskAId}/dependencies`)
        .set('x-organization-id', orgId)
        .send({
          dependsOnTaskId: taskAId,
        })
        .expect(400); // self loops are blocked
    });

    it('POST /api/v1/tasks/:id/dependencies (Circular Dependency Block: A depends on B)', async () => {
      // Adding A depends on B when B already depends on A forms a cycle.
      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskAId}/dependencies`)
        .set('x-organization-id', orgId)
        .send({
          dependsOnTaskId: taskBId,
        })
        .expect(400); // should throw cycle bad request
    });

    it('PUT /api/v1/tasks/:id (Execution Block checks - Blocked)', async () => {
      // Trying to start Task B when prerequisite Task A is still PENDING must fail
      await request(app.getHttpServer())
        .put(`/api/v1/tasks/${taskBId}`)
        .set('x-organization-id', orgId)
        .send({
          status: 'IN_PROGRESS',
        })
        .expect(400); // Blocked
    });

    it('PUT /api/v1/tasks/:id (Execution Block checks - Allowed after prerequisite completed)', async () => {
      // 1. Start Task A
      await request(app.getHttpServer())
        .put(`/api/v1/tasks/${taskAId}`)
        .set('x-organization-id', orgId)
        .send({
          status: 'IN_PROGRESS',
        })
        .expect(200);

      // 2. Complete Task A
      await request(app.getHttpServer())
        .put(`/api/v1/tasks/${taskAId}`)
        .set('x-organization-id', orgId)
        .send({
          status: 'COMPLETED',
        })
        .expect(200);

      // 3. Now, starting Task B should succeed
      await request(app.getHttpServer())
        .put(`/api/v1/tasks/${taskBId}`)
        .set('x-organization-id', orgId)
        .send({
          status: 'IN_PROGRESS',
        })
        .expect(200);
    });

    it('DELETE /api/v1/tasks/:id/dependencies/:dependsOnTaskId (Remove Dependency)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/tasks/${taskBId}/dependencies/${taskAId}`)
        .set('x-organization-id', orgId)
        .expect(200);

      // List should now specify 0 prerequisites
      const res = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskBId}/dependencies`)
        .set('x-organization-id', orgId)
        .expect(200);

      expect(res.body.prerequisites.length).toBe(0);
    });
  });

  describe('Analytics routes (Sprint 5 Live Database)', () => {
    it('GET /api/v1/analytics/dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/dashboard?timeframe=14d')
        .set('x-organization-id', orgId)
        .expect(200);

      expect(res.body).toHaveProperty('active_projects');
      expect(res.body).toHaveProperty('blocked_tasks');
      expect(res.body.timeframe).toBe('14d');
    });

    it('GET /api/v1/analytics/team-workload', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/team-workload')
        .set('x-organization-id', orgId)
        .expect(200);

      expect(res.body).toHaveProperty('workloads');
      expect(res.body.workloads.length).toBeGreaterThanOrEqual(1);
      expect(res.body.workloads[0].employee_id).toBe(userId);
    });
  });

  afterAll(async () => {
    await prisma.taskDependency.deleteMany({});
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
