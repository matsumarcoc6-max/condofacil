import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, deleteDoc } from "firebase/firestore";

export default function Avisos() {
  const [avisos, setAvisos] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarAvisos();
  }, []);

  async function excluirAviso(id) {
    await deleteDoc(doc(db, "avisos", id));
    carregarAvisos();
  }

  async function carregarAvisos() {
    const q = query(collection(db, "avisos"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setAvisos(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }

  async function publicarAviso() {
    if (!titulo || !mensagem) return;
    setSalvando(true);
    await addDoc(collection(db, "avisos"), {
      titulo,
      mensagem,
      criado_em: serverTimestamp(),
    });
    setTitulo("");
    setMensagem("");
    setSalvando(false);
    carregarAvisos();
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>Avisos</h2>

      <div style={styles.card}>
        <h3 style={styles.subtitulo}>Novo aviso</h3>
        <input
          style={styles.input}
          placeholder="Titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <textarea
          style={styles.textarea}
          placeholder="Mensagem"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={4}
        />
        <button style={styles.botao} onClick={publicarAviso} disabled={salvando}>
          {salvando ? "Publicando..." : "Publicar aviso"}
        </button>
      </div>

      <div style={{ marginTop: "24px" }}>
        {avisos.length === 0 && (
          <p style={styles.vazio}>Nenhum aviso publicado ainda.</p>
        )}
        {avisos.map((aviso) => (
          <div key={aviso.id} style={styles.avisoCard}>
            <h4 style={styles.avisoTitulo}>{aviso.titulo}</h4>
            <p style={styles.avisoMensagem}>{aviso.mensagem}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ ...styles.avisoData, margin: 0 }}>
                {aviso.criado_em?.toDate().toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <button
                onClick={() => excluirAviso(aviso.id)}
                style={{ padding: "4px 12px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
              >
                Excluir
              </button>
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
  avisoCard: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "12px",
    borderLeft: "4px solid #38bdf8",
  },
  avisoTitulo: { color: "#f1f5f9", marginBottom: "8px" },
  avisoMensagem: { color: "#94a3b8", marginBottom: "8px" },
  avisoData: { color: "#475569", fontSize: "0.85rem" },
};