import { useState } from "react";

export default function ManualScanForm() {
  const [upc, setUpc] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    await fetch("/api/scanManual", {
      method: "POST",
      body: JSON.stringify({ upc }),
      headers: { "Content-Type": "application/json" }
    });
    setUpc("");
    alert("Scan queued!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={upc} onChange={e => setUpc(e.target.value)} placeholder="Enter UPC / Barcode" />
      <button type="submit">Scan</button>
    </form>
  );
}
