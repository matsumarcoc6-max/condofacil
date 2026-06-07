import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection, addDoc, getDocs, orderBy, query,
  serverTimestamp, doc, updateDoc, where,
} from "firebase/firestore";

export default function Cobrancas({ perfil, user, dadosUsuario }) {
  const [cobrancas, setCobrancas] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [bloco, setBloco] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [filtro, setFiltro] = useState("pendente");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const podeGerenciar = perfil === "sindico" || perfil === "admin_geral";

  useEffect(() => { carregarCobrancas(); }, []);

  async function carregarCobrancas() {
    let q;
    if (perfil === "morador" && dadosUsuario?.apartamento) {
      q = query(
        collection(db, "cobrancas"),
        where("apartamento", "==", dadosUsuario.apartamento),
        orderBy("criado_em", "desc")
      );
    } else {
      q = query(collection(db, "cobrancas"), orderBy("criado_em", "desc"));
    }
    const snap = await getDocs(q);
    setCobrancas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function criarCobranca() {
    if (!descricao || !valor || !apartamento || !vencimento) return;
    setSalvando(true);
    await addDoc(collection(db, "cobrancas"), {
      descricao,
      valor: parseFloat(valor),
      apartamento,
      bloco: bloco || "",
      vencimento: new Date(`${vencimento}T00:00`),
      status: "pendente",
      criado_em: serverTimestamp(),
      criadoPor: user?.uid || null,
    });
    setDescricao(""); setValor(""); setApartamento(""); setBloco(""); setVencimento("");
    setSalvando(false);
    setMostrarFormulario(false);
    carregarCobrancas();
  }

  async function moradorMarcarPago(id) {
    if (!window.confirm("Confirma que realizou o pagamento? O síndico irá verificar.")) return;
    await updateDoc(doc(db, "cobrancas", id), { status: "aguardando_confirmacao" });
    carregarCobrancas();
  }

  async function sindicoConfirmar(id) {
    await updateDoc(doc(db, "cobrancas", id), { status: "pago", pagoEm: serverTimestamp() });
    carregarCobrancas();
  }

  async function sindicoRejeitar(id) {
    await updateDoc(doc(db, "cobrancas", id), { status: "pendente" });
    carregarCobrancas();
  }

  function formatarMoeda(v) {
    return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function formatarData(campo) {
    if (!campo) return "—";
    const d = campo.toDate ? campo.toDate() : new Date(campo);
    return d.toLocaleDateString("pt-BR");
  }

  function corStatus(status) {
    if (status === "pendente") return "#f59e0b";
    if (status === "aguardando_confirmacao") return "#38bdf8";
    if (status === "pago") return "#22c55e";
    if (status === "vencida") return "#ef4444";
    return "#64748b";
  }

  function labelStatus(status) {
    if (status === "pendente") return "Pendente";
    if (status === "aguardando_confirmacao") return "Aguardando confirmação";
    if (status === "pago") return "Pago";
    if (status === "vencida") return "Vencida";
    return status;
  }

  const cobrancasFiltradas = cobrancas.filter((c) => {
    if (filtro === "pendente") return c.status === "pendente" || c.status === "vencida";
    if (filtro === "aguardando") return c.status === "aguardando_confirmacao";
    if (filtro === "pago") return c.status === "pago";
    return true;
  });

  const totalPendente = cobrancas.filter((c) => c.status === "pendente" || c.status === "vencida").reduce((acc, c) => acc + (c.valor || 0), 0);
  const totalAguardando = cobrancas.filter((c) => c.status === "aguardando_confirmacao").reduce((acc, c) => acc + (c.valor || 0), 0);
  const totalPago = cobrancas.filter((c) => c.status === "pago").reduce((acc, c) => acc + (c.valor || 0), 0);

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ color: "#38bdf8", margin: 0 }}>Cobranças</h2>
        {podeGerenciar && (
          <button style={btnAzul} onClick={() => setMostrarFormulario(!mostrarFormulario)}>
            + Nova cobrança
          </button>
        )}
      </div>

      {/* Formulário */}
      {mostrarFormulario && podeGerenciar && (
        <div style={cardStyle}>
          <h3 style={{ color: "#f1f5f9", marginBottom: "16px" }}>Nova cobrança</h3>
          <input style={inp} placeholder="Descrição * (ex: Taxa de condomínio - Janeiro)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          <input style={inp} type="number" placeholder="Valor * (ex: 500.00)" value={valor} onChange={(e) => setValor(e.target.value)} />
          <div style={{ display: "flex", gap: "12px" }}>
            <input style={{ ...inp, flex: 1 }} placeholder="Bloco (ex: A)" value={bloco} onChange={(e) => setBloco(e.target.value)} />
            <input style={{ ...inp, flex: 1 }} placeholder="Apartamento *" value={apartamento} onChange={(e) => setApartamento(e.target.value)} />
          </div>
          <div>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "6px" }}>Data de vencimento *</p>
            <input style={inp} type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button style={btnAzul} onClick={criarCobranca} disabled={salvando}>
              {salvando ? "Salvando..." : "Criar cobrança"}
            </button>
            <button style={btnSecundario} onClick={() => setMostrarFormulario(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", borderTop: "3px solid #f59e0b" }}>
          <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0 }}>Pendentes</p>
          <h3 style={{ color: "#f59e0b", margin: "6px 0 0", fontSize: "1.1rem" }}>{formatarMoeda(totalPendente)}</h3>
        </div>
        <div style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", borderTop: "3px solid #38bdf8" }}>
          <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0 }}>Aguardando</p>
          <h3 style={{ color: "#38bdf8", margin: "6px 0 0", fontSize: "1.1rem" }}>{formatarMoeda(totalAguardando)}</h3>
        </div>
        <div style={{ background: "#1e293b", padding: "16px", borderRadius: "12px", borderTop: "3px solid #22c55e" }}>
          <p style={{ color: "#64748b", fontSize: "0.8rem", margin: 0 }}>Recebido</p>
          <h3 style={{ color: "#22c55e", margin: "6px 0 0", fontSize: "1.1rem" }}>{formatarMoeda(totalPago)}</h3>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[
          { id: "pendente", label: "Pendentes" },
          { id: "aguardando", label: "Aguardando confirmação" },
          { id: "pago", label: "Pagas" },
          { id: "todas", label: "Todas" },
        ].map((f) => (
          <button key={f.id} onClick={() => setFiltro(f.id)} style={{ padding: "6px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem", background: filtro === f.id ? "#38bdf8" : "#1e293b", color: filtro === f.id ? "#0f172a" : "#94a3b8" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cobrancasFiltradas.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center", marginTop: "32px" }}>Nenhuma cobrança encontrada.</p>
      )}

      {cobrancasFiltradas.map((c) => (
        <div key={c.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "12px", borderLeft: `4px solid ${corStatus(c.status)}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h4 style={{ color: "#f1f5f9", margin: "0 0 4px" }}>{c.descricao}</h4>
              <p style={infoStyle}>
                {c.bloco ? `Bloco ${c.bloco} — ` : ""}Apto {c.apartamento}
              </p>
              <p style={infoStyle}>📅 Vencimento: {formatarData(c.vencimento)}</p>
              {c.pagoEm && <p style={{ ...infoStyle, color: "#22c55e" }}>✅ Pago em: {formatarData(c.pagoEm)}</p>}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: corStatus(c.status), fontWeight: "bold", fontSize: "1.1rem", margin: "0 0 6px" }}>
                {formatarMoeda(c.valor)}
              </p>
              <span style={{ background: corStatus(c.status) + "22", color: corStatus(c.status), padding: "3px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>
                {labelStatus(c.status)}
              </span>
            </div>
          </div>

          {/* Ações do morador */}
          {perfil === "morador" && c.status === "pendente" && (
            <button onClick={() => moradorMarcarPago(c.id)} style={{ ...btnPequeno, color: "#22c55e", borderColor: "#22c55e", marginTop: "8px" }}>
              ✅ Marcar como pago
            </button>
          )}

          {/* Ações do síndico */}
          {podeGerenciar && c.status === "aguardando_confirmacao" && (
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button onClick={() => sindicoConfirmar(c.id)} style={{ ...btnPequeno, color: "#22c55e", borderColor: "#22c55e" }}>
                ✅ Confirmar pagamento
              </button>
              <button onClick={() => sindicoRejeitar(c.id)} style={{ ...btnPequeno, color: "#ef4444", borderColor: "#ef4444" }}>
                ❌ Rejeitar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const cardStyle = { background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "20px" };
const infoStyle = { color: "#94a3b8", margin: "0 0 4px", fontSize: "0.9rem" };
const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btnAzul = { padding: "10px 20px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "0.95rem" };
const btnSecundario = { padding: "10px 20px", background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem" };
const btnPequeno = { padding: "4px 12px", background: "transparent", border: "1px solid", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" };