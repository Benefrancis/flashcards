export interface FlashcardData {
  id: string;
  afirmacao: string;
  resposta: "V" | "F" | string; // Aceita V, F ou qualquer string para flexibilidade
  explicacao: string;
}

// Você também pode reutilizar a interface DeckInfo aqui se desejar centralizar tipos
export interface DeckInfo {
  id: string;
  name: string;
  file: string;
  description?: string;
}
