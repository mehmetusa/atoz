import { useState } from "react";

export default function ManualScan() {
  const [upc, setUpc] = useState("");
  const [message, setMessage] = useState("");

  const handleScan = async () => {
    if (!upc) return alert("Enter a UPC or ASIN");

    setMessage("Scanning...");

    try {
      const res = await fetch("/api/scanManual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upc }),
      });

      const data = await res.json();
      setMessage(`Scan completed: ${data.upc} queued`);
      setUpc("");
    } catch (err) {
      console.error(err);
      setMessage("Scan failed");
    }
  };

  return (
    <div className="mb-6 p-4 border rounded">
      <h2 className="font-semibold mb-2">Manual Scan</h2>
      <input
        type="text"
        placeholder="Enter UPC or ASIN"
        value={upc}
        onChange={(e) => setUpc(e.target.value)}
        className="border p-2 mr-2"
      />
      <button onClick={handleScan} className="bg-green-500 text-white px-4 py-2 rounded">
        Scan
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
