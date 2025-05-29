import { ref } from "vue";
import MarkdownIt from "markdown-it";
import type { FlashcardData, DeckInfo } from "@/types"; // Ajuste o caminho se seus tipos estiverem em outro lugar

export function useMarkdownParser() {
  const cards = ref<FlashcardData[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const md = new MarkdownIt();

  const parseMarkdownToFlashcards = (markdownText: string): FlashcardData[] => {
    const htmlOutput = md.render(markdownText);
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlOutput;

    const table = tempDiv.querySelector("table");
    if (!table) {
      throw new Error("Nenhuma tabela encontrada no arquivo Markdown.");
    }

    const rows = Array.from(table.querySelectorAll("tr"));
    const parsedCards: FlashcardData[] = [];

    // Assume que a primeira linha (rows[0]) é o cabeçalho e a ignora.
    // Começa do índice 1.
    if (rows.length <= 1) {
      throw new Error(
        "A tabela não contém dados de flashcards (apenas cabeçalho ou vazia)."
      );
    }

    // Pega os nomes das colunas do cabeçalho para mapeamento dinâmico (opcional, mas robusto)
    const headerCells = Array.from(rows[0].querySelectorAll("th")).map(
      (th) => th.textContent?.trim().toLowerCase() || ""
    );
    const idIndex = headerCells.indexOf("id");
    const afirmacaoIndex = headerCells.indexOf("afirmação");
    const respostaIndex = headerCells.indexOf("resposta");
    const explicacaoIndex = headerCells.indexOf("explicação");

    if (
      idIndex === -1 ||
      afirmacaoIndex === -1 ||
      respostaIndex === -1 ||
      explicacaoIndex === -1
    ) {
      throw new Error(
        'Cabeçalho da tabela inválido. Verifique se as colunas "id", "afirmação", "resposta", "explicação" existem.'
      );
    }

    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll("td"));
      if (
        cells.length >=
        Math.max(idIndex, afirmacaoIndex, respostaIndex, explicacaoIndex) + 1
      ) {
        // Verifica se tem células suficientes
        const cardData: FlashcardData = {
          id: cells[idIndex]?.textContent?.trim() || `card-${i}`,
          afirmacao: cells[afirmacaoIndex]?.textContent?.trim() || "",
          // Garante que a resposta seja 'V' ou 'F' se possível, caso contrário mantém o texto
          resposta:
            cells[respostaIndex]?.textContent?.trim().toUpperCase() === "V" ||
            cells[respostaIndex]?.textContent?.trim().toUpperCase() === "F"
              ? cells[respostaIndex].textContent!.trim().toUpperCase()
              : cells[respostaIndex]?.textContent?.trim() || "",
          explicacao: cells[explicacaoIndex]?.textContent?.trim() || "",
        };
        // Validação básica
        if (cardData.afirmacao && cardData.resposta) {
          parsedCards.push(cardData);
        } else {
          console.warn(
            `Card na linha ${
              i + 1
            } ignorado por falta de afirmação ou resposta.`
          );
        }
      } else {
        console.warn(
          `Linha ${
            i + 1
          } da tabela tem menos células que o esperado e foi ignorada.`
        );
      }
    }
    return parsedCards;
  };

  const loadDeckFromFile = async (deckInfo: DeckInfo) => {
    isLoading.value = true;
    error.value = null;
    cards.value = [];

    try {

      const deckFilePath = `${import.meta.env.BASE_URL}decks/${deckInfo.file}`.replace(/\/\//g, '/');
      console.log('Tentando buscar deck de:', deckFilePath); // Log para depuração

      
      // Os arquivos .md estão na pasta `public/decks/`
      const response = await fetch(deckFilePath);


      if (!response.ok) {
        throw new Error(
          `Erro ao buscar o arquivo do deck: ${response.status} ${response.statusText}`
        );
      }
      const markdownText = await response.text();
      cards.value = parseMarkdownToFlashcards(markdownText);
      if (cards.value.length === 0 && !error.value) {
        // Se parseou mas não encontrou cards válidos e não houve erro antes
        // Este erro pode ser redundante se parseMarkdownToFlashcards já lança um erro
        // error.value = 'Nenhum flashcard válido encontrado no arquivo do deck.';
      }
    } catch (e: any) {
      console.error("Falha ao carregar ou parsear o deck:", e);
      error.value = e.message || "Ocorreu um erro desconhecido.";
      cards.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  return {
    cards,
    isLoading,
    error,
    loadDeckFromFile,
  };
}
