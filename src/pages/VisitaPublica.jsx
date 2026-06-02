import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { QRCodeSVG } from "qrcode.react";

export default function VisitaPublica() {
  const { id } = useParams();
  const [visita, setVisita] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function buscar() {
      const ref = doc(db, "visitas", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setVisita({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    }
    buscar();
  }, [id]);

  function formatarDataHora(campo) {
    if (!campo) return "—";
    const d = campo.toDate ? campo.toDate() : new Date(campo);
    return d.toLocaleDateString("pt-BR") + " às " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  const qrUrl = `${window.location.origin}/v/${id}`;

  if (loading) return (
    <div style={pageStyle}>
      <p style={{ color: "#94a3b8" }}>Carregando...</p>
    </div>
  );

  if (!visita) return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h2 style={{ color: "#ef4444", marginBottom: "8px" }}>❌ Visita não encontrada</h2>
        <p style={{ color: "#94a3b8" }}>O link pode estar incorreto ou expirado.</p>
      </div>
    </div>
  );

  if (visita.status === "cancelado" || visita.status === "expirado") return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: "#38bdf8", marginBottom: "4px" }}>CondoFácil</h1>
        <h2 style={{ color: "#ef4444", margin: "24px 0 8px" }}>
          {visita.status === "cancelado" ? "❌ Visita cancelada" : "⏱️ QR code expirado"}
        </h2>
        <p style={{ color: "#94a3b8" }}>Este link não pode mais ser utilizado.</p>
      </div>
    </div>
  );

  if (visita.status === "dentro" || visita.status === "finalizado") return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: "#38bdf8", marginBottom: "4px" }}>CondoFácil</h1>
        <h2 style={{ color: "#22c55e", margin: "24px 0 8px" }}>✅ Entrada já registrada</h2>
        <p style={{ color: "#94a3b8" }}>Este QR code já foi utilizado na portaria.</p>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: "#38bdf8", marginBottom: "4px", textAlign: "center" }}>CondoFácil</h1>
        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "24px", textAlign: "center" }}>
          Mostre este QR code na portaria
        </p>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ display: "inline-block", background: "#fff", padding: "16px", borderRadius: "12px" }}>
            <QRCodeSVG value={qrUrl} size={200} bgColor="#ffffff" fgColor="#0f172a" level="H" />
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <p style={label}>VISITANTE</p>
          <p style={valor}>{visita.nome}</p>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <p style={label}>APARTAMENTO DESTINO</p>
          <p style={valor}>Apto {visita.apartamento}</p>
        </div>

        {visita.dataHoraAgendada && (
          <div style={{ marginBottom: "16px" }}>
            <p style={label}>AGENDADO PARA</p>
            <p style={valor}>{formatarDataHora(visita.dataHoraAgendada)}</p>
          </div>
        )}

        {visita.motivo && (
          <div style={{ marginBottom: "16px" }}>
            <p style={label}>MOTIVO</p>
            <p style={valor}>{visita.motivo}</p>
          </div>
        )}

        {visita.placa && (
          <div style={{ marginBottom: "16px" }}>
            <p style={label}>VEÍCULO</p>
            <p style={valor}>🚗 {visita.placa}</p>
          </div>
        )}

        <p style={{ color: "#475569", fontSize: "0.75rem", textAlign: "center", marginTop: "24px" }}>
          Válido apenas no horário agendado. Não compartilhe este link.
        </p>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#0f172a",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "24px",
};

const cardStyle = {
  background: "#1e293b",
  borderRadius: "16px",
  padding: "32px",
  width: "100%",
  maxWidth: "420px",
};

const label = { color: "#64748b", fontSize: "0.75rem", marginBottom: "4px", letterSpacing: "0.05em" };
const valor = { color: "#f1f5f9", fontWeight: "bold", fontSize: "1rem", margin: 0 };