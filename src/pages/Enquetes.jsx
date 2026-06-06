import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection, addDoc, getDocs, orderBy, query,
  serverTimestamp, doc, updateDoc, deleteDoc,
} from "firebase/firestore";

export default function Enquetes({ perfil }) {
  const [enquetes, setEnquetes] = useState([]);
  const [pergunta, setPergunta] = useState("");
  const [opcoes, setOpcoes] = useState(["", ""]);
  const [salvando, setSalvando] = useState(false);
  const [filtro, setFiltro] = useState("ativas");

  const podeGerenciar = perfil === "sindico" || perfil === "admin_geral";

  useEffect(() => { carregarEnquetes(); }, []);

  async function carregarEnquetes() {
    const q = query(collection(db, "enquetes"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setEnquetes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function criarEnquete() {
    const opcoesFiltradas = opcoes.filter((o) => o.trim() !== "");
    if (!pergunta || opcoesFiltradas.length < 2) return;
    setSalvando(true);
    await addDoc(collection(db, "enquetes"), {
      pergunta,
      opcoes: opcoesFiltradas.map((o) => ({ texto: o, votos: [] })),
      ativa: true,
      criado_em: serverTimestamp(),
    });
    setPergunta("");
    setOpcoes(["", ""]);
    setSalvando(false);
    carregarEnquetes();
  }

  async function encerrarEnquete(id) {
    await updateDoc(doc(db, "enquetes", id), { ativa: false });
    carregarEnquetes();
  }

  async function excluirEnquete(id) {
    if (!window.confirm("Tem certeza que deseja excluir esta enquete? Esta ação não pode ser desfeita.")) return;
    await deleteDoc(doc(db, "enquetes", id));
    carregarEnquetes();
  }

  async function votar(enqueteId, opcaoIndex, enquete) {
    if (!enquete.ativa) return;
    const usuarioId = auth.currentUser?.uid || "anonimo";
    const jaVotou = enquete.opcoes.some((o) => o.votos.includes(usuarioId));
    if (jaVotou) return;
    const novasOpcoes = enquete.opcoes.map((o, i) => ({
      ...o,
      votos: i === opcaoIndex ? [...o.votos, usuarioId] : o.votos,
    }));
    await updateDoc(doc(db, "enquetes", enqueteId), { opcoes: novasOpcoes });
    carregarEnquetes();
  }

  function adicionarOpcao() {
    if (opcoes.length < 5) setOpcoes([...opcoes, ""]);
  }

  function totalVotos(opcoes) {
    return opcoes.reduce((acc, o) => acc + o.votos.length, 0);
  }

  const enquetesFiltradas = enquetes.filter((e) => {
    if (filtro === "ativas") return e.ativa;
    if (filtro === "encerradas") return !e.ativa;
    return true;
  });

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>Enquetes</h2>

      {/* Formulário — só para síndico e admin */}
      {podeGerenciar && (
        <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
          <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Nova enquete</h3>
          <input
            style={inp}
            placeholder="Pergunta da enquete"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
          />
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "8px" }}>Opções de resposta</p>
          {opcoes.map((opcao, i) => (
            <input
              key={i}
              style={inp}
              placeholder={"Opção " + (i + 1)}
              value={opcao}
              onChange={(e) => {
                const novas = [...opcoes];
                novas[i] = e.target.value;
                setOpcoes(novas);
              }}
            />
          ))}
          {opcoes.length < 5 && (
            <button onClick={adicionarOpcao} style={{ ...btn, background: "transparent", color: "#38bdf8", border: "1px solid #38bdf8", marginRight: "8px" }}>
              + Adicionar opção
            </button>
          )}
          <button style={btn} onClick={criarEnquete} disabled={salvando}>
            {salvando ? "Criando..." : "Criar enquete"}
          </button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {["ativas", "encerradas", "todas"].map((f) => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding: "6px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem", background: filtro === f ? "#38bdf8" : "#1e293b", color: filtro === f ? "#0f172a" : "#94a3b8" }}>
            {f === "ativas" ? "Ativas" : f === "encerradas" ? "Encerradas" : "Todas"}
          </button>
        ))}
      </div>

      {/* Lista */}
      {enquetesFiltradas.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center" }}>Nenhuma enquete encontrada.</p>
      )}
      {enquetesFiltradas.map((e) => {
        const total = totalVotos(e.opcoes);
        const usuarioId = auth.currentUser?.uid;
        const jaVotou = e.opcoes.some((o) => o.votos.includes(usuarioId));
        return (
          <div key={e.id} style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: "12px" }}>
              <h4 style={{ color: "#f1f5f9", margin: 0, flex: 1 }}>{e.pergunta}</h4>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <span style={{ background: e.ativa ? "#22c55e22" : "#47556922", color: e.ativa ? "#22c55e" : "#94a3b8", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>
                  {e.ativa ? "Ativa" : "Encerrada"}
                </span>
                {podeGerenciar && e.ativa && (
                  <button onClick={() => encerrarEnquete(e.id)} style={{ padding: "4px 12px", background: "transparent", color: "#f59e0b", border: "1px solid #f59e0b", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>
                    Encerrar
                  </button>
                )}
                {podeGerenciar && (
                  <button onClick={() => excluirEnquete(e.id)} style={{ padding: "4px 12px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>
                    Excluir
                  </button>
                )}
              </div>
            </div>

            {e.opcoes.map((opcao, i) => {
              const pct = total > 0 ? Math.round((opcao.votos.length / total) * 100) : 0;
              return (
                <div key={i} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ color: "#f1f5f9", fontSize: "0.95rem" }}>{opcao.texto}</span>
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{pct}% ({opcao.votos.length} voto{opcao.votos.length !== 1 ? "s" : ""})</span>
                  </div>
                  <div style={{ background: "#0f172a", borderRadius: "8px", overflow: "hidden", height: "8px", marginBottom: "6px" }}>
                    <div style={{ width: pct + "%", background: "#38bdf8", height: "100%", transition: "width 0.3s" }} />
                  </div>
                  {e.ativa && !jaVotou && (
                    <button onClick={() => votar(e.id, i, e)} style={{ ...btn, padding: "6px 16px", fontSize: "0.85rem", marginTop: "0" }}>
                      Votar
                    </button>
                  )}
                  {jaVotou && (
                    <span style={{ color: "#22c55e", fontSize: "0.8rem" }}>✓ Você votou</span>
                  )}
                </div>
              );
            })}

            <p style={{ color: "#475569", fontSize: "0.8rem", marginTop: "8px" }}>
              Total: {total} voto{total !== 1 ? "s" : ""} — {e.criado_em?.toDate().toLocaleDateString("pt-BR")}
            </p>
          </div>
        );
      })}
    </div>
  );
}

const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btn = { padding: "10px 24px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", marginTop: "8px" };