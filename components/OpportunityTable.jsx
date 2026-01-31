import { useState, useEffect } from "react";

export default function OpportunityTable() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    minScore: 0,
    maxRank: 20000,
    hazmat: false,
  });

  const fetchProducts = async () => {
    setLoading(true);
    const query = new URLSearchParams(filter).toString();
    const res = await fetch(`/api/getOpportunities?${query}`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  return (
    <div className="p-4 border rounded mt-4">
      <h2 className="font-semibold mb-2">Opportunity List</h2>

      <div className="mb-2 flex gap-2">
        <input
          type="number"
          placeholder="Min Score"
          value={filter.minScore}
          onChange={(e) => setFilter({ ...filter, minScore: Number(e.target.value) })}
          className="border p-1"
        />
        <input
          type="number"
          placeholder="Max Rank"
          value={filter.maxRank}
          onChange={(e) => setFilter({ ...filter, maxRank: Number(e.target.value) })}
          className="border p-1"
        />
        <label>
          <input
            type="checkbox"
            checked={filter.hazmat}
            onChange={(e) => setFilter({ ...filter, hazmat: e.target.checked })}
          />
          Hazmat
        </label>
        <button
          onClick={fetchProducts}
          className="bg-blue-500 text-white px-2 py-1 rounded"
        >
          Apply
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr>
              <th className="border px-2 py-1">UPC</th>
              <th className="border px-2 py-1">Title</th>
              <th className="border px-2 py-1">US Price</th>
              <th className="border px-2 py-1">EU Price</th>
              <th className="border px-2 py-1">Opportunity Score</th>
              <th className="border px-2 py-1">Rank</th>
              <th className="border px-2 py-1">Hazmat</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.upc}>
                <td className="border px-2 py-1">{p.upc}</td>
                <td className="border px-2 py-1">{p.title}</td>
                <td className="border px-2 py-1">{p.usPrice}</td>
                <td className="border px-2 py-1">{p.euPrice}</td>
                <td className="border px-2 py-1">{p.opportunityScore.toFixed(2)}</td>
                <td className="border px-2 py-1">{p.rank}</td>
                <td className="border px-2 py-1">{p.hazmat ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
