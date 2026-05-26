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
  const [rg, setRg] = useState("");
  const [acompanhantes, setAcompanhantes] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [motivo, setMotivo] = useState("");
  const [placa, setPlaca] = useState("");
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
      rg: rg || null,
      acompanhantes: acompanhantes || null,
      apartamento,
      motivo,
      placa: placa || null,
      entrada: serverTimestamp(),
      saida: null,
      status: "presente",
    });
    setNome("");
    setRg("");
    setAcompanhantes("");
    setApartamento("");
    setMotivo("");
    setPlaca("");
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
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>Visitantes</h2>

      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Registrar entrada</h3>

        <input style={inp} placeholder="Nome do visitante principal *" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input style={inp} placeholder="RG do visitante (opcional)" value={rg} onChange={(e) => setRg(e.target.value)} />
        <input style={inp} placeholder="Acompanhantes (opcional — ex: Maria Silva, Pedro Lima)" value={acompanhantes} onChange={(e) => setAcompanhantes(e.target.value)} />
        <input style={inp} placeholder="Apartamento destino (ex: 302) *" value={apartamento} onChange={(e) => setApartamento(e.target.value)} />
        <input style={inp} placeholder="Motivo da visita (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        <input style={inp} placeholder="Placa do veículo (opcional — ex: ABC1D23)" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} />

        <button style={btn} onClick={registrarEntrada} disabled={salvando}>
          {salvando ? "Registrando..." : "Registrar entrada"}
        </button>
      </div>

      <div style={{ marginTop: "24px" }}>
        {visitantes.length === 0 && (
          <p style={{ color: "#64748b", textAlign: "center" }}>Nenhum visitante registrado ainda.</p>
        )}
        {visitantes.map((v) => (
          <div key={v.id} style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "12px",
            borderLeft: `4px solid ${v.status === "presente" ? "#22c55e" : "#475569"}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <h4 style={{ color: "#f1f5f9", margin: 0, marginBottom: "4px" }}>{v.nome}</h4>
                {v.rg && (
                  <p style={{ color: "#94a3b8", margin: "0 0 4px", fontSize: "0.85rem" }}>
                    🪪 RG: {v.rg}
                  </p>
                )}
                {v.acompanhantes && (
                  <p style={{ color: "#94a3b8", margin: "0 0 4px", fontSize: "0.9rem" }}>
                    👥 Acompanhantes: {v.acompanhantes}
                  </p>
                )}
                <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.9rem" }}>
                  Apto {v.apartamento}{v.motivo ? ` — ${v.motivo}` : ""}
                </p>
                {v.placa && (
                  <p style={{ color: "#94a3b8", margin: "4px 0 0", fontSize: "0.85rem" }}>
                    🚗 Placa: {v.placa}
                  </p>
                )}
              </div>
              <span style={{
                background: v.status === "presente" ? "#22c55e22" : "#47556922",
                color: v.status === "presente" ? "#22c55e" : "#94a3b8",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "0.8rem",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}>
                {v.status === "presente" ? "● Presente" : "● Saiu"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#475569", fontSize: "0.85rem" }}>
                Entrada: {v.entrada?.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              {v.status === "presente" && (
                <button onClick={() => registrarSaida(v.id)} style={btnSaida}>
                  Registrar saída
                </button>
              )}
              {v.saida && (
                <span style={{ color: "#475569", fontSize: "0.85rem" }}>
                  Saída: {v.saida?.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inp = { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: "1rem", boxSizing: "border-box" };
const btn = { padding: "10px 24px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem", marginTop: "8px" };
const btnSaida = { padding: "6px 16px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" };