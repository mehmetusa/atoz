import { useState, useEffect } from "react";
import CategorySelector from "../../components/admin/CategorySelector";
import ManualScanForm from "../../components/admin/ManualScanForm";
import JobStatus from "../../components/admin/JobStatus";
import ProductTable from "../../components/admin/ProductTable";
// import ProductChart from "../../components/admin/ProductChart";
// import ScheduleForm from "../../components/admin/ScheduleForm";

export default function Dashboard() {
  const [category, setCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sortField, setSortField] = useState("opportunityScore");
  const [sortAsc, setSortAsc] = useState(false);

  // Fetch opportunities
  const fetchOpportunities = async () => {
    const res = await fetch(`/api/getOpportunities?category=${category}`);
    // const data = await res.json();
const data = [
  { title: "Book A", opportunityScore: 25 },
  { title: "Book B", opportunityScore: 35 },
  { title: "Gadget C", opportunityScore: 50 },
];
    // Alerts for high opportunity scores
    if(data.length === 0 || data === undefined|| data === null) {
      setAlerts([]);
      setProducts([]);
      return;
    }else {
    const newAlerts = data.filter((p) => p.opportunityScore >= 30);
    setAlerts(newAlerts);
       // Sorting
    data.sort((a, b) => (sortAsc ? a[sortField] - b[sortField] : b[sortField] - a[sortField]));

    setProducts(data);
    }

 
  };

  useEffect(() => {
    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 15000);
    return () => clearInterval(interval);
  }, [category, sortField, sortAsc]);

  // Handle sorting
  const handleSort = (field) => {
    if (field === sortField) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Automatic scan start
  const startScan = async () => {
    if (!category) return alert("Select a category first!");
    const res = await fetch("/api/startCategoryScan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    const data = await res.json();
    alert(data.message || `Scan started! Queued: ${data.queuedProducts || "unknown"}`);
  };

  // Dummy product for chart example
  const exampleProduct = {
    id: "ASIN_B08XYZ123",
    title: "Wireless Noise Cancelling Headphones",
    category: "Electronics",
    brand: "SoundPro",
    pricing: { buyPriceUS: 79.99, sellPriceEU: 129.99, currencyBuy: "USD", currencySell: "EUR" },
    fees: { amazonFee: 19.5, fbaFee: 7.2, shippingUS2EU: 8.5, vat: 22.0 },
    profit: { gross: 50.0, net: 18.8, marginPercent: 23.5 },
    sales: { estimatedMonthlySales: 320, rank: 1450, competition: 6 },
    history: {
      dates: ["2025-01-01", "2025-01-08", "2025-01-15", "2025-01-22"],
      buyPriceUS: [82, 80, 79, 79.99],
      sellPriceEU: [135, 132, 130, 129.99],
      netProfit: [16, 18, 19, 18.8],
    },
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Scoutly AI Arbitrage Dashboard</h1>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-200 p-3 mb-4 rounded">
          <strong>🔥 Alerts:</strong>
          {alerts.map((a) => (
            <div key={a.upc}>
              {a.title} | Opportunity: {a.opportunityScore.toFixed(2)}
            </div>
          ))}
        </div>
      )}

      {/* Automatic Scan */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Automatic Scan</h2>
        <CategorySelector value={category} onChange={setCategory} />
        <button
          onClick={startScan}
          className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
        >
          Start Scan
        </button>
      </section>

      {/* Manual Scan */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Manual Scan</h2>
        <ManualScanForm />
      </section>

      {/* Job Status */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Queue Monitor</h2>
        <JobStatus />
      </section>

      {/* Product Table */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Product Opportunities</h2>
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("title")}>Title</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("usPrice")}>US Price</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("euPrice")}>EU Price</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort("opportunityScore")}>Opportunity</th>
              <th className="border px-2 py-1">Buy Box %</th>
              <th className="border px-2 py-1">FBA Seller Trend</th>
              <th className="border px-2 py-1">Price Crash Risk</th>
              <th className="border px-2 py-1">Competition Moat</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.upc}>
                <td className="border px-2 py-1">{p.title}</td>
                <td className="border px-2 py-1">{p.usPrice}</td>
                <td className="border px-2 py-1">{p.euPrice}</td>
                <td className="border px-2 py-1">{p.opportunityScore.toFixed(2)}</td>
                <td className="border px-2 py-1">{p.buyBoxOwnership}%</td>
                <td className="border px-2 py-1">{p.fbaSellerTrend?.length} sellers</td>
                <td className="border px-2 py-1">{p.priceCrashPrediction ? "⚠️" : "✅"}</td>
                <td className="border px-2 py-1">{p.competitionMoat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Product Chart */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Product Chart</h2>
        {/* <ProductChart product={exampleProduct} /> */}
      </section>

      {/* Schedule Form */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Schedule Scan</h2>
        {/* <ScheduleForm /> */}
      </section>
    </div>
  );
}
