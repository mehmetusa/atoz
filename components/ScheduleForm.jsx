import { useState } from "react";

export default function ScheduleForm({ onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [cronTime, setCronTime] = useState("0 2 * * *");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, schedule: cronTime, status: "active" })
    });
    setName(""); setCategory(""); setCronTime("0 2 * * *");
    if(onSave) onSave();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Schedule Name" value={name} onChange={e => setName(e.target.value)} />
      <select value={category} onChange={e => setCategory(e.target.value)}>
        <option value="">Select Category</option>
        <option value="toys">Toys</option>
        <option value="electronics">Electronics</option>
        <option value="home">Home</option>
      </select>
      <input placeholder="Cron (0 2 * * *)" value={cronTime} onChange={e => setCronTime(e.target.value)} />
      <button type="submit">Save Schedule</button>
    </form>
  );
}
