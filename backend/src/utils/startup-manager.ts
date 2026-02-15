/**
 * 启动管理器
 * 管理服务启动顺序和依赖关系
 */

import { logger } from '../utils/logger';

interface StartupTask {
  name: string;
  handler: () => Promise<void> | void;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface StartupResult {
  name: string;
  success: boolean;
  duration: number;
  error?: Error;
}

class StartupManager {
  private tasks: Map<string, StartupTask> = new Map();
  private results: Map<string, StartupResult> = new Map();
  private completedTasks: Set<string> = new Set();

  register(task: StartupTask): void {
    this.tasks.set(task.name, task);
    logger.debug(`Startup task registered: ${task.name}`);
  }

  async runAll(): Promise<void> {
    logger.info(`Starting ${this.tasks.size} startup tasks...`);
    const startTime = Date.now();

    const sortedTasks = this.topologicalSort();
    
    for (const task of sortedTasks) {
      await this.runTask(task);
    }

    const totalDuration = Date.now() - startTime;
    const successCount = Array.from(this.results.values()).filter(r => r.success).length;
    const failCount = this.results.size - successCount;

    logger.info(`Startup completed in ${totalDuration}ms: ${successCount} succeeded, ${failCount} failed`);
  }

  private topologicalSort(): StartupTask[] {
    const sorted: StartupTask[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (name: string) => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        logger.warn(`Circular dependency detected in startup tasks: ${name}`);
        return;
      }

      visiting.add(name);
      const task = this.tasks.get(name);
      if (task?.dependencies) {
        for (const dep of task.dependencies) {
          visit(dep);
        }
      }
      visiting.delete(name);
      visited.add(name);
      if (task) {
        sorted.push(task);
      }
    };

    for (const name of this.tasks.keys()) {
      visit(name);
    }

    return sorted;
  }

  private async runTask(task: StartupTask): Promise<void> {
    const startTime = Date.now();
    const retries = task.retries ?? 0;
    const retryDelay = task.retryDelay ?? 1000;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (task.dependencies) {
          for (const dep of task.dependencies) {
            if (!this.completedTasks.has(dep)) {
              const depResult = this.results.get(dep);
              if (depResult && !depResult.success) {
                throw new Error(`Dependency ${dep} failed`);
              }
            }
          }
        }

        if (task.timeout) {
          await Promise.race([
            this.executeHandler(task.handler),
            new Promise<void>((_, reject) => 
              setTimeout(() => reject(new Error(`Task ${task.name} timed out after ${task.timeout}ms`)), task.timeout)
            )
          ]);
        } else {
          await this.executeHandler(task.handler);
        }

        const duration = Date.now() - startTime;
        this.results.set(task.name, { name: task.name, success: true, duration });
        this.completedTasks.add(task.name);
        logger.info(`Startup task completed: ${task.name} (${duration}ms)`);
        return;
      } catch (error: any) {
        lastError = error;
        if (attempt < retries) {
          logger.warn(`Startup task ${task.name} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    const duration = Date.now() - startTime;
    this.results.set(task.name, { name: task.name, success: false, duration, error: lastError });
    logger.error(`Startup task failed: ${task.name} (${duration}ms)`, lastError);
  }

  private async executeHandler(handler: () => Promise<void> | void): Promise<void> {
    const result = handler();
    if (result instanceof Promise) {
      await result;
    }
  }

  getResults(): StartupResult[] {
    return Array.from(this.results.values());
  }

  isCompleted(name: string): boolean {
    return this.completedTasks.has(name);
  }
}

export const startupManager = new StartupManager();

export function registerStartupTask(task: StartupTask): void {
  startupManager.register(task);
}

export async function runStartupTasks(): Promise<void> {
  await startupManager.runAll();
}
