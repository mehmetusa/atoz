// pages/index.js
import { useState } from 'react';

export default function Dashboard() {
    const [upc, setUpc] = useState("");
    const [result, setResult] = useState(null);

    const scanProduct = async () => {
        const res = await fetch('/api/calculateOpportunity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ upc })
        });
        const data = await res.json();
        setResult(data.product);
    }

    return (
        <div>
            <input value={upc} onChange={e => setUpc(e.target.value)} placeholder="Scan UPC"/>
            <button onClick={scanProduct}>Scan</button>

            {result && (
                <div>
                    <h3>{result.title} ({result.brand})</h3>
                    <p>US Price: ${result.usPrice / 100}</p>
                    <p>EU Price: €{result.euPrice / 100}</p>
                    <p>Opportunity Score: ${result.opportunityScore.toFixed(2)}</p>
                </div>
            )}
        </div>
    )
}
