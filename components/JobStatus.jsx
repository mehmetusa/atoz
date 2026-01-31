import { useState, useEffect } from "react";

export default function JobStatus() {
  const [jobs, setJobs] = useState([]);

  const fetchJobs = async () => {
    const res = await fetch("/api/queueStatus");
    const data = await res.json();
    setJobs(data);
  };

  useEffect(() => {
    const interval = setInterval(fetchJobs, 3000); // 3 sn refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 border rounded">
      <h2 className="font-semibold mb-2">Queue Status</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Job ID</th>
            <th className="border px-2 py-1">UPC</th>
            <th className="border px-2 py-1">Category / Mode</th>
            <th className="border px-2 py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <td className="border px-2 py-1">{j.id}</td>
              <td className="border px-2 py-1">{j.data.upc}</td>
              <td className="border px-2 py-1">{j.data.category || j.data.mode}</td>
              <td className="border px-2 py-1">{j.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
