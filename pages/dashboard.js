// pages/dashboard.js (Automatic Scan kısmı)
import { useState, useEffect } from 'react';

export default function AutomaticScan() {
    const [categories, setCategories] = useState([
        "Electronics", "Toys", "Books", "Home", "Clothing"
    ]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [autoProducts, setAutoProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const startScan = async () => {
        if (!selectedCategory) return alert("Kategori seçin");
        setLoading(true);

        const res = await fetch('/api/startCategoryScan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: selectedCategory })
        });

        const data = await res.json();
        console.log("Queue response:", data);
        setLoading(false);
        fetchResults();
    }

    const fetchResults = async () => {
        const res = await fetch('/api/getAutoProducts?category=' + selectedCategory);
        const data = await res.json();
        setAutoProducts(data.products);
    }

    useEffect(() => {
        if(selectedCategory) fetchResults();
    }, [selectedCategory]);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Automatic Scan</h2>

            <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="border p-2 mb-4"
            >
                <option value="">Kategori Seçin</option>
                {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>

            <button
                onClick={startScan}
                className="bg-green-500 text-white px-4 py-2 mb-4"
            >
                Scan Başlat
            </button>

            {loading && <p>Scan başlatılıyor, queue’da işleniyor...</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {autoProducts.map(prod => (
                    <div key={prod.upc} className="border p-4 rounded">
                        <h3 className="font-semibold">{prod.title} ({prod.brand})</h3>
                        <p>US Price: ${prod.usPrice / 100}</p>
                        <p>EU Price: €{prod.euPrice / 100}</p>
                        <p>Opportunity Score: ${prod.opportunityScore.toFixed(2)}</p>
                        <p>Mode: {prod.mode}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}


// // pages/dashboard.js
// import { useState, useEffect } from 'react';

// export default function Dashboard() {
//     const [manualUPC, setManualUPC] = useState("");
//     const [manualResult, setManualResult] = useState(null);
//     const [autoProducts, setAutoProducts] = useState([]);
//     const [loadingAuto, setLoadingAuto] = useState(false);

//     // Manual scan handler
//     const scanManual = async () => {
//         const res = await fetch('/api/scanOrAuto', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ upc: manualUPC, mode: "manual" })
//         });
//         const data = await res.json();
//         setManualResult(data.product);
//     }

//     // Automatic products fetch
//     useEffect(() => {
//         setLoadingAuto(true);
//         fetch('/api/getAutoProducts') // Backend API to fetch queued / processed automatic products
//             .then(res => res.json())
//             .then(data => {
//                 setAutoProducts(data.products);
//                 setLoadingAuto(false);
//             });
//     }, []);

//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4">Scoutly Dashboard</h1>

//             {/* Manual Scan Tab */}
//             <section className="mb-8">
//                 <h2 className="text-xl font-semibold mb-2">Manual Scan</h2>
//                 <input
//                     type="text"
//                     placeholder="Scan UPC"
//                     value={manualUPC}
//                     onChange={e => setManualUPC(e.target.value)}
//                     className="border p-2 mr-2"
//                 />
//                 <button onClick={scanManual} className="bg-blue-500 text-white px-4 py-2">Scan</button>

//                 {manualResult && (
//                     <div className="mt-4 border p-4 rounded">
//                         <h3 className="font-semibold">{manualResult.title} ({manualResult.brand})</h3>
//                         <p>US Price: ${manualResult.usPrice / 100}</p>
//                         <p>EU Price: €{manualResult.euPrice / 100}</p>
//                         <p>Opportunity Score: ${manualResult.opportunityScore.toFixed(2)}</p>
//                         <p>Mode: {manualResult.mode}</p>
//                     </div>
//                 )}
//             </section>

//             {/* Automatic Scan Tab */}
//             <section>
//                 <h2 className="text-xl font-semibold mb-2">Automatic Scan</h2>
//                 {loadingAuto && <p>Loading automatic products...</p>}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {autoProducts.map(prod => (
//                         <div key={prod.upc} className="border p-4 rounded">
//                             <h3 className="font-semibold">{prod.title} ({prod.brand})</h3>
//                             <p>US Price: ${prod.usPrice / 100}</p>
//                             <p>EU Price: €{prod.euPrice / 100}</p>
//                             <p>Opportunity Score: ${prod.opportunityScore.toFixed(2)}</p>
//                             <p>Mode: {prod.mode}</p>
//                         </div>
//                     ))}
//                 </div>
//             </section>
//         </div>
//     );
// }
