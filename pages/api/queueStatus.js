import { keepaQueue } from "../../lib/keepaQueue.js";

export default async function handler(req, res) {
  const waiting = await keepaQueue.getWaiting();
  const active = await keepaQueue.getActive();
  const completed = await keepaQueue.getCompleted();
  const failed = await keepaQueue.getFailed();

  const formatJobs = (jobs, status) => jobs.map(j => ({
    id: j.id,
    data: j.data,
    status
  }));

  res.status(200).json([
    ...formatJobs(waiting, "waiting"),
    ...formatJobs(active, "active"),
    ...formatJobs(completed, "completed"),
    ...formatJobs(failed, "failed")
  ]);
}
