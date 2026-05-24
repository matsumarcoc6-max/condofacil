import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function Visitantes() {
  const [visitantes, setVisitantes] = useState([]);
  const [nome, setNome] = useState("");
  const [acompanhantes, setAcompanhantes] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarVisitantes();
  }, []);

  async function carregarVisitantes() {
    const q = query(collection(db, "visitantes"), orderBy("entrada", "desc"));
    const snap = await getDocs(q);
    setVisitantes(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }

  async function registrarEntrada() {
    if (!nome || !apartamento) return;
    setSalvando(true);
    await addDoc(collection(db, "visitantes"), {
      nome,
      acompanhantes: acompanhantes || null,
      apartamento,
      motivo,
      entrada: serverTimestamp(),
      saida: null,
      status: "presente",
    });
    setNome("");
    setAcompanhantes("");
    setApartamento("");
    setMotivo("");
    setSalvando(false);
    carregarVisitantes();
  }

  async function registrarSaida(id) {
    const ref = doc(db, "visitantes", id);
    await updateDoc(ref, {
      saida: serverTimestamp(),
      status: "saiu",
    });
    carregarVisitantes();
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>👥 Visitantes</h2>

      <div style={styles.card}>
        <h3 style={styles.subtitulo}>Registrar entrada</h3>
        <input
          style={styles.input}
          placeholder="Nome do visitante principal"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Acompanhantes (opcional — ex: Maria Silva, Pedro Lima)"
          value={acompanhantes}
          onChange={(e) => setAcompanhantes(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Apartamento destino (ex: 302)"
          value={apartamento}
          onChange={(e) => setApartamento(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Motivo da visita (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
        <button
          style={styles.botao}
          onClick={registrarEntrada}
          disabled={salvando}
        >
          {salvando ? "Registrando..." : "Registrar entrada"}
        </button>
      </div>

      <div style={{ marginTop: "24px" }}>
        {visitantes.length === 0 && (
          <p style={styles.vazio}>Nenhum visitante registrado ainda.</p>
        )}
        {visitantes.map((v) => (
          <div key={v.id} style={{
            ...styles.visitanteCard,
            borderLeft: `4px solid ${v.status === "presente" ? "#22c55e" : "#475569"}`,
          }}>
            <div style={styles.visitanteHeader}>
              <div>
                <h4 style={styles.visitanteNome}>{v.nome}</h4>
                {v.acompanhantes && (
                  <p style={styles.acompanhantes}>
                    👥 Acompanhantes: {v.acompanhantes}
                  </p>
                )}
                <p style={styles.visitanteInfo}>
                  Apto {v.apartamento}
                  {v.motivo ? ` — ${v.motivo}` : ""}
                </p>
              </div>
              <span style={{
                ...styles.badge,
                background: v.status === "presente" ? "#22c55e22" : "#47556922",
                color: v.status === "presente" ? "#22c55e" : "#94a3b8",
              }}>
                {v.status === "presente" ? "● Presente" : "● Saiu"}
              </span>
            </div>
            <div style={styles.visitanteFooter}>
              <span style={styles.data}>
                Entrada:{" "}
                {v.entrada?.toDate().toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {v.status === "presente" && (
                <button
                  style={styles.botaoSaida}
                  onClick={() => registrarSaida(v.id)}
                >
                  Registrar saída
                </button>
              )}
              {v.saida && (
                <span style={styles.data}>
                  Saída:{" "}
                  {v.saida?.toDate().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
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
  visitanteCard: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "12px",
  },
  visitanteHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  visitanteNome: { color: "#f1f5f9", margin: 0, marginBottom: "4px" },
  acompanhantes: { color: "#94a3b8", margin: 0, marginBottom: "4px", fontSize: "0.9rem" },
  visitanteInfo: { color: "#94a3b8", margin: 0, fontSize: "0.9rem" },
  badge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  visitanteFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  data: { color: "#475569", fontSize: "0.85rem" },
  botaoSaida: {
    padding: "6px 16px",
    background: "transparent",
    color: "#ef4444",
    border: "1px solid #ef4444",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};