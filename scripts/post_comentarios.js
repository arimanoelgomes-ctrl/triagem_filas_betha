#!/usr/bin/env node
/**
 * post_comentarios.js — versão monorepo (verticais)
 *
 * Posta comentários da triagem automática como Nota Interna no Jira da Betha,
 * usando o payload correto (properties.sd.public.comment.internal = true).
 *
 * Originalmente um workaround para o bug do MCP `@betha/jira-mcp` (corrigido em
 * 2026-06-01 — ver docs/incidente_mcp_add_comment.md). Permanece útil como
 * caminho alternativo: o coordenador pode revisar o arquivo de outputs antes
 * de postar em lote, e o script é idempotente.
 *
 * Uso:
 *   1. cd scripts && cp .env.example .env
 *   2. Editar .env com as credenciais
 *   3. Listar arquivos disponíveis (uma vertical):
 *        node post_comentarios.js --vertical arrecadacao --list
 *   4. Dry-run (sem postar):
 *        node post_comentarios.js --vertical pessoal --dry-run
 *   5. Postar de fato:
 *        node post_comentarios.js --vertical arrecadacao
 *   6. Apontar arquivo específico (sobrescreve --vertical):
 *        node post_comentarios.js --file ../verticais/pessoal/outputs/2026-06-09_comentarios_para_postar.md
 *   7. Postar APENAS um chamado da vertical:
 *        node post_comentarios.js --vertical pessoal --issue BTHSC-319007
 *
 * Verticais reconhecidas: nomes de subpastas dentro de `verticais/`.
 *
 * Requisitos: Node.js 18+ (usa fetch nativo).
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ─── Constantes ─────────────────────────────────────────────────────────────
const TAG_IA = '[#IA-TRIAGEM-AUTOMATICA#]';
const VERTICAIS_DIR = path.resolve(__dirname, '..', 'verticais');

// Status considerados "encerrados" — não aceitam novos comentários no Jira da Betha.
// Lista validada empiricamente; ajustar se aparecerem outros nomes em produção.
const STATUS_ENCERRADOS = new Set([
    'Fechado',
    'Encerrado',
    'Resolvido',
    'Concluído',
    'Triagem encerrada',
    'Cancelado',
    'Reprovada',
]);

// ─── Sanitização ────────────────────────────────────────────────────────────
/**
 * Remove caracteres fora do Basic Multilingual Plane do Unicode (code points > U+FFFF),
 * que são representados como pares substitutos em UTF-16. Inclui emojis modernos como 🤖
 * (U+1F916), que causam HTTP 500 no Jira da Betha (provável limitação de encoding no DB).
 *
 * Acentuação latina, símbolos comuns e wiki markup permanecem intactos.
 */
function sanitizarBody(body) {
    let sanitizado = body.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
    sanitizado = sanitizado.replace(/[︀-️]/g, '');
    return sanitizado;
}

// ─── Argumentos da linha de comando ─────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {
    dryRun: args.includes('--dry-run'),
    list: args.includes('--list'),
    yes: args.includes('--yes') || args.includes('-y'),
};
function readArg(name) {
    const idx = args.indexOf(name);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}
const verticalArg = readArg('--vertical');
const fileArg = readArg('--file');
const issueArgRaw = readArg('--issue');
const issueArg = issueArgRaw ? issueArgRaw.toUpperCase() : null;

// ─── Carregamento simples do .env ───────────────────────────────────────────
function loadEnv(envPath) {
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) return;
        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = value;
    });
}

loadEnv(path.join(__dirname, '.env'));

const JIRA_BASE_URL = (process.env.JIRA_BASE_URL || '').replace(/\/$/, '');
const JIRA_USERNAME = process.env.JIRA_USERNAME || '';
const JIRA_PASSWORD = process.env.JIRA_PASSWORD || '';

// ─── Validação de configuração ──────────────────────────────────────────────
function assertConfig() {
    if (!JIRA_BASE_URL || !JIRA_USERNAME || !JIRA_PASSWORD) {
        console.error('Configuracao ausente. Copie scripts/.env.example para scripts/.env e preencha:');
        console.error('   JIRA_BASE_URL, JIRA_USERNAME, JIRA_PASSWORD');
        process.exit(1);
    }
}

// ─── HTTP helpers ───────────────────────────────────────────────────────────
function authHeader() {
    const token = Buffer.from(`${JIRA_USERNAME}:${JIRA_PASSWORD}`).toString('base64');
    return `Basic ${token}`;
}

async function fetchIssueComments(issueKey) {
    const url = `${JIRA_BASE_URL}/rest/api/2/issue/${issueKey}/comment`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': authHeader(),
            'Accept': 'application/json',
        },
    });
    if (!res.ok) {
        throw new Error(`GET ${url} -> HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.comments || [];
}

async function fetchIssueStatus(issueKey) {
    const url = `${JIRA_BASE_URL}/rest/api/2/issue/${issueKey}?fields=status`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': authHeader(),
            'Accept': 'application/json',
        },
    });
    if (!res.ok) {
        throw new Error(`GET ${url} -> HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.fields?.status?.name || 'desconhecido';
}

async function postInternalComment(issueKey, body) {
    const url = `${JIRA_BASE_URL}/rest/api/2/issue/${issueKey}/comment`;
    const payload = {
        body: sanitizarBody(body),
        properties: [
            { key: 'sd.public.comment', value: { internal: true } },
        ],
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': authHeader(),
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`POST ${url} -> HTTP ${res.status} - ${text}`);
    }
    return await res.json();
}

// ─── Resolução de outputs por vertical ──────────────────────────────────────
function listarVerticais() {
    if (!fs.existsSync(VERTICAIS_DIR)) return [];
    return fs.readdirSync(VERTICAIS_DIR)
        .filter((n) => fs.statSync(path.join(VERTICAIS_DIR, n)).isDirectory())
        .sort();
}

function outputsDirDaVertical(vertical) {
    return path.join(VERTICAIS_DIR, vertical, 'outputs');
}

// ─── Parsing do arquivo de comentários preparados ───────────────────────────
function parseComentarios(content) {
    const blocks = [];
    // Aceita dois formatos de header:
    //   ## 1. BTHSC-12345 — ...   (com numeracao)
    //   ## BTHSC-12345 — ...      (sem numeracao — formato usado pelo agente em algumas execucoes)
    const headerRe = /^##\s+(?:\d+\.\s+)?(BTHSC-\d+|[A-Z]+-\d+)\b/gm;
    const headers = [];
    let m;
    while ((m = headerRe.exec(content)) !== null) {
        headers.push({ key: m[1], start: m.index });
    }
    for (let i = 0; i < headers.length; i++) {
        const { key, start } = headers[i];
        const end = i + 1 < headers.length ? headers[i + 1].start : content.length;
        const section = content.slice(start, end);
        const fenceRe = /```(?:markdown)?\s*\n([\s\S]*?)\n```/;
        const fm = section.match(fenceRe);
        if (!fm) continue;
        const body = fm[1].trim();
        if (!body.includes(TAG_IA)) {
            console.warn(`AVISO: bloco ${key} sem a tag ${TAG_IA} - ignorando por seguranca.`);
            continue;
        }
        blocks.push({ issueKey: key, body });
    }
    return blocks;
}

function pickFile() {
    if (fileArg) {
        const abs = path.isAbsolute(fileArg) ? fileArg : path.resolve(process.cwd(), fileArg);
        if (!fs.existsSync(abs)) {
            console.error(`Arquivo nao encontrado: ${abs}`);
            process.exit(1);
        }
        return abs;
    }
    if (!verticalArg) {
        const verticais = listarVerticais();
        console.error('Sem --file e sem --vertical. Use --vertical <nome> ou --file <caminho>.');
        if (verticais.length) {
            console.error(`Verticais disponiveis: ${verticais.join(', ')}`);
        }
        process.exit(1);
    }
    const outputsDir = outputsDirDaVertical(verticalArg);
    if (!fs.existsSync(outputsDir)) {
        // Cria a pasta vazia se nao existir — primeira execucao do projeto ou apos clone fresco.
        // Outputs/ esta no .gitignore, entao nao vem pelo clone; precisa ser criada local.
        fs.mkdirSync(outputsDir, { recursive: true });
    }
    const candidatos = fs.readdirSync(outputsDir)
        .filter((n) => /_comentarios_para_postar\.md$/.test(n))
        .map((n) => ({ name: n, full: path.join(outputsDir, n) }))
        .sort((a, b) => fs.statSync(b.full).mtimeMs - fs.statSync(a.full).mtimeMs);
    if (candidatos.length === 0) {
        console.error(`Nenhum arquivo *_comentarios_para_postar.md encontrado em ${outputsDir}`);
        process.exit(1);
    }
    return candidatos[0].full;
}

// ─── Confirmação interativa ─────────────────────────────────────────────────
function askYesNo(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(question, (answer) => {
            rl.close();
            resolve(/^s|sim|y|yes$/i.test(answer.trim()));
        });
    });
}

// ─── Main ───────────────────────────────────────────────────────────────────
(async function main() {
    if (flags.list) {
        if (verticalArg) {
            const outputsDir = outputsDirDaVertical(verticalArg);
            if (!fs.existsSync(outputsDir)) {
                console.log(`(nenhum arquivo - diretorio ${outputsDir} nao existe)`);
                return;
            }
            const arquivos = fs.readdirSync(outputsDir)
                .filter((n) => /_comentarios_para_postar\.md$/.test(n))
                .sort();
            if (arquivos.length === 0) console.log('(nenhum arquivo de comentarios encontrado)');
            else arquivos.forEach((n) => console.log(`${verticalArg}/${n}`));
            return;
        }
        // Sem vertical: lista TODAS
        const verticais = listarVerticais();
        if (verticais.length === 0) {
            console.log('(nenhuma vertical encontrada em verticais/)');
            return;
        }
        for (const v of verticais) {
            const outputsDir = outputsDirDaVertical(v);
            if (!fs.existsSync(outputsDir)) continue;
            const arquivos = fs.readdirSync(outputsDir)
                .filter((n) => /_comentarios_para_postar\.md$/.test(n))
                .sort();
            arquivos.forEach((n) => console.log(`${v}/${n}`));
        }
        return;
    }

    if (!flags.dryRun) assertConfig();

    const arquivo = pickFile();
    console.log(`Arquivo:  ${arquivo}`);
    console.log(`Jira:     ${JIRA_BASE_URL || '(dry-run, sem URL)'}`);
    console.log(`Modo:     ${flags.dryRun ? 'DRY-RUN (nao posta)' : 'POSTAGEM REAL'}`);
    if (verticalArg) console.log(`Vertical: ${verticalArg}`);
    console.log('');

    const content = fs.readFileSync(arquivo, 'utf8');
    let blocos = parseComentarios(content);

    if (issueArg) {
        const filtrados = blocos.filter((b) => b.issueKey === issueArg);
        if (filtrados.length === 0) {
            console.error(`Nenhum bloco encontrado para ${issueArg} no arquivo. Disponiveis: ${blocos.map(b => b.issueKey).join(', ')}`);
            process.exit(1);
        }
        console.log(`Filtro --issue ${issueArg}: ${filtrados.length} bloco(s) selecionado(s) de ${blocos.length} no arquivo.`);
        console.log('');
        blocos = filtrados;
    }

    if (blocos.length === 0) {
        console.log('Nenhum bloco com a tag encontrado. Nada a postar.');
        return;
    }

    console.log(`Encontrados ${blocos.length} comentario(s) candidato(s):`);
    blocos.forEach((b, i) => {
        const preview = b.body.split('\n').slice(0, 2).join(' | ');
        console.log(`  ${i + 1}. ${b.issueKey}  ->  ${preview.slice(0, 80)}...`);
    });
    console.log('');

    if (!flags.dryRun && !flags.yes) {
        const ok = await askYesNo(`Confirma postagem dos ${blocos.length} comentarios como NOTA INTERNA? [s/N]: `);
        if (!ok) {
            console.log('Cancelado.');
            return;
        }
    }

    let postados = 0;
    let ignorados = 0;
    let erros = 0;

    for (const bloco of blocos) {
        process.stdout.write(`- ${bloco.issueKey}: `);
        try {
            if (flags.dryRun) {
                console.log('DRY-RUN - nao chamou API.');
                continue;
            }
            const status = await fetchIssueStatus(bloco.issueKey);
            if (STATUS_ENCERRADOS.has(status)) {
                console.log(`IGNORADO (chamado em status "${status}" - nao aceita novos comentarios).`);
                ignorados++;
                continue;
            }
            const existentes = await fetchIssueComments(bloco.issueKey);
            const jaTem = existentes.some((c) => (c.body || '').includes(TAG_IA));
            if (jaTem) {
                console.log('IGNORADO (ja existe comentario com a tag).');
                ignorados++;
                continue;
            }
            const r = await postInternalComment(bloco.issueKey, bloco.body);
            console.log(`OK - comentario ${r.id} postado como INTERNO.`);
            postados++;
        } catch (err) {
            console.log(`ERRO - ${err.message}`);
            erros++;
        }
    }

    console.log('');
    console.log('---------------------------------------------');
    console.log(`Postados: ${postados}   Ignorados: ${ignorados}   Erros: ${erros}`);
    console.log('---------------------------------------------');

    if (erros > 0) process.exit(2);
})();
