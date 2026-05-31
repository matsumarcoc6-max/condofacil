import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export default function VisitaPublica() {
  const { id } = useParams();
  const [visita, setVisita] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function buscar() {
      const q = query(collection(db, "agendaVisitas"), where("uuid", "==", id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setVisita({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
      setLoading(false);
    }
    buscar();
  }, [id]);

  const statusColor = (s) => {
    if (s === "confirmado") return "#22c55e";
    if (s === "cancelado") return "#ef4444";
    return "#f59e0b";
  };

  if (loading) return (
    <div style={pageStyle}>
      <p style={{ color: "#94a3b8" }}>Carregando...</p>
    </div>
  );

  if (!visita) return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h2 style={{ color: "#ef4444" }}>❌ Visita não encontrada</h2>
        <p style={{ color: "#94a3b8" }}>O link pode estar incorreto ou expirado.</p>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: "#38bdf8", marginBottom: "4px" }}>CondoFácil</h1>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "24px" }}>Comprovante de Visita Agendada</p>

        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "4px" }}>VISITANTE</p>
          <p style={{ color: "#f1f5f9", fontWeight: "bold", fontSize: "1.2rem" }}>{visita.nome}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div>
            <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "4px" }}>DATA</p>
            <p style={{ color: "#f1f5f9", fontWeight: "bold" }}>{visita.data}</p>
          </div>
          <div>
            <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "4px" }}>HORÁRIO</p>
            <p style={{ color: "#f1f5f9", fontWeight: "bold" }}>{visita.hora}</p>
          </div>
        </div>

        {visita.observacao && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "4px" }}>OBSERVAÇÃO</p>
            <p style={{ color: "#f1f5f9" }}>{visita.observacao}</p>
          </div>
        )}

        <div style={{ textAlign: "center" }}>
          <span style={{
            background: statusColor(visita.status), color: "#0f172a",
            padding: "8px 20px", borderRadius: "20px",
            fontWeight: "bold", fontSize: "0.9rem", letterSpacing: "1px",
          }}>
            {visita.status.toUpperCase()}
          </span>
        </div>

        {visita.status === "confirmado" && (
          <p style={{ color: "#22c55e", textAlign: "center", marginTop: "16px", fontSize: "0.9rem" }}>
            ✅ Entrada autorizada pelo porteiro
          </p>
        )}
        {visita.status === "cancelado" && (
          <p style={{ color: "#ef4444", textAlign: "center", marginTop: "16px", fontSize: "0.9rem" }}>
            ❌ Esta visita foi cancelada
          </p>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh", background: "#0f172a",
  display: "flex", justifyContent: "center", alignItems: "center", padding: "24px",
};

const cardStyle = {
  background: "#1e293b", borderRadius: "16px",
  padding: "32px", width: "100%", maxWidth: "420px",
};