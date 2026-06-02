import { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function QrCodePage() {
  const [condominioId, setCondominioId] = useState(null);
  const [nomeCondominio, setNomeCondominio] = useState("");
  const [loading, setLoading] = useState(true);

  const url = condominioId
    ? `${window.location.origin}/v/${condominioId}`
    : null;

  useEffect(() => {
    async function carregar() {
      const snap = await getDocs(collection(db, "condominios"));
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        setCondominioId(docSnap.id);
        setNomeCondominio(docSnap.data().nome || "Condomínio");
      }
      setLoading(false);
    }
    carregar();
  }, []);

  function baixarQrCode() {
    const canvas = document.querySelector("#qrcode-canvas canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qrcode-condofacil.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (loading) return <p style={{ color: "#94a3b8", padding: "24px" }}>Carregando...</p>;

  if (!condominioId) return (
    <p style={{ color: "#f87171", padding: "24px" }}>
      Nenhum condomínio encontrado no banco de dados.
    </p>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>📲 QR Code de Acesso</h2>
      <p style={styles.subtitulo}>{nomeCondominio}</p>

      <div id="qrcode-canvas" style={styles.qrWrapper}>
        <QRCodeCanvas
          value={url}
          size={220}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="H"
          includeMargin={true}
        />
      </div>

      <p style={styles.urlTexto}>{url}</p>

      <button style={styles.botao} onClick={baixarQrCode}>
        ⬇️ Baixar QR Code
      </button>

      <p style={styles.dica}>
        Compartilhe este QR Code com visitantes para que registrem a entrada pelo celular, sem precisar de login.
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "480px",
    margin: "0 auto",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  titulo: {
    color: "#38bdf8",
    fontSize: "1.5rem",
    margin: 0,
  },
  subtitulo: {
    color: "#94a3b8",
    fontSize: "0.9rem",
    margin: 0,
  },
  qrWrapper: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "12px",
    boxShadow: "0 0 24px rgba(56,189,248,0.15)",
  },
  urlTexto: {
    color: "#64748b",
    fontSize: "0.75rem",
    wordBreak: "break-all",
    textAlign: "center",
    margin: 0,
  },
  botao: {
    padding: "12px 24px",
    background: "#38bdf8",
    color: "#0f172a",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
  },
  dica: {
    color: "#64748b",
    fontSize: "0.8rem",
    textAlign: "center",
    maxWidth: "360px",
    lineHeight: "1.5",
    margin: 0,
  },
};