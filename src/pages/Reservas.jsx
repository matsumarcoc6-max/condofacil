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

export default function Reservas() {
  const [reservas, setReservas] = useState([]);
  const [area, setArea] = useState("Salão de Festas");
  const [apartamento, setApartamento] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [data, setData] = useState("");
  const [horarioInicio, setHorarioInicio] = useState("");
  const [horarioFim, setHorarioFim] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const areas = [
    "Salão de Festas",
    "Churrasqueira",
    "Quadra Esportiva",
    "Piscina",
    "Espaço Gourmet",
    "Academia",
  ];

  useEffect(() => {
    carregarReservas();
  }, []);

  async function carregarReservas() {
    const q = query(collection(db, "reservas"), orderBy("criado_em", "desc"));
    const snap = await getDocs(q);
    setReservas(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }

  async function cancelarReserva(id) {
    const ref = doc(db, "reservas", id);
    await updateDoc(ref, { status: "cancelada" });
    carregarReservas();
  }

  async function realizarReserva() {
    if (!apartamento || !responsavel || !data || !horarioInicio || !horarioFim) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    // Verificar conflito de horário
    const conflito = reservas.find(
      (r) =>
        r.area === area &&
        r.data === data &&
        r.status !== "cancelada" &&
        !(horarioFim <= r.horarioInicio || horarioInicio >= r.horarioFim)
    );

    if (conflito) {
      setErro(`Conflito de horário com reserva existente (${conflito.horarioInicio} - ${conflito.horarioFim}).`);
      return;
    }

    setErro("");
    setSalvando(true);
    await addDoc(collection(db, "reservas"), {
      area,
      apartamento,
      responsavel,
      data,
      horarioInicio,
      horarioFim,
      observacao,
      status: "confirmada",
      criado_em: serverTimestamp(),
    });
    setApartamento("");
    setResponsavel("");
    setData("");
    setHorarioInicio("");
    setHorarioFim("");
    setObservacao("");
    setSalvando(false);
    carregarReservas();
  }

  const corStatus = {
    confirmada: "#22c55e",
    pendente: "#f59e0b",
    cancelada: "#ef4444",
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>📅 Reservas</h2>

      <div style={styles.card}>
        <h3 style={styles.subtitulo}>Nova reserva</h3>

        <select
          style={styles.input}
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <input
          style={styles.input}
          placeholder="Apartamento (ex: 302)"
          value={apartamento}
          onChange={(e) => setApartamento(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Nome do responsável"
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
        />

        <input
          style={styles.input}
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />

        <div style={styles.horarios}>
          <input
            style={{ ...styles.input, marginRight: "8px" }}
            type="time"
            value={horarioInicio}
            onChange={(e) => setHorarioInicio(e.target.value)}
            placeholder="Início"
          />
          <input
            style={styles.input}
            type="time"
            value={horarioFim}
            onChange={(e) => setHorarioFim(e.target.value)}
            placeholder="Fim"
          />
        </div>

        <input
          style={styles.input}
          placeholder="Observação (opcional)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />

        {erro && <p style={styles.erro}>{erro}</p>}

        <button
          style={styles.botao}
          onClick={realizarReserva}
          disabled={salvando}
        >
          {salvando ? "Reservando..." : "Confirmar reserva"}
        </button>
      </div>

      <div style={{ marginTop: "24px" }}>
        {reservas.length === 0 && (
          <p style={styles.vazio}>Nenhuma reserva registrada ainda.</p>
        )}
        {reservas.map((r) => (
          <div
            key={r.id}
            style={{
              ...styles.reservaCard,
              borderLeft: `4px solid ${corStatus[r.status] || "#38bdf8"}`,
            }}
          >
            <div style={styles.reservaHeader}>
              <div>
                <h4 style={styles.reservaTitulo}>{r.area}</h4>
                <p style={styles.reservaInfo}>
                  Apto {r.apartamento} — {r.responsavel}
                </p>
              </div>
              <span
                style={{
                  ...styles.badge,
                  background: (corStatus[r.status] || "#38bdf8") + "22",
                  color: corStatus[r.status] || "#38bdf8",
                }}
              >
                {r.status}
              </span>
            </div>
            <div style={styles.reservaFooter}>
              <span style={styles.data}>
                📅 {r.data} — {r.horarioInicio} às {r.horarioFim}
              </span>
              {r.observacao && (
                <span style={styles.obs}>💬 {r.observacao}</span>
              )}
              {r.status !== "cancelada" && (
                <button
                  onClick={() => cancelarReserva(r.id)}
                  style={{ padding: "4px 12px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  Cancelar
                </button>
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
  horarios: {
    display: "flex",
    marginBottom: "0px",
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
    marginTop: "8px",
  },
  erro: { color: "#ef4444", fontSize: "0.9rem", marginBottom: "8px" },
  vazio: { color: "#64748b", textAlign: "center", marginTop: "24px" },
  reservaCard: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "12px",
  },
  reservaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  reservaTitulo: { color: "#f1f5f9", margin: 0, marginBottom: "4px" },
  reservaInfo: { color: "#94a3b8", margin: 0, fontSize: "0.9rem" },
  badge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    textTransform: "capitalize",
  },
  reservaFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },
  data: { color: "#475569", fontSize: "0.85rem" },
  obs: { color: "#64748b", fontSize: "0.85rem" },
};