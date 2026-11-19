
const TURMAS = ["101", "102", "103", "201", "202", "203", "301", "302"];

const SENHA_COZINHA = "cozinha123"; // Senha demonstrativa

let usuarioAtual = null;

const hoje = () => {
    const d = new Date();
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
};

const chave = (nome) => `${nome}_${hoje()}`;

function carregar(nome, padrao) {
    try {
        const valor = localStorage.getItem(nome);
        return valor ? JSON.parse(valor) : padrao;
    } catch {
        return padrao;
    }
}

function salvarLocal(nome, dados) {
    localStorage.setItem(nome, JSON.stringify(dados));
}

function cardapio() {
    return carregar(chave("cardapio"), {
        cafe: "Café com leite e pão com doce",
        almoco: "Arroz, feijão, frango e saladas",
        lanche: "Pão com suco"
    });
}

function respostas() {
    return carregar(chave("respostas"), []);
}

function mostrarCardapio() {
    const c = cardapio();

    document.getElementById("menuCafe").textContent = c.cafe;
    document.getElementById("menuAlmoco").textContent = c.almoco;
    document.getElementById("menuLanche").textContent = c.lanche;

    document.getElementById("editarCafe").value = c.cafe;
    document.getElementById("editarAlmoco").value = c.almoco;
    document.getElementById("editarLanche").value = c.lanche;
}

function atualizarData() {
    const data = new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

    document.getElementById("dataHoje").textContent = data;
    document.getElementById("dataCozinha").textContent = data;
}

// Trocar campos de acordo com o tipo de usuário
document.getElementById("tipo").addEventListener("change", function() {
    const cozinha = this.value === "cozinha";

    document.getElementById("campoTurma").hidden = cozinha;
    document.getElementById("campoSenha").hidden = !cozinha;
});

document.getElementById("formLogin").addEventListener("submit", function(e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const tipo = document.getElementById("tipo").value;

    if (!email.endsWith("@educar")) {
        alert("Use seu e-mail escolar terminado em @educar.");
        return;
    }

    if (!nome) {
        alert("Digite seu nome.");
        return;
    }

    if (tipo === "aluno") {
        const turma = document.getElementById("turma").value;

        if (!TURMAS.includes(turma)) {
            alert("Selecione uma turma válida.");
            return;
        }

        usuarioAtual = { nome, email, tipo, turma };
    } else {
        const senha = document.getElementById("senhaCozinha").value;

        if (senha !== SENHA_COZINHA) {
            alert("Senha da cozinha incorreta!");
            return;
        }

        usuarioAtual = { nome, email, tipo };
    }

    entrar();
});

function entrar() {
    document.getElementById("login").hidden = true;
    document.getElementById("sair").hidden = false;

    atualizarData();
    mostrarCardapio();

    if (usuarioAtual.tipo === "aluno") {
        document.getElementById("areaAluno").hidden = false;
        document.getElementById("areaCozinha").hidden = true;

        document.getElementById("nomeAluno").textContent = usuarioAtual.nome;
        document.getElementById("turmaAluno").textContent = usuarioAtual.turma;

        carregarRespostaAnterior();
    } else {
        document.getElementById("areaAluno").hidden = true;
        document.getElementById("areaCozinha").hidden = false;

        atualizarPainel();
    }
}

function carregarRespostaAnterior() {
    const anterior = respostas().find(
        r => r.email === usuarioAtual.email
    );

    ["cafe", "almoco", "repAlmoco", "lanche", "repLanche"].forEach(campo => {
        document.querySelectorAll(`input[name="${campo}"]`).forEach(input => {
            input.checked = anterior
                ? input.value === anterior[campo]
                : false;
        });
    });

    document.getElementById("mensagemAluno").textContent =
        anterior ? "Você já enviou suas respostas hoje. Pode atualizá-las!" : "";
}

function valorSelecionado(nome) {
    return document.querySelector(`input[name="${nome}"]:checked`)?.value;
}

