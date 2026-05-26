import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function Dashboard({ condominio }) {
 const [stats, setStats] = useState({
    totalAvisos: 0,
    totalOcorrencias: 0,
    ocorrenciasAbertas: 0,
    totalReservas: 0,
    visitantesPresentes: 0,
    totalDocumentos: 0,
    totalVeiculos: 0,
totalPets: 0,
enquetesAtivas: 0,
    totalReceitas: 0,
    totalDespesas: 0,
    veiculosAlerta: [],
  });

  useEffect(() => {
    carregarStats();
  }, []);

  async function carregarStats() {
    const [avisos, ocorrencias, ocorrenciasAbertas, reservas, visitantes, documentos, financeiro, veiculos, pets, enquetesAtivas, veiculosVisitantes] =
      await Promise.all([
        getDocs(collection(db, "avisos")),
        getDocs(collection(db, "ocorrencias")),
        getDocs(query(collection(db, "ocorrencias"), where("status", "==", "aberta"))),
        getDocs(collection(db, "reservas")),
        getDocs(query(collection(db, "visitantes"), where("status", "==", "presente"))),
        getDocs(collection(db, "documentos")),
        getDocs(collection(db, "financeiro")),
        getDocs(collection(db, "veiculos")),
        getDocs(collection(db, "pets")),
        getDocs(query(collection(db, "enquetes"), where("ativa", "==", true))),
        getDocs(query(collection(db, "visitantes"), where("status", "==", "presente"))),
      ]);

    const agora = new Date();
    const veiculosAlerta = veiculosVisitantes.docs
      .filter((d) => {
        const dados = d.data();
        if (!dados.placa || !dados.entrada) return false;
        const entrada = dados.entrada.toDate();
        const horas = (agora - entrada) / (1000 * 60 * 60);
        return horas >= 24;
      })
      .map((d) => d.data());

    const lancamentos = financeiro.docs.map((d) => d.data());
    const totalReceitas = lancamentos.filter((l) => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
    const totalDespesas = lancamentos.filter((l) => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);

    setStats({
      totalAvisos: avisos.size,
      totalOcorrencias: ocorrencias.size,
      ocorrenciasAbertas: ocorrenciasAbertas.size,
      totalReservas: reservas.size,
      visitantesPresentes: visitantes.size,
      totalDocumentos: documentos.size,
      totalVeiculos: veiculos.size,
      totalPets: pets.size,
      enquetesAtivas: enquetesAtivas.size,
      totalReceitas,
      totalDespesas,
      veiculosAlerta,
    });
  }

    const lancamentos = financeiro.docs.map((d) => d.data());
    const totalReceitas = lancamentos.filter((l) => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
    const totalDespesas = lancamentos.filter((l) => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);

    setStats({
      totalAvisos: avisos.size,
      totalOcorrencias: ocorrencias.size,
      ocorrenciasAbertas: ocorrenciasAbertas.size,
      totalReservas: reservas.size,
      visitantesPresentes: visitantes.size,
      totalDocumentos: documentos.size,
      totalReceitas,
      totalDespesas,
    });
  }

  function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const saldo = stats.totalReceitas - stats.totalDespesas;

  const cards = [
    { label: "Avisos publicados", valor: stats.totalAvisos, cor: "#38bdf8", icone: "📢" },
    { label: "Ocorrencias abertas", valor: stats.ocorrenciasAbertas, cor: "#ef4444", icone: "🚨" },
    { label: "Reservas realizadas", valor: stats.totalReservas, cor: "#a78bfa", icone: "📅" },
    { label: "Visitantes presentes", valor: stats.visitantesPresentes, cor: "#22c55e", icone: "👥" },
    { label: "Documentos", valor: stats.totalDocumentos, cor: "#f59e0b", icone: "📄" },
    { label: "Veiculos cadastrados", valor: stats.totalVeiculos, cor: "#38bdf8", icone: "🚗" },
{ label: "Animais cadastrados", valor: stats.totalPets, cor: "#a78bfa", icone: "🐾" },
{ label: "Enquetes ativas", valor: stats.enquetesAtivas, cor: "#22c55e", icone: "📊" },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "4px" }}>Dashboard</h2>
      {condominio && (
        <p style={{ color: "#64748b", marginBottom: "24px", fontSize: "0.9rem" }}>
          {condominio.nome} — visao geral
        </p>
      )}

      {/* Cards de metricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {cards.map((card) => (
          <div key={card.label} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "3px solid " + card.cor }}>
            <p style={{ fontSize: "1.8rem", margin: 0 }}>{card.icone}</p>
            <h3 style={{ color: card.cor, fontSize: "2rem", margin: "8px 0 4px" }}>{card.valor}</h3>
            <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Resumo financeiro */}
      <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>Resumo financeiro</h3>
      <div style={{ display: "grid",gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "3px solid #22c55e" }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Receitas</p>
          <h3 style={{ color: "#22c55e", margin: "8px 0 0", fontSize: "1.3rem" }}>{formatarMoeda(stats.totalReceitas)}</h3>
        </div>
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "3px solid #ef4444" }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Despesas</p>
          <h3 style={{ color: "#ef4444", margin: "8px 0 0", fontSize: "1.3rem" }}>{formatarMoeda(stats.totalDespesas)}</h3>
        </div>
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "3px solid " + (saldo >= 0 ? "#38bdf8" : "#ef4444") }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Saldo</p>
          <h3 style={{ color: saldo >= 0 ? "#38bdf8" : "#ef4444", margin: "8px 0 0", fontSize: "1.3rem" }}>{formatarMoeda(saldo)}</h3>
        </div>
      </div>

      {/* Alertas */}
      {stats.ocorrenciasAbertas > 0 && (
        <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: "12px", padding: "16px 20px" }}>
          <p style={{ color: "#ef4444", margin: 0, fontWeight: "bold" }}>
            🚨 {stats.ocorrenciasAbertas} ocorrencia{stats.ocorrenciasAbertas !== 1 ? "s" : ""} em aberto — requer atencao.
          </p>
        </div>
      )}
      {stats.veiculosAlerta && stats.veiculosAlerta.length > 0 && (
          <div style={{ background: "#f59e0b22", border: "1px solid #f59e0b", borderRadius: "12px", padding: "16px 20px", marginTop: "12px" }}>
            <p style={{ color: "#f59e0b", margin: "0 0 8px", fontWeight: "bold" }}>
              🚗 {stats.veiculosAlerta.length} veiculo{stats.veiculosAlerta.length !== 1 ? "s" : ""} de visitante ha mais de 24h — verificar
            </p>
            {stats.veiculosAlerta.map((v, i) => (
              <p key={i} style={{ color: "#94a3b8", margin: "4px 0", fontSize: "0.85rem" }}>
                Placa {v.placa} — Apto {v.apartamento} — {v.nome}
              </p>
            ))}
          </div>
        )}
    </div>
  );
}
