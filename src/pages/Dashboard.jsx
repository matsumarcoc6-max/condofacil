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
  });
  const [alertas, setAlertas] = useState([]);
  const [dadosMensais, setDadosMensais] = useState([]);
  const [dadosOcorrencias, setDadosOcorrencias] = useState([]);

  useEffect(() => { carregarStats(); }, []);

  async function carregarStats() {
    try {
      const [
        avisos, ocorrencias, reservas, documentos,
        financeiro, veiculos, pets, enquetes,
        moradores, achadosPerdidos, visitas,
      ] = await Promise.all([
        getDocs(collection(db, "avisos")),
        getDocs(collection(db, "ocorrencias")),
        getDocs(collection(db, "reservas")),
        getDocs(collection(db, "documentos")),
        getDocs(collection(db, "financeiro")),
        getDocs(collection(db, "veiculos")),
        getDocs(collection(db, "pets")),
        getDocs(collection(db, "enquetes")),
        getDocs(collection(db, "usuarios")),
        getDocs(collection(db, "achados_perdidos")),
        getDocs(query(collection(db, "visitas"), where("status", "in", ["dentro", "agendado"]))),
      ]);

      const agora = new Date();
      const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
      const seteDiasAtras = new Date(hoje); seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      const tresDiasAtras = new Date(hoje); tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

      // Ocorrências
      const ocorrenciasData = ocorrencias.docs.map((d) => ({ id: d.id, ...d.data() }));
      const ocorrenciasAbertas = ocorrenciasData.filter((o) => o.status === "aberta");
      const ocorrenciasAtrasadas = ocorrenciasAbertas.filter((o) => {
        if (!o.criado_em) return false;
        const d = o.criado_em.toDate ? o.criado_em.toDate() : new Date(o.criado_em);
        return d < seteDiasAtras;
      });

      // Reservas hoje
      const reservasData = reservas.docs.map((d) => ({ id: d.id, ...d.data() }));
      const reservasHoje = reservasData.filter((r) => {
        if (!r.data) return false;
        const d = r.data.toDate ? r.data.toDate() : new Date(r.data);
        return d >= hoje && d < amanha;
      });

      // Visitas agendadas para hoje
      const visitasData = visitas.docs.map((d) => ({ id: d.id, ...d.data() }));
      const visitantesPresentes = visitasData.filter((v) => v.status === "dentro").length;
      const visitasHoje = visitasData.filter((v) => {
        if (v.status !== "agendado" || !v.dataHoraAgendada) return false;
        const d = v.dataHoraAgendada.toDate ? v.dataHoraAgendada.toDate() : new Date(v.dataHoraAgendada);
        return d >= hoje && d < amanha;
      });

      // Enquetes sem votos há mais de 3 dias
      const enquetesData = enquetes.docs.map((d) => ({ id: d.id, ...d.data() }));
      const enquetesAtivas = enquetesData.filter((e) => e.ativa);
      const enquetesSemEngajamento = enquetesAtivas.filter((e) => {
        const totalVotos = (e.opcoes || []).reduce((acc, o) => acc + (o.votos?.length || 0), 0);
        if (totalVotos > 0) return false;
        if (!e.criado_em) return false;
        const d = e.criado_em.toDate ? e.criado_em.toDate() : new Date(e.criado_em);
        return d < tresDiasAtras;
      });

      // Financeiro
      const lancamentos = financeiro.docs.map((d) => d.data());
      const totalReceitas = lancamentos.filter((l) => l.tipo === "receita").reduce((acc, l) => acc + l.valor, 0);
      const totalDespesas = lancamentos.filter((l) => l.tipo === "despesa").reduce((acc, l) => acc + l.valor, 0);
      const saldo = totalReceitas - totalDespesas;

      // Gráfico mensal
      const meses = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        meses.push({ mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), ano: d.getFullYear(), mesNum: d.getMonth(), receitas: 0, despesas: 0 });
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
      ocorrenciasData.forEach((o) => {
        const s = o.status || "sem status";
        statusCount[s] = (statusCount[s] || 0) + 1;
      });
      setDadosOcorrencias(Object.entries(statusCount).map(([name, value]) => ({ name, value })));

      // Montar alertas
      const novosAlertas = [];
      if (ocorrenciasAtrasadas.length > 0)
        novosAlertas.push({ cor: "#ef4444", icone: "🚨", texto: `${ocorrenciasAtrasadas.length} ocorrência${ocorrenciasAtrasadas.length !== 1 ? "s" : ""} aberta${ocorrenciasAtrasadas.length !== 1 ? "s" : ""} há mais de 7 dias sem resolução.` });
      if (ocorrenciasAbertas.length > 0 && ocorrenciasAtrasadas.length === 0)
        novosAlertas.push({ cor: "#f59e0b", icone: "⚠️", texto: `${ocorrenciasAbertas.length} ocorrência${ocorrenciasAbertas.length !== 1 ? "s" : ""} em aberto.` });
      if (saldo < 0)
        novosAlertas.push({ cor: "#ef4444", icone: "💸", texto: `Saldo financeiro negativo: ${formatarMoeda(saldo)}.` });
      if (reservasHoje.length > 0)
        novosAlertas.push({ cor: "#38bdf8", icone: "📅", texto: `${reservasHoje.length} reserva${reservasHoje.length !== 1 ? "s" : ""} agendada${reservasHoje.length !== 1 ? "s" : ""} para hoje.` });
      if (visitasHoje.length > 0)
        novosAlertas.push({ cor: "#22c55e", icone: "👥", texto: `${visitasHoje.length} visita${visitasHoje.length !== 1 ? "s" : ""} agendada${visitasHoje.length !== 1 ? "s" : ""} para hoje.` });
      if (enquetesSemEngajamento.length > 0)
        novosAlertas.push({ cor: "#a78bfa", icone: "📊", texto: `${enquetesSemEngajamento.length} enquete${enquetesSemEngajamento.length !== 1 ? "s" : ""} ativa${enquetesSemEngajamento.length !== 1 ? "s" : ""} sem votos há mais de 3 dias.` });

      setAlertas(novosAlertas);

      setStats({
        totalAvisos: avisos.size,
        totalOcorrencias: ocorrencias.size,
        ocorrenciasAbertas: ocorrenciasAbertas.length,
        totalReservas: reservas.size,
        visitantesPresentes,
        totalDocumentos: documentos.size,
        totalVeiculos: veiculos.size,
        totalPets: pets.size,
        enquetesAtivas: enquetesAtivas.length,
        agendaHoje: visitasHoje.length,
        totalReceitas,
        totalDespesas,
        totalMoradores: moradores.size,
        totalAchados: achadosPerdidos.size,
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

      {/* Alertas inteligentes */}
      {alertas.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "#f1f5f9", marginBottom: "12px" }}>⚡ Atenção</h3>
          {alertas.map((a, i) => (
            <div key={i} style={{ background: a.cor + "22", border: `1px solid ${a.cor}`, borderRadius: "12px", padding: "14px 20px", marginBottom: "8px" }}>
              <p style={{ color: a.cor, margin: 0, fontWeight: "bold", fontSize: "0.95rem" }}>
                {a.icone} {a.texto}
              </p>
            </div>
          ))}
        </div>
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
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} labelStyle={{ color: "#f1f5f9" }} formatter={(value) => formatarMoeda(value)} />
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
                {dadosOcorrencias.map((_, i) => <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} labelStyle={{ color: "#f1f5f9" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}