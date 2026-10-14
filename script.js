// Referências do DOM
const inputPergunta = document.getElementById("input-pergunta");
const btnPerguntar = document.getElementById("btn-perguntar");
const textoResultado = document.getElementById("texto-resultado");
const btnOuvir = document.getElementById("btn-ouvir");
const linkNoticiaContainer = document.getElementById("link-noticia-container");
const linkNoticia = document.getElementById("link-noticia");
const statusBusca = document.getElementById("status-busca");

// Função principal que busca e carrega a resposta DIRETO na tela
async function buscarEExibir(termo) {
    const pergunta = termo || inputPergunta.value.trim();

    if (!pergunta) {
        textoResultado.innerText = "Por favor, digite uma dúvida ou pergunta sobre futevôlei!";
        linkNoticiaContainer.style.display = "none";
        return;
    }

    // Estado visual de busca
    textoResultado.innerText = "Buscando resposta na internet...";
    statusBusca.innerText = "Carregando...";
    linkNoticiaContainer.style.display = "none";
    pararVoz();

    try {
        // Garantir contexto de futevôlei na busca
        const buscaComContexto = pergunta.toLowerCase().includes("futevôlei") ? pergunta : `${pergunta} futevôlei`;

        // 1. Busca via Wikipedia API (Retorna o conteúdo em JSON diretamente)
        const urlWiki = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&explaintext&titles=${encodeURIComponent(buscaComContexto)}&generator=search&gsrsearch=${encodeURIComponent(buscaComContexto)}&format=json&origin=*`;
        
        const respostaWiki = await fetch(urlWiki);
        const dadosWiki = await respostaWiki.json();

        if (dadosWiki.query && dadosWiki.query.pages) {
            const paginas = dadosWiki.query.pages;
            const primeiraPagina = Object.values(paginas)[0];

            if (primeiraPagina && primeiraPagina.extract) {
                // Formata o texto e limita o tamanho para leitura limpa
                let textoExtraido = primeiraPagina.extract;
                if (textoExtraido.length > 500) {
                    textoExtraido = textoExtraido.substring(0, 500) + "...";
                }

                const urlFonte = `https://pt.wikipedia.org/?curid=${primeiraPagina.pageid}`;
                
                // Exibe o resultado direto na página
                exibirRespostaNaPagina(textoExtraido, urlFonte);
                return;
            }
        }

        // 2. Busca secundária na DuckDuckGo Instant Answer API
        const urlDuck = `https://api.duckduckgo.com/?q=${encodeURIComponent(buscaComContexto)}&format=json&no_html=1&kl=br-pt`;
        const respostaDuck = await fetch(urlDuck);
        const dadosDuck = await respostaDuck.json();

        if (dadosDuck.AbstractText) {
            exibirRespostaNaPagina(dadosDuck.AbstractText, dadosDuck.AbstractURL);
            return;
        }

        // Caso não haja resumo automático estruturado na API
        exibirRespostaNaPagina(
            `O futevôlei é um esporte de areia praticado sem o uso das mãos. Para mais detalhes sobre "${pergunta}", veja a matéria na fonte completa abaixo:`,
            `https://duckduckgo.com/?q=${encodeURIComponent(buscaComContexto)}`
        );

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        exibirRespostaNaPagina(
            `O futevôlei combina regras do vôlei de praia com fundamentos do futebol (peito, coxa, cabeça e pés). Consulte a matéria completa no link abaixo:`,
            `https://pt.wikipedia.org/wiki/Futev%C3%B4lei`
        );
    }
}

// Atualiza os elementos da tela sem recarregar nem abrir abas
function exibirRespostaNaPagina(texto, linkFonte) {
    textoResultado.innerText = texto;
    statusBusca.innerText = "Resposta gerada";

    if (linkFonte) {
        linkNoticia.href = linkFonte;
        linkNoticiaContainer.style.display = "block";
    } else {
        linkNoticiaContainer.style.display = "none";
    }
}

// Leitura da resposta com Voz I.A do navegador
function alternarLeituraVoz() {
    if (!('speechSynthesis' in window)) {
        alert("Seu navegador não possui recurso de voz.");
        return;
    }

    if (window.speechSynthesis.speaking) {
        pararVoz();
    } else {
        const textoParaLerr = textoResultado.innerText;
        if (!textoParaLerr) return;

        const utterance = new SpeechSynthesisUtterance(textoParaLerr);
        utterance.lang = "pt-BR";
        utterance.rate = 1.0;

        utterance.onstart = () => atualizarBotaoVoz(true);
        utterance.onend = () => atualizarBotaoVoz(false);
        utterance.onerror = () => atualizarBotaoVoz(false);

        window.speechSynthesis.speak(utterance);
    }
}

function pararVoz() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        atualizarBotaoVoz(false);
    }
}

function atualizarBotaoVoz(isLendo) {
    if (isLendo) {
        btnOuvir.classList.add("lendo");
        btnOuvir.querySelector("span").innerText = "Parar";
    } else {
        btnOuvir.classList.remove("lendo");
        btnOuvir.querySelector("span").innerText = "Ouvir";
    }
}

// Eventos de clique e teclado
btnPerguntar.addEventListener("click", () => buscarEExibir());
inputPergunta.addEventListener("keypress", (e) => {
    if (e.key === "Enter") buscarEExibir();
});
btnOuvir.addEventListener("click", alternarLeituraVoz);