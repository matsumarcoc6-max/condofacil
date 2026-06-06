import { useState, useEffect } from "react";

export default function BannerInstalarIOS() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    const jaFechou = localStorage.getItem("bannerIOSFechado");
    if (isIOS && !isStandalone && !jaFechou) {
      setVisivel(true);
    }
  }, []);

  function fechar() {
    localStorage.setItem("bannerIOSFechado", "1");
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "#1e293b", borderTop: "2px solid #38bdf8",
      padding: "16px 20px", display: "flex", alignItems: "flex-start",
      gap: "12px", boxShadow: "0 -4px 20px rgba(0,0,0,0.4)"
    }}>
      <span style={{ fontSize: "1.8rem" }}>📲</span>
      <div style={{ flex: 1 }}>
        <p style={{ color: "#f1f5f9", fontWeight: "bold", margin: "0 0 4px", fontSize: "0.95rem" }}>
          Instale o CondoFácil para receber notificações
        </p>
        <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.85rem" }}>
          No Safari, toque em <strong style={{ color: "#38bdf8" }}>Compartilhar</strong> (ícone de seta) e depois em{" "}
          <strong style={{ color: "#38bdf8" }}>"Adicionar à Tela de Início"</strong>.
        </p>
      </div>
      <button onClick={fechar} style={{
        background: "transparent", border: "none", color: "#64748b",
        fontSize: "1.3rem", cursor: "pointer", padding: "0 4px"
      }}>✕</button>
    </div>
  );
}