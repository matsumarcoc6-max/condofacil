import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

const categorias = ["Emergência", "Manutenção", "Administração", "Outros"];

const corCategoria = {
  Emergência: "#ef4444",
  Manutenção: "#f59e0b",
  Administração: "#38bdf8",
  Outros: "#94a3b8",
};

export default function TelefonesUteis() {
  const [contatos, setContatos] = useState([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [categoria, setCategoria] = useState("Emergência");
  const [filtro, setFiltro] = useState("Todos");
  const [loading, setLoading] = useState(false);

  const carregar = async () => {
    const q = query(collection(db, "telefonesUteis"), orderBy("criadoEm", "desc"));
    const snap = await getDocs(q);
    setContatos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { carregar(); }, []);

  const publicar = async () => {
    if (!nome.trim() || !telefone.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "telefonesUteis"), {
      nome,
      telefone,
      categoria,
      criadoEm: serverTimestamp(),
    });
    setNome("");
    setTelefone("");
    setCategoria("Emergência");
    await carregar();
    setLoading(false);
  };

  const excluir = async (id) => {
    await deleteDoc(doc(db, "telefonesUteis", id));
    await carregar();
  };

  const filtrados =
    filtro === "Todos" ? contatos : contatos.filter((c) => c.categoria === filtro);

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>📞 Telefones Úteis</h2>

      {/* Formulário */}
      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Adicionar contato</h3>

        <input
          style={inp}
          placeholder="Nome do contato (ex: Portaria, Bombeiros...)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          style={inp}
          placeholder="Telefone (ex: (11) 99999-9999)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
        <select
          style={inp}
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          {categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <button style={btn} onClick={publicar} disabled={loading}>
          {loading ? "Salvando..." : "Adicionar contato"}
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        {["Todos", ...categorias].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "1px solid",
              borderColor: filtro === f ? (corCategoria[f] || "#38bdf8") : "#334155",
              background: filtro === f ? (corCategoria[f] || "#38bdf8") + "22" : "transparent",
              color: filtro === f ? (corCategoria[f] || "#38bdf8") : "#94a3b8",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length === 0 && (
        <p style={{ color: "#64748b", textAlign: "center", marginTop: "32px" }}>
          Nenhum contato cadastrado.
        </p>
      )}
      {filtrados.map((c) => (
        <div
          key={c.id}
          style={{
            background: "#1e293b",
            padding: "16px 20px",
            borderRadius: "12px",
            marginBottom: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderLeft: "4px solid " + (corCategoria[c.categoria] || "#94a3b8"),
          }}
        >
          <div>
            <p style={{ color: "#f1f5f9", margin: 0, fontWeight: "500" }}>{c.nome}</p>
            <p style={{ color: "#38bdf8", margin: "4px 0 0", fontSize: "0.85rem" }}>
              {c.telefone}
            </p>
            <span
              style={{
                background: (corCategoria[c.categoria] || "#94a3b8") + "22",
                color: corCategoria[c.categoria] || "#94a3b8",
                padding: "2px 8px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                display: "inline-block",
                marginTop: "6px",
              }}
            >
              {c.categoria}
            </span>
          </div>
          <button
            onClick={() => excluir(c.id)}
            style={{
              background: "transparent",
              border: "none",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "600",
            }}
          >
            Excluir
          </button>
        </div>
      ))}
    </div>
  );
}

const inp = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "8px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#f1f5f9",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const btn = {
  padding: "10px 24px",
  background: "#38bdf8",
  color: "#0f172a",
  border: "none",
  borderRadius: "8px",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "1rem",
  marginTop: "8px",
};