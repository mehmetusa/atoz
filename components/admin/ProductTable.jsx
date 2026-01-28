export default function ProductTable({ products }) {
    return (
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>US Price</th>
            <th>EU Price</th>
            <th>Profit</th>
            <th>Velocity</th>
            <th>Stability</th>
            <th>Competition</th>
            <th>Final Score</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.upc}>
              <td>{p.asinEU} - {p.title}</td>
              <td>${p.pricing.usPrice}</td>
              <td>€{p.pricing.euPrice}</td>
              <td>${p.pricing.netProfit}</td>
              <td>{p.scores.velocityScore}</td>
              <td>{p.scores.stabilityScore}</td>
              <td>{p.scores.competitionScore}</td>
              <td>{p.scores.finalScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  