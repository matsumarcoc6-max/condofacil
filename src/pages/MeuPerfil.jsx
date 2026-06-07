import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

export default function MeuPerfil({ user, perfil, dadosUsuario }) {
  const [solicitando, setSolicitando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  async function solicitarExclusao() {
    if (!window.confirm(
      "Tem certeza que deseja solicitar a exclusão dos seus dados?\n\n" +
      "Sua solicitação será analisada pelo administrador em até 15 dias.\n" +
      "Após a exclusão, você perderá acesso ao sistema."
    )) return;

    setSolicitando(true);
    setErro("");
    setSucesso("");

    try {
      // Verifica se já tem solicitação pendente
      const q = query(
        collection(db, "solicitacoes_exclusao"),
        where("uid", "==", user.uid),
        where("status", "==", "pendente")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setErro("Você já tem uma solicitação de exclusão pendente.");
        setSolicitando(false);
        return;
      }

      await addDoc(collection(db, "solicitacoes_exclusao"), {
        uid: user.uid,
        nome: dadosUsuario?.nome || "",
        email: user.email,
        apartamento: dadosUsuario?.apartamento || "",
        bloco: dadosUsuario?.bloco || "",
        perfil: perfil,
        status: "pendente",
        criado_em: serverTimestamp(),
      });

      setSucesso("Solicitação enviada com sucesso. O administrador entrará em contato em até 15 dias.");
    } catch (e) {
      setErro("Erro ao enviar solicitação: " + e.message);
    }

    setSolicitando(false);
  }

  return (
    <div style={{ padding: "24px", maxWidth: "600px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "24px" }}>Meu Perfil</h2>

      {/* Dados do usuário */}
      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "16px" }}>Dados cadastrais</h3>

        <Campo label="Nome" valor={dadosUsuario?.nome || "—"} />
        <Campo label="E-mail" valor={user?.email || "—"} />
        <Campo label="Apartamento" valor={dadosUsuario?.apartamento || "—"} />
        <Campo label="Bloco" valor={dadosUsuario?.bloco || "—"} />
        <Campo label="Perfil" valor={perfil || "—"} />
      </div>

      {/* LGPD */}
      <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
        <h3 style={{ color: "#f1f5f9", marginBottom: "8px" }}>Privacidade e dados</h3>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "16px", lineHeight: "1.6" }}>
          De acordo com a LGPD (Lei nº 13.709/2018), você tem direito à exclusão dos seus dados pessoais do sistema.
          Ao solicitar, o administrador analisará o pedido em até 15 dias.
        </p>

        <button
          onClick={() => window.open("/privacidade", "_blank")}
          style={{ padding: "8px 16px", background: "transparent", color: "#38bdf8", border: "1px solid #38bdf8", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", marginBottom: "16px" }}
        >
          📄 Ver Política de Privacidade
        </button>

        {sucesso && (
          <div style={{ background: "#22c55e22", border: "1px solid #22c55e", borderRadius: "8px", padding: "12px 16px", marginBottom: "12px" }}>
            <p style={{ color: "#22c55e", margin: 0, fontSize: "0.9rem" }}>✅ {sucesso}</p>
          </div>
        )}

        {erro && (
          <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: "8px", padding: "12px 16px", marginBottom: "12px" }}>
            <p style={{ color: "#ef4444", margin: 0, fontSize: "0.9rem" }}>❌ {erro}</p>
          </div>
        )}

        <button
          onClick={solicitarExclusao}
          disabled={solicitando || !!sucesso}
          style={{ padding: "10px 20px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "8px", cursor: solicitando || sucesso ? "not-allowed" : "pointer", fontSize: "0.9rem", fontWeight: "bold", opacity: solicitando || sucesso ? 0.6 : 1 }}
        >
          {solicitando ? "Enviando..." : "🗑️ Solicitar exclusão dos meus dados"}
        </button>
      </div>
    </div>
  );
}

function Campo({ label, valor }) {
  return (
    <div style={{ display: "flex", gap: "12px", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #334155" }}>
      <span style={{ color: "#64748b", fontSize: "0.9rem", minWidth: "100px" }}>{label}</span>
      <span style={{ color: "#f1f5f9", fontSize: "0.9rem" }}>{valor}</span>
    </div>
  );
}