import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function AchadosPerdidos({ perfil }) {
  const podeGerenciar = perfil === "sindico" || perfil === "admin_geral";
  const [itens, setItens] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("achado");
  const [local, setLocal] = useState("");
  const [contato, setContato] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => { carregarItens(); }, []);

  async function carregarItens() {
    const q = query(collection(db, "achados_perdidos"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setItens(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function publicarItem() {
    if (!titulo || !descricao) return;
    setSalvando(true);
    await addDoc(collection(db, "achados_perdidos"), {
      titulo, descricao, tipo, local, contato, status: "aberto", criado_em: serverTimestamp()
    });
    setTitulo(""); setDescricao(""); setTipo("achado"); setLocal(""); setContato("");
    setSucesso("Item publicado com sucesso!");
    setSalvando(false);
    carregarItens();
    setTimeout(() => setSucesso(""), 3000);
  }

  async function resolverItem(id) {
    await updateDoc(doc(db, "achados_perdidos", id), { status: "resolvido" });
    carregarItens();
  }

  async function excluirItem(id) {
    await deleteDoc(doc(db, "achados_perdidos", id));
    carregarItens();
  }

  const itensFiltrados = itens.filter((i) => {
    if (filtro === "achados") return i.tipo === "achado";
    if (filtro === "perdidos") return i.tipo === "perdido";
    if (filtro === "abertos") return i.status === "aberto";
    return true;
  });

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>Achados e Perdidos</h2>

      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Publicar item</h3>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button onClick={() => setTipo("achado")} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", background: tipo === "achado" ? "#22c55e" : "#0f172a", color: tipo === "achado" ? "#fff" : "#94a3b8" }}>Achado</button>
          <button onClick={() => setTipo("perdido")} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", background: tipo === "perdido" ? "#ef4444" : "#0f172a", color: tipo === "perdido" ? "#fff" : "#94a3b8" }}>Perdido</button>
        </div>
        <input style={inp} placeholder="O que foi achado/perdido? *" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <textarea style={{ ...inp, resize: "vertical" }} placeholder="Descricao detalhada *" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
        <input style={inp} placeholder="Local (opcional)" value={local} onChange={(e) => setLocal(e.target.value)} />
        <input style={inp} placeholder="Contato para devolver (opcional)" value={contato} onChange={(e) => setContato(e.target.value)} />
        {sucesso && <p style={{ color: "#22c55e", fontSize: "0.9rem", marginBottom: "8px" }}>{sucesso}</p>}
        <button style={btn} onClick={publicarItem} disabled={salvando}>{salvando ? "Publicando..." : "Publicar item"}</button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["todos", "achados", "perdidos", "abertos"].map((f) => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding: "6px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem", background: filtro === f ? "#38bdf8" : "#1e293b", color: filtro === f ? "#0f172a" : "#94a3b8" }}>
            {f === "todos" ? "Todos" : f === "achados" ? "Achados" : f === "perdidos" ? "Perdidos" : "Em aberto"}
          </button>
        ))}
      </div>

      <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Itens ({itensFiltrados.length})</h3>

      {itensFiltrados.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center" }}>Nenhum item encontrado.</p>
      )}

      {itensFiltrados.map((item) => (
        <div key={item.id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginBottom: "12px", borderLeft: "4px solid " + (item.tipo === "achado" ? "#22c55e" : "#ef4444") }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <h4 style={{ color: "#f1f5f9", margin: 0 }}>{item.titulo}</h4>
                <span style={{ background: item.tipo === "achado" ? "#22c55e22" : "#ef444422", color: item.tipo === "achado" ? "#22c55e" : "#ef4444", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold" }}>
                  {item.tipo === "achado" ? "Achado" : "Perdido"}
                </span>
              </div>
              <p style={{ color: "#94a3b8", margin: "0 0 4px", fontSize: "0.9rem" }}>{item.descricao}</p>
              {item.local && <p style={{ color: "#64748b", margin: "0 0 4px", fontSize: "0.85rem" }}>Local: {item.local}</p>}
              {item.contato && <p style={{ color: "#64748b", margin: 0, fontSize: "0.85rem" }}>Contato: {item.contato}</p>}
            </div>
            <span style={{ background: item.status === "resolvido" ? "#22c55e22" : "#f59e0b22", color: item.status === "resolvido" ? "#22c55e" : "#f59e0b", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
              {item.status === "resolvido" ? "Resolvido" : "Em aberto"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
            {item.status === "aberto" && (
              <button onClick={() => resolverItem(item.id)} style={{ padding: "4px 12px", background: "#22c55e", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}>
                Marcar como resolvido
              </button>
            )}
            {podeGerenciar && (
              <button onClick={() => excluirItem(item.id)} style={{ padding: "4px 12px", background: "transparent", color: "#475569", border: "1px solid #475569", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                Excluir
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btn = { padding: "10px 24px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", marginTop: "8px" };