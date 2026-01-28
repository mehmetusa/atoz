import { useState } from "react";

export default function CategorySelector() {
  const [category, setCategory] = useState("");

  const handleStart = async () => {
    await fetch("/api/scanAuto", {
      method: "POST",
      body: JSON.stringify({ category }),
      headers: { "Content-Type": "application/json" }
    });
    alert("Automatic scan started!");
  };

  return (
    <div>
      <select value={category} onChange={e => setCategory(e.target.value)}>
        <option value="">Select Category</option>
        <option value="toys">Toys</option>
        <option value="electronics">Electronics</option>
        <option value="home">Home</option>
        <option value="books">Books</option>
      </select>
      <button onClick={handleStart}>Start Scan</button>
    </div>
  );
}
