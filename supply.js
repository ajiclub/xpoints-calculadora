// Proxy para o xpoints.io/api/stats.
// O navegador não pode chamar aquele endereço direto porque a resposta não
// traz Access-Control-Allow-Origin. Esta função roda no servidor da Vercel,
// onde CORS não se aplica, e devolve só os campos que a página usa.
//
// Caminho do arquivo: api/supply.js   (a pasta api/ na raiz do repositório)
// Fica disponível em:  /api/supply

export default async function handler(req, res) {
  try {
    const upstream = await fetch("https://xpoints.io/api/stats", {
      headers: { accept: "application/json" },
    });

    if (!upstream.ok) {
      res.status(502).json({ error: "upstream " + upstream.status });
      return;
    }

    const d = await upstream.json();

    // Cache na borda: 5 min de validade, e até 1h servindo o valor antigo
    // enquanto revalida. Assim o site do xpoints.io não leva uma chamada
    // por visitante.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=3600"
    );

    res.status(200).json({
      total: d.totalPointsSum,
      inst: d.institutionalPointsSum,
      reg: d.registered,
      done: d.refreshedThisEra,
      snap: d.snapshotNumber,
      at: d.lastFetchAt,
    });
  } catch (e) {
    res.status(502).json({ error: "fetch failed" });
  }
}
