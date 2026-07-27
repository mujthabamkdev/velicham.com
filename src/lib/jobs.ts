export interface IngestionJob {
  id: string;
  youtubeUrl: string;
  totalCount: number;
  processedCount: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message: string;
  logs: string[];
  updatedAt: number;
}

const globalForJobs = globalThis as unknown as {
  _jobsStore?: Map<string, IngestionJob>;
};

export const globalJobs =
  globalForJobs._jobsStore ?? new Map<string, IngestionJob>();

if (process.env.NODE_ENV !== 'production') globalForJobs._jobsStore = globalJobs;

export function createJob(youtubeUrl: string, totalCount: number): IngestionJob {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const timeStr = new Date().toLocaleTimeString();
  const initialLog = `[${timeStr}] 🚀 Task started for ${youtubeUrl}`;
  const job: IngestionJob = {
    id,
    youtubeUrl,
    totalCount,
    processedCount: 0,
    status: 'PROCESSING',
    message: `Request being processed (0 of ${totalCount} videos)...`,
    logs: [initialLog],
    updatedAt: Date.now(),
  };
  globalJobs.set(id, job);
  return job;
}

export function addJobLog(id: string, logText: string) {
  const job = globalJobs.get(id);
  if (job) {
    const timeStr = new Date().toLocaleTimeString();
    const timestamped = `[${timeStr}] ${logText}`;
    job.logs.push(timestamped);
    job.updatedAt = Date.now();
    globalJobs.set(id, job);
  }
}

export function updateJobProgress(id: string, processedCount: number, customMessage?: string) {
  const job = globalJobs.get(id);
  if (job) {
    job.processedCount = processedCount;
    job.updatedAt = Date.now();
    if (processedCount >= job.totalCount) {
      job.status = 'COMPLETED';
      job.message = `Ingestion complete! All ${job.totalCount} video note(s) processed successfully.`;
      addJobLog(id, `🎉 All ${job.totalCount} video note(s) generated successfully!`);
    } else {
      job.message = customMessage || `Request being processed (${processedCount} of ${job.totalCount} videos)...`;
    }
    globalJobs.set(id, job);
  }
}

export function failJob(id: string, errorMessage: string) {
  const job = globalJobs.get(id);
  if (job) {
    job.status = 'FAILED';
    job.message = `Ingestion failed: ${errorMessage}`;
    job.updatedAt = Date.now();
    addJobLog(id, `❌ Ingestion failed: ${errorMessage}`);
    globalJobs.set(id, job);
  }
}

export function getActiveJobs(): IngestionJob[] {
  const now = Date.now();
  // Auto-clean stale jobs stuck in PROCESSING > 10 minutes (600,000 ms)
  for (const job of globalJobs.values()) {
    if (job.status === 'PROCESSING' && now - job.updatedAt > 600000) {
      job.status = 'FAILED';
      job.message = 'Ingestion timed out after 10 minutes.';
      job.updatedAt = now;
    }
  }
  return Array.from(globalJobs.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}
