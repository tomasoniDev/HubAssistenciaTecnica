# Relatórios de Atendimento Tomasoni

Aplicação corporativa para cadastro de máquinas, usuários, contratos, cronograma, acesso remoto e registros de atendimento.

## Stack

- Next.js
- Supabase via rotas server-side
- SMTP Office 365 para envio de relatórios
- Vercel

## Configuração local

1. Copie `.env.example` para `.env.local`.
2. Preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `APP_SESSION_SECRET`.
3. Preencha as variáveis SMTP quando precisar testar envio de e-mail:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
4. Instale dependências com `npm install`.
5. Rode `npm run dev`.

## Supabase

O navegador não acessa o Supabase diretamente. As consultas e gravações passam pelas rotas internas em `app/api`, com validação de sessão e permissões no servidor.

O schema inicial está em `supabase/migrations/001_initial_schema.sql`.

## E-mail

O envio automático de relatórios usa SMTP Office 365 pela rota `app/api/send-service-email`.

Em produção, as credenciais devem ficar apenas nas variáveis de ambiente da Vercel.

## Criptografia das senhas de acesso remoto

As senhas VNC/SINEMA podem ser guardadas criptografadas (AES-256-GCM).

1. Gere uma chave: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
2. Cadastre-a na Vercel como `CREDENTIAL_ENCRYPTION_KEY` e faça um novo deploy.
3. Em **Administração > Criptografia das senhas**, use **Criptografar senhas existentes** (somente Admin).

Guarde a chave em local seguro (cofre de senhas). **Sem ela, as senhas criptografadas não podem ser recuperadas**, e trocar a chave exige recriptografar tudo. Sem a variável definida, o sistema continua funcionando como antes (senhas em texto).
