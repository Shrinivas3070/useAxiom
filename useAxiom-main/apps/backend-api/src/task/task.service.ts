import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@useaxiom/database';
import type { ITaskCreateDto, ITaskUpdateDto } from '@useaxiom/types';

@Injectable()
export class TaskService {
  private validateStatusTransition(currentStatus: string, nextStatus: string) {
    if (currentStatus === nextStatus) return;

    const allowedTransitions: Record<string, string[]> = {
      PROPOSED: ['PENDING'],
      PENDING: ['IN_PROGRESS'],
      IN_PROGRESS: ['BLOCKED', 'COMPLETED'],
      BLOCKED: ['IN_PROGRESS'],
      COMPLETED: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid task status transition from '${currentStatus}' to '${nextStatus}'.`,
      );
    }
  }

  async createTask(organizationId: string, taskData: ITaskCreateDto) {
    const project = await prisma.project.findFirst({
      where: {
        id: taskData.project_id,
        organization_id: organizationId,
      },
    });

    if (!project) {
      throw new NotFoundException(
        `Project with ID ${taskData.project_id} not found in this organization`,
      );
    }

    if (taskData.milestone_id) {
      const milestone = await prisma.milestone.findUnique({
        where: { id: taskData.milestone_id },
      });
      if (!milestone || milestone.project_id !== taskData.project_id) {
        throw new NotFoundException(`Milestone not found in this project`);
      }
    }

    return prisma.task.create({
      data: {
        organization_id: organizationId,
        project_id: taskData.project_id,
        milestone_id: taskData.milestone_id || null,
        title: taskData.title,
        description: taskData.description,
        estimated_hours: taskData.estimated_hours,
        created_by_ai: taskData.created_by_ai ?? false,
        status: 'PROPOSED',
      },
    });
  }

  async getTasks(
    organizationId: string,
    filter?: {
      project_id?: string;
      milestone_id?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      organization_id: organizationId,
      deleted_at: null,
    };

    if (filter?.project_id) {
      where.project_id = filter.project_id;
    }
    if (filter?.milestone_id) {
      where.milestone_id = filter.milestone_id;
    }
    if (filter?.status) {
      where.status = filter.status;
    }

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getTaskById(organizationId: string, id: string) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        organization_id: organizationId,
        deleted_at: null,
      },
      include: {
        assignments: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async updateTask(
    organizationId: string,
    id: string,
    updateData: ITaskUpdateDto,
  ) {
    const task = await this.getTaskById(organizationId, id);

    const data: any = { ...updateData };

    if (updateData.status) {
      this.validateStatusTransition(task.status, updateData.status);
    }

    return prisma.task.update({
      where: { id },
      data,
    });
  }

  async softDeleteTask(organizationId: string, id: string) {
    await this.getTaskById(organizationId, id);
    return prisma.task.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async approveTask(
    organizationId: string,
    id: string,
    overrideData?: {
      assignee_id_override?: string;
      estimated_hours_override?: number;
    },
  ) {
    const task = await this.getTaskById(organizationId, id);

    this.validateStatusTransition(task.status, 'PENDING');

    const updatePayload: any = { status: 'PENDING' };
    if (overrideData?.estimated_hours_override !== undefined) {
      updatePayload.estimated_hours = overrideData.estimated_hours_override;
    }

    if (overrideData?.assignee_id_override) {
      const user = await prisma.user.findFirst({
        where: {
          id: overrideData.assignee_id_override,
          organization_id: organizationId,
        },
      });
      if (!user) {
        throw new NotFoundException(
          `User with ID ${overrideData.assignee_id_override} not found in this organization`,
        );
      }

      await prisma.assignment.upsert({
        where: {
          task_id_user_id: {
            task_id: id,
            user_id: overrideData.assignee_id_override,
          },
        },
        update: {},
        create: {
          task_id: id,
          user_id: overrideData.assignee_id_override,
        },
      });
    }

    return prisma.task.update({
      where: { id },
      data: updatePayload,
    });
  }

  async assignTask(organizationId: string, taskId: string, userId: string) {
    await this.getTaskById(organizationId, taskId);

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organization_id: organizationId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${userId} not found in this organization`,
      );
    }

    return prisma.assignment.upsert({
      where: {
        task_id_user_id: {
          task_id: taskId,
          user_id: userId,
        },
      },
      update: {},
      create: {
        task_id: taskId,
        user_id: userId,
      },
    });
  }
}
