import cronParser from "cron-parser";
import { getDB } from "../lib/mongo.js";
import { keepaQueue } from "../lib/keepaQueue.js";

async function checkSchedules() {
  const db = await getDB();
  const now = new Date();

  const schedules = await db.collection("schedules").find({ status: "active" }).toArray();

  for(const s of schedules) {
    const interval = cronParser.parseExpression(s.schedule, { currentDate: s.lastRun || now });
    const nextRun = interval.next().toDate();

    if(nextRun <= now) {
      // Queue ekle
      await keepaQueue.add({ category: s.category });

      // LastRun update
      await db.collection("schedules").updateOne({ _id: s._id }, { $set: { lastRun: now } });
      console.log(`Schedule triggered: ${s.name} at ${now}`);
    }
  }
}

// Her dakika kontrol et
setInterval(checkSchedules, 60*1000);