function salvarResposta() {
    if (!usuarioAtual) return;

    const campos = ["cafe", "almoco", "repAlmoco", "lanche", "repLanche"];

    const dados = {};

    for (const campo of campos) {
        dados[campo] = valorSelecionado(campo);

        if (!dados[campo]) {
            alert("Responda todas as perguntas antes de enviar!");
            return;
        }
    }

    if (dados.almoco === "nao") dados.repAlmoco = "nao";
    if (dados.lanche === "nao") dados.repLanche = "nao";

    const lista = respostas();

    const registro = {
        nome: usuarioAtual.nome,
        email: usuarioAtual.email,
        turma: usuarioAtual.turma,
        ...dados
    };

    const indice = lista.findIndex(
        r => r.email === usuarioAtual.email
    );

    if (indice >= 0) {
        lista[indice] = registro;
    } else {
        lista.push(registro);
    }

    salvarLocal(chave("respostas"), lista);

    document.getElementById("mensagemAluno").textContent =
        "✅ Suas respostas foram enviadas com sucesso! Obrigado!";

    alert("Respostas salvas com sucesso!");
}

function atualizarCardapio() {
    const dados = {
        cafe: document.getElementById("editarCafe").value.trim(),
        almoco: document.getElementById("editarAlmoco").value.trim(),
        lanche: document.getElementById("editarLanche").value.trim()
    };

    if (!dados.cafe || !dados.almoco || !dados.lanche) {
        alert("Preencha todos os campos do cardápio.");
        return;
    }

    salvarLocal(chave("cardapio"), dados);
    mostrarCardapio();

    alert("Cardápio atualizado com sucesso!");
}

function contar(lista, campo) {
    return lista.filter(r => r[campo] === "sim").length;
}

function atualizarPainel() {
    const lista = respostas();

    document.getElementById("totalCafe").textContent =
        contar(lista, "cafe");

    document.getElementById("totalAlmoco").textContent =
        contar(lista, "almoco");

    document.getElementById("totalLanche").textContent =
        contar(lista, "lanche");

    document.getElementById("totalRepeticoes").textContent =
        contar(lista, "repAlmoco") +
        contar(lista, "repLanche");

    const tabela = document.getElementById("tabelaTurmas");

    tabela.innerHTML = "";

    TURMAS.forEach(turma => {
        const alunos = lista.filter(r => r.turma === turma);

        const linha = document.createElement("tr");

        const valores = [
            turma,
            contar(alunos, "cafe"),
            contar(alunos, "almoco"),
            contar(alunos, "repAlmoco"),
            contar(alunos, "lanche"),
            contar(alunos, "repLanche")
        ];

        valores.forEach(valor => {
            const td = document.createElement("td");
            td.textContent = valor;
            linha.appendChild(td);
        });

        tabela.appendChild(linha);
    });

    const tabelaAlunos = document.getElementById("tabelaAlunos");

    tabelaAlunos.innerHTML = "";

    lista.forEach(aluno => {
        const linha = document.createElement("tr");

        [
            aluno.nome,
            aluno.turma,
            aluno.cafe,
            aluno.almoco,
            aluno.repAlmoco,
            aluno.lanche,
            aluno.repLanche
        ].forEach(valor => {
            const td = document.createElement("td");
            td.textContent = valor;
            linha.appendChild(td);
        });

        tabelaAlunos.appendChild(linha);
    });
}

function exportarCSV() {
    const lista = respostas();

    const cabecalho = [
        "Aluno", "Turma", "Cafe", "Almoco",
        "Repete almoco", "Lanche", "Repete lanche"
    ];

    const linhas = lista.map(a => [
        a.nome, a.turma, a.cafe, a.almoco,
        a.repAlmoco, a.lanche, a.repLanche
    ]);

    const csv = [cabecalho, ...linhas]
        .map(linha => linha.map(valor =>
            `"${String(valor ?? "").replace(/"/g, '""')}"`
        ).join(";"))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "relatorio-merenda-" + hoje() + ".csv";
    link.click();

    URL.revokeObjectURL(url);
}

function sair() {
    usuarioAtual = null;

    document.getElementById("login").hidden = false;
    document.getElementById("areaAluno").hidden = true;
    document.getElementById("areaCozinha").hidden = true;
    document.getElementById("sair").hidden = true;

    document.getElementById("formLogin").reset();

    document.getElementById("campoTurma").hidden = false;
    document.getElementById("campoSenha").hidden = true;
}

atualizarData();
