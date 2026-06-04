import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

export default function Dashboard({ condominio }) {
  const [stats, setStats] = useState({
    totalAvisos: 0, totalOcorrencias: 0, ocorrenciasAbertas: 0,
    totalReservas: 0, visitantesPresentes: 0, totalDocumentos: 0,
    totalVeiculos: 0, totalPets: 0, enquetesAtivas: 0, agendaHoje: 0,
    totalReceitas: 0, totalDespesas: 0, totalMoradores: 0, totalAchados: 0,
    veiculosAlerta: [],
  });
  const [dadosMensais, setDadosMensais] = useState([]);
  const [dadosOcorrencias, setDadosOcorrencias] = useState([]);

  useEffect(() => { carregarStats(); }, []);

  async function carregarStats() {
    try {
      const [
        avisos, ocorrencias, ocorrenciasAbertas, reservas, visitantes,
        documentos, financeiro, veiculos, pets, enquetesAtivas,
        agendaHoje, moradores, achadosPerdidos, visitas,
      ] = await Promise.all([
        getDocs(collection(db, "avisos")),
        getDocs(collection(db, "ocorrencias")),
        getDocs(query(collection(db, "ocorrencias"), where("status", "==", "aberta"))),
        getDocs(collection(db, "reservas")),
        getDocs(query(collection(db, "visitas"), where("status", "==", "dentro"))),
        getDocs(collection(db, "documentos")),
        getDocs(collection(db, "financeiro")),
        getDocs(collection(db, "veiculos")),
        getDocs(collection(db, "pets")),
        getDocs(query(collection(db, "enquetes"), where("ativa", "==", true))),
        getDocs(query(collection(db, "visitas"), where("dataHoraAgendada", "!=", null))),
        getDocs(collection(db, "usuarios")),
        getDocs(collection(db, "achados_perdidos")),
        getDocs(query(collection(db, "visitas"), where("status", "==", "dentro"))),
      ]);

      const lancamentos = financeiro.docs.map((d) => d.data());
      const totalReceitas = lancamentos.filter((l) => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
      const totalDespesas = lancamentos.filter((l) => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);

      // Gráfico mensal — últimos 6 meses
      const meses = [];
      const agora = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        meses.push({
          mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
          ano: d.getFullYear(),
          mesNum: d.getMonth(),
          receitas: 0,
          despesas: 0,
        });
      }

      lancamentos.forEach((l) => {
        if (!l.criado_em) return;
        const d = l.criado_em.toDate ? l.criado_em.toDate() : new Date(l.criado_em);
        const entry = meses.find((m) => m.ano === d.getFullYear() && m.mesNum === d.getMonth());
        if (!entry) return;
        if (l.tipo === "receita") entry.receitas += l.valor;
        if (l.tipo === "despesa") entry.despesas += l.valor;
      });
      setDadosMensais(meses);

      // Gráfico ocorrências por status
      const statusCount = {};
      ocorrencias.docs.forEach((d) => {
        const s = d.data().status || "sem status";
        statusCount[s] = (statusCount[s] || 0) + 1;
      });
      setDadosOcorrencias(Object.entries(statusCount).map(([name, value]) => ({ name, value })));

      setStats({
        totalAvisos: avisos.size,
        totalOcorrencias: ocorrencias.size,
        ocorrenciasAbertas: ocorrenciasAbertas.size,
        totalReservas: reservas.size,
        visitantesPresentes: visitas.size,
        totalDocumentos: documentos.size,
        totalVeiculos: veiculos.size,
        totalPets: pets.size,
        enquetesAtivas: enquetesAtivas.size,
        agendaHoje: agendaHoje.size,
        totalReceitas,
        totalDespesas,
        totalMoradores: moradores.size,
        totalAchados: achadosPerdidos.size,
        veiculosAlerta: [],
      });
    } catch (erro) {
      console.error("Erro ao carregar stats:", erro);
    }
  }

  function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const saldo = stats.totalReceitas - stats.totalDespesas;

  const cards = [
    { label: "Moradores", valor: stats.totalMoradores, cor: "#3b82f6", icone: "🏠" },
    { label: "Visitantes presentes", valor: stats.visitantesPresentes, cor: "#22c55e", icone: "👥" },
    { label: "Veículos", valor: stats.totalVeiculos, cor: "#06b6d4", icone: "🚗" },
    { label: "Animais", valor: stats.totalPets, cor: "#a78bfa", icone: "🐾" },
    { label: "Avisos", valor: stats.totalAvisos, cor: "#38bdf8", icone: "📢" },
    { label: "Ocorrências abertas", valor: stats.ocorrenciasAbertas, cor: "#ef4444", icone: "🚨" },
    { label: "Reservas", valor: stats.totalReservas, cor: "#8b5cf6", icone: "📅" },
    { label: "Documentos", valor: stats.totalDocumentos, cor: "#10b981", icone: "📄" },
    { label: "Achados e Perdidos", valor: stats.totalAchados, cor: "#f59e0b", icone: "🔍" },
    { label: "Enquetes ativas", valor: stats.enquetesAtivas, cor: "#ec4899", icone: "📊" },
  ];

  const CORES_PIE = ["#ef4444", "#22c55e", "#f59e0b", "#38bdf8", "#a78bfa"];

  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ color: "#38bdf8", marginBottom: "4px" }}>Dashboard</h2>
      {condominio && (
        <p style={{ color: "#64748b", marginBottom: "24px", fontSize: "0.9rem" }}>
          {condominio.nome} — visão geral
        </p>
      )}

      {/* Cards */}
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "3px solid #22c55e" }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Receitas</p>
          <h3 style={{ color: "#22c55e", margin: "8px 0 0", fontSize: "1.3rem" }}>{formatarMoeda(stats.totalReceitas)}</h3>
        </div>
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: "3px solid #ef4444" }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Despesas</p>
          <h3 style={{ color: "#ef4444", margin: "8px 0 0", fontSize: "1.3rem" }}>{formatarMoeda(stats.totalDespesas)}</h3>
        </div>
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", borderTop: `3px solid ${saldo >= 0 ? "#38bdf8" : "#ef4444"}` }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Saldo</p>
          <h3 style={{ color: saldo >= 0 ? "#38bdf8" : "#ef4444", margin: "8px 0 0", fontSize: "1.3rem" }}>{formatarMoeda(saldo)}</h3>
        </div>
      </div>

      {/* Gráfico mensal */}
      <div style={{ background: "#1e293b", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ color: "#f1f5f9", margin: "0 0 20px" }}>Receitas vs Despesas — últimos 6 meses</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={dadosMensais} barGap={4}>
            <XAxis dataKey="mes" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
              labelStyle={{ color: "#f1f5f9" }}
              formatter={(value) => formatarMoeda(value)}
            />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico ocorrências */}
      {dadosOcorrencias.length > 0 && (
        <div style={{ background: "#1e293b", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ color: "#f1f5f9", margin: "0 0 20px" }}>Ocorrências por status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dadosOcorrencias} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {dadosOcorrencias.map((_, i) => (
                  <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} labelStyle={{ color: "#f1f5f9" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Alertas */}
      {stats.ocorrenciasAbertas > 0 && (
        <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: "12px", padding: "16px 20px", marginBottom: "12px" }}>
          <p style={{ color: "#ef4444", margin: 0, fontWeight: "bold" }}>
            🚨 {stats.ocorrenciasAbertas} ocorrência{stats.ocorrenciasAbertas !== 1 ? "s" : ""} em aberto — requer atenção.
          </p>
        </div>
      )}
    </div>
  );
}