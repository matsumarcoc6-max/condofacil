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

export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  async function carregarOcorrencias() {
    const q = query(collection(db, "ocorrencias"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setOcorrencias(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }

  async function registrarOcorrencia() {
    if (!titulo || !descricao) return;
    setSalvando(true);
    await addDoc(collection(db, "ocorrencias"), {
      titulo,
      descricao,
      prioridade,
      status: "aberta",
      criado_em: serverTimestamp(),
    });
    setTitulo("");
    setDescricao("");
    setPrioridade("media");
    setSalvando(false);
    carregarOcorrencias();
  }

  const corPrioridade = {
    alta: "#ef4444",
    media: "#f59e0b",
    baixa: "#22c55e",
  };

  const labelPrioridade = {
    alta: "Alta",
    media: "Média",
    baixa: "Baixa",
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>🚨 Ocorrências</h2>

      <div style={styles.card}>
        <h3 style={styles.subtitulo}>Registrar ocorrência</h3>
        <input
          style={styles.input}
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <textarea
          style={styles.textarea}
          placeholder="Descrição detalhada"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
        />
        <select
          style={styles.select}
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value)}
        >
          <option value="baixa">🟢 Prioridade Baixa</option>
          <option value="media">🟡 Prioridade Média</option>
          <option value="alta">🔴 Prioridade Alta</option>
        </select>
        <button
          style={styles.botao}
          onClick={registrarOcorrencia}
          disabled={salvando}
        >
          {salvando ? "Registrando..." : "Registrar ocorrência"}
        </button>
      </div>

      <div style={{ marginTop: "24px" }}>
        {ocorrencias.length === 0 && (
          <p style={styles.vazio}>Nenhuma ocorrência registrada ainda.</p>
        )}
        {ocorrencias.map((oc) => (
          <div
            key={oc.id}
            style={{
              ...styles.ocorrenciaCard,
              borderLeft: `4px solid ${corPrioridade[oc.prioridade]}`,
            }}
          >
            <div style={styles.ocorrenciaHeader}>
              <h4 style={styles.ocorrenciaTitulo}>{oc.titulo}</h4>
              <span
                style={{
                  ...styles.badge,
                  background: corPrioridade[oc.prioridade] + "22",
                  color: corPrioridade[oc.prioridade],
                }}
              >
                {labelPrioridade[oc.prioridade]}
              </span>
            </div>
            <p style={styles.ocorrenciaDescricao}>{oc.descricao}</p>
            <div style={styles.ocorrenciaFooter}>
              <span style={styles.status}>● {oc.status}</span>
              <span style={styles.data}>
                {oc.criado_em?.toDate().toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "24px" },
  titulo: { color: "#38bdf8", marginBottom: "20px" },
  subtitulo: { color: "#f1f5f9", marginBottom: "12px" },
  card: {
    background: "#1e293b",
    padding: "24px",
    borderRadius: "12px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#f1f5f9",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#f1f5f9",
    fontSize: "1rem",
    boxSizing: "border-box",
    resize: "vertical",
  },
  select: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#f1f5f9",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  botao: {
    padding: "10px 24px",
    background: "#38bdf8",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "1rem",
  },
  vazio: { color: "#64748b", textAlign: "center", marginTop: "24px" },
  ocorrenciaCard: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "12px",
  },
  ocorrenciaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  ocorrenciaTitulo: { color: "#f1f5f9", margin: 0 },
  badge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "bold",
  },
  ocorrenciaDescricao: { color: "#94a3b8", marginBottom: "12px" },
  ocorrenciaFooter: {
    display: "flex",
    justifyContent: "space-between",
  },
  status: { color: "#22c55e", fontSize: "0.85rem" },
  data: { color: "#475569", fontSize: "0.85rem" },
};