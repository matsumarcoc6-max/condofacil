import QRCode from "qrcode.react";

export default function QrCodePage() {
  const url = "https://condofacil-lemon.vercel.app/";

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "20px" }}>QR Code do Sistema</h2>

      <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", display: "inline-block" }}>
        <QRCode value={url} size={220} />
      </div>

      <p style={{ color: "#94a3b8", marginTop: "16px", fontSize: "0.9rem" }}>{url}</p>
    </div>
  );
}