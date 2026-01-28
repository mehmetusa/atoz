import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend
  } from "chart.js";
  
  import { Line } from "react-chartjs-2";
  
  ChartJS.register(
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend
  );
  
  // ---- helper: Keepa CSV → {labels, values}
  function parseKeepaCsv(csv = []) {
    const labels = [];
    const values = [];
  
    for (let i = 0; i < csv.length; i += 2) {
      labels.push(new Date(csv[i] * 1000).toLocaleDateString());
      values.push(csv[i + 1] / 100);
    }
  
    return { labels, values };
  }
  
  // ---- helper: sales rank (no /100)
  function parseKeepaRank(csv = []) {
    const values = [];
    for (let i = 0; i < csv.length; i += 2) {
      values.push(csv[i + 1]);
    }
    return values;
  }
  
  export default function ProductChart({ product }) {
    if (!product?.csv) return null;
  
    // Prices
    const buyBox = parseKeepaCsv(product.csv.BUY_BOX_SHIPPING ?? []);
    const amazon = parseKeepaCsv(product.csv.AMAZON ?? []);
    const newPrice = parseKeepaCsv(product.csv.NEW ?? []);
    const usedPrice = parseKeepaCsv(product.csv.USED ?? []);
  
    // Sales rank
    const rankCsv = product?.salesRanks?.AMAZON ?? [];
    const rankData = parseKeepaRank(rankCsv);
  
    // Labels priority: BuyBox → Amazon → New
    const labels =
      buyBox.labels.length
        ? buyBox.labels
        : amazon.labels.length
        ? amazon.labels
        : newPrice.labels;
  
    const data = {
      labels,
      datasets: [
        {
          label: "Buy Box ($)",
          data: buyBox.values,
          borderColor: "#f59e0b",
          tension: 0.2,
          pointRadius: 0,
          spanGaps: true,
          yAxisID: "y1"
        },
        {
          label: "Amazon ($)",
          data: amazon.values,
          borderColor: "green",
          tension: 0.2,
          pointRadius: 0,
          spanGaps: true,
          yAxisID: "y1"
        },
        {
          label: "New ($)",
          data: newPrice.values,
          borderColor: "#3b82f6",
          tension: 0.2,
          pointRadius: 0,
          spanGaps: true,
          yAxisID: "y1"
        },
        {
          label: "Used ($)",
          data: usedPrice.values,
          borderColor: "#6b7280",
          borderDash: [5, 5],
          tension: 0.2,
          pointRadius: 0,
          spanGaps: true,
          yAxisID: "y1"
        },
        {
          label: "Sales Rank",
          data: rankData,
          borderColor: "purple",
          tension: 0.2,
          pointRadius: 0,
          spanGaps: true,
          yAxisID: "y2"
        }
      ]
    };
  
    const options = {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "top" },
        tooltip: { enabled: true }
      },
      scales: {
        y1: {
          type: "linear",
          position: "left",
          title: { display: true, text: "Price ($)" }
        },
        y2: {
          type: "linear",
          position: "right",
          reverse: true,
          title: { display: true, text: "Sales Rank" },
          grid: { drawOnChartArea: false }
        }
      }
    };
  
    return <Line data={data} options={options} />;
  }
  
  
  
//   import {
//     Chart as ChartJS,
//     LineElement,
//     PointElement,
//     LinearScale,
//     CategoryScale,
//     Tooltip,
//     Legend
//   } from "chart.js";
  
//   ChartJS.register(
//     LineElement,
//     PointElement,
//     LinearScale,
//     CategoryScale,
//     Tooltip,
//     Legend
//   );
  
//   import { Line } from "react-chartjs-2";

// export default function ProductChart({ product }) {
//   // Convert Keepa CSV to chart data
//   const priceData =
//   product?.csv?.[0]
//     ? product.csv[0].map(c => c / 100)
//     : [];

//     const rankData = 
//     product?.salesRanks &&
//     (product.salesRanks.AMAZON || product.salesRanks[0]) ||
//     [];
  

//   const labels = priceData.map((_, i) => i); // index yerine tarih olabilir

//   const data = {
//     labels,
//     datasets: [
//       {
//         label: "Amazon Price ($)",
//         data: priceData,
//         borderColor: "green",
//         yAxisID: "y1",
//         tension: 0.2
//       },
//       {
//         label: "Sales Rank",
//         data: rankData,
//         borderColor: "blue",
//         yAxisID: "y2",
//         tension: 0.2
//       }
//     ]
//   };

//   const options = {
//     responsive: true,
//     scales: {
//       y1: { type: "linear", position: "left", title: { display: true, text: "Price ($)" } },
//       y2: { type: "linear", position: "right", reverse: true, title: { display: true, text: "Sales Rank" } }
//     }
//   };

//   return <Line data={data} options={options} />;
// }



