async function apiGet(tipo) {
  const url = `${API_URL}?tipo=${encodeURIComponent(tipo)}`;
  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Erro ao buscar '${tipo}' (HTTP ${res.status}). ${txt}`.trim());
  }

  return await res.json();
}

async function apiPost(tipo, dados) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=UTF-8" },
    body: JSON.stringify({ tipo, dados }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Erro ao salvar em '${tipo}' (HTTP ${res.status}). ${txt}`.trim());
  }

  return await res.json();
}

function brMoney(n) {
  const v = Number(n || 0);
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMoney(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
