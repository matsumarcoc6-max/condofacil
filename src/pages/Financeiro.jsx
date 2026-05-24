import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

export default function Financeiro() {
  const [lancamentos, setLancamentos] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("receita");
  const [categoria, setCategoria] = useState("Taxa de condominio");
  const [salvando, setSalvando] = useState(false);

  const categoriasReceita = ["Taxa de condominio", "Fundo de reserva", "Multa", "Outro"];
  const categoriasDespesa = ["Manutencao", "Limpeza", "Seguranca", "Agua", "Energia", "Administracao", "Outro"];

  useEffect(() => { carregarLancamentos(); }, []);

  async function carregarLancamentos() {
    const q = query(collection(db, "financeiro"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setLancamentos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function adicionarLancamento() {
    if (!descricao || !valor) return;
    setSalvando(true);
    await addDoc(collection(db, "financeiro"), {
      descricao,
      valor: parseFloat(valor),
      tipo,
      categoria,
      criado_em: serverTimestamp(),
    });
    setDescricao("");
    setValor("");
    setTipo("receita");
    setCategoria("Taxa de condominio");
    setSalvando(false);
    carregarLancamentos();
  }

  const totalReceitas = lancamentos
    .filter((l) => l.tipo === "receita")
    .reduce((acc, l) => acc + l.valor, 0);

  const totalDespesas = lancamentos
    .filter((l) => l.tipo === "despesa")
    .reduce((acc, l) => acc + l.valor, 0);

  const saldo = totalReceitas - totalDespesas;

  function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>Financeiro</h2>

      {/* Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "3px solid #22c55e" }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Total Receitas</p>
          <h3 style={{ color: "#22c55e", margin: "8px 0 0" }}>{formatarMoeda(totalReceitas)}</h3>
        </div>
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "3px solid #ef4444" }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Total Despesas</p>
          <h3 style={{ color: "#ef4444", margin: "8px 0 0" }}>{formatarMoeda(totalDespesas)}</h3>
        </div>
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "3px solid " + (saldo >= 0 ? "#38bdf8" : "#ef4444") }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Saldo</p>
          <h3 style={{ color: saldo >= 0 ? "#38bdf8" : "#ef4444", margin: "8px 0 0" }}>{formatarMoeda(saldo)}</h3>
        </div>
      </div>

      {/* Formulario */}
      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Novo lancamento</h3>

        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <button
            onClick={() => { setTipo("receita"); setCategoria("Taxa de condominio"); }}
            style={{ ...btnTipo, background: tipo === "receita" ? "#22c55e" : "transparent", color: tipo === "receita" ? "#0f172a" : "#94a3b8", border: "1px solid " + (tipo === "receita" ? "#22c55e" : "#334155") }}
          >
            Receita
          </button>
          <button
            onClick={() => { setTipo("despesa"); setCategoria("Manutencao"); }}
            style={{ ...btnTipo, background: tipo === "despesa" ? "#ef4444" : "transparent", color: tipo === "despesa" ? "#fff" : "#94a3b8", border: "1px solid " + (tipo === "despesa" ? "#ef4444" : "#334155") }}
          >
            Despesa
          </button>
        </div>

        <input style={inp} placeholder="Descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />

        <input style={inp} type="number" placeholder="Valor (ex: 1500.00)" value={valor} onChange={(e) => setValor(e.target.value)} />

        <select style={inp} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {(tipo === "receita" ? categoriasReceita : categoriasDespesa).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button style={btn} onClick={adicionarLancamento} disabled={salvando}>
          {salvando ? "Salvando..." : "Adicionar lancamento"}
        </button>
      </div>

      {/* Extrato */}
      <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Extrato</h3>
      {lancamentos.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center" }}>Nenhum lancamento registrado ainda.</p>
      )}
      {lancamentos.map((l) => (
        <div key={l.id} style={{ background: "#1e293b", padding: "16px 20px", borderRadius: "12px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid " + (l.tipo === "receita" ? "#22c55e" : "#ef4444") }}>
          <div>
            <p style={{ color: "#f1f5f9", margin: 0, fontWeight: "500" }}>{l.descricao}</p>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.85rem" }}>{l.categoria}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: l.tipo === "receita" ? "#22c55e" : "#ef4444", margin: 0, fontWeight: "bold" }}>
              {l.tipo === "receita" ? "+" : "-"}{formatarMoeda(l.valor)}
            </p>
            <p style={{ color: "#475569", margin: "4px 0 0", fontSize: "0.8rem" }}>
              {l.criado_em?.toDate().toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btn = { padding: "10px 24px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", marginTop: "8px" };
const btnTipo = { padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.9rem" };