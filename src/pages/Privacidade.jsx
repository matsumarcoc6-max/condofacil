export default function Privacidade() {
  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: "40px 24px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <h1 style={{ color: "#38bdf8", marginBottom: "8px" }}>Política de Privacidade</h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "32px" }}>
          Última atualização: junho de 2026
        </p>

        <Secao titulo="1. Quem somos">
          O CondoFácil é um sistema de gestão condominial desenvolvido e operado por pessoa física,
          disponível em condofacil-lemon.vercel.app. Este documento explica como coletamos, usamos
          e protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados
          (LGPD — Lei nº 13.709/2018).
        </Secao>

        <Secao titulo="2. Dados coletados">
          Coletamos os seguintes dados para o funcionamento do sistema:
          <Lista itens={[
            "Nome completo",
            "Endereço de e-mail",
            "Número do apartamento e bloco",
            "Número de RG (apenas para visitantes)",
            "Placa do veículo (opcional)",
            "Token de notificação push (FCM) — gerado automaticamente pelo dispositivo",
            "Histórico de entradas e saídas de visitantes",
            "Registros de ocorrências, reservas e enquetes",
          ]} />
        </Secao>

        <Secao titulo="3. Como usamos seus dados">
          Seus dados são utilizados exclusivamente para:
          <Lista itens={[
            "Autenticação e acesso ao sistema",
            "Controle de acesso de visitantes ao condomínio",
            "Envio de notificações push sobre visitas e comunicados",
            "Gestão interna do condomínio pelo síndico",
            "Geração de relatórios financeiros pelo síndico",
          ]} />
          Não vendemos, compartilhamos ou cedemos seus dados a terceiros para fins comerciais.
        </Secao>

        <Secao titulo="4. Base legal">
          O tratamento dos dados é realizado com base no seu consentimento (Art. 7º, I da LGPD),
          obtido no momento do cadastro, e para cumprimento de obrigações relacionadas à gestão
          condominial (Art. 7º, II).
        </Secao>

        <Secao titulo="5. Armazenamento e segurança">
          Os dados são armazenados no Firebase (Google Cloud), com infraestrutura segura,
          criptografia em trânsito (HTTPS) e regras de acesso por perfil de usuário.
          Cada usuário acessa apenas os dados permitidos ao seu perfil.
        </Secao>

        <Secao titulo="6. Compartilhamento de dados">
          Os dados são acessados apenas pelo síndico e administrador do condomínio ao qual
          você pertence, dentro do sistema. Não há compartilhamento com terceiros,
          exceto pelos serviços de infraestrutura (Firebase/Google e Vercel) necessários
          para o funcionamento do sistema.
        </Secao>

        <Secao titulo="7. Seus direitos (LGPD)">
          Como titular dos dados, você tem direito a:
          <Lista itens={[
            "Confirmar a existência de tratamento dos seus dados",
            "Acessar seus dados cadastrados no sistema",
            "Corrigir dados incompletos ou desatualizados",
            "Solicitar a exclusão dos seus dados",
            "Revogar o consentimento a qualquer momento",
          ]} />
          Para exercer esses direitos, utilize a opção disponível no seu perfil dentro do aplicativo
          ou entre em contato diretamente com o administrador do seu condomínio.
        </Secao>

        <Secao titulo="8. Exclusão de dados">
          Você pode solicitar a exclusão dos seus dados a qualquer momento pelo aplicativo.
          A solicitação será analisada pelo síndico ou administrador em até 15 dias,
          conforme prazo previsto na LGPD.
        </Secao>

        <Secao titulo="9. Cookies e rastreamento">
          O sistema não utiliza cookies de rastreamento ou ferramentas de análise comportamental.
          O único dado técnico armazenado localmente é o token de sessão de autenticação,
          necessário para manter o usuário conectado.
        </Secao>

        <Secao titulo="10. Contato">
          Para dúvidas sobre esta política ou para exercer seus direitos, entre em contato
          pelo e-mail do administrador do seu condomínio ou pelo suporte do CondoFácil.
        </Secao>

        <div style={{ marginTop: "40px", padding: "16px", background: "#1e293b", borderRadius: "12px", textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
            CondoFácil — Sistema de Gestão Condominial
          </p>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "4px 0 0" }}>
            condofacil-lemon.vercel.app
          </p>
        </div>
      </div>
    </div>
  );
}

function Secao({ titulo, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h2 style={{ color: "#f1f5f9", fontSize: "1rem", fontWeight: "bold", marginBottom: "8px" }}>{titulo}</h2>
      <div style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: "1.7" }}>{children}</div>
    </div>
  );
}

function Lista({ itens }) {
  return (
    <ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
      {itens.map((item, i) => (
        <li key={i} style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: "1.7" }}>{item}</li>
      ))}
    </ul>
  );
}