import { ref, onMounted, watchEffect } from 'vue';

// Definindo um tipo para os temas, para melhor type safety
type Theme = 'light' | 'dark';

export function useTheme() {
  // Tenta carregar o tema do localStorage, ou usa 'light' como padrão.
  // Faz um type assertion para garantir que o valor seja 'light' ou 'dark'.
  const currentTheme = ref<Theme>(
    (localStorage.getItem('theme') as Theme) || 'light'
  );

  // Função para aplicar o tema ao elemento raiz (<html>)
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme'); // Remove o atributo para usar o CSS padrão (light)
    }
  };

  // Função para definir um novo tema
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
    localStorage.setItem('theme', theme);
    // applyTheme(theme); // applyTheme será chamado pelo watchEffect
  };

  // Função para alternar o tema
  const toggleTheme = () => {
    setTheme(currentTheme.value === 'light' ? 'dark' : 'light');
  };

  // Aplica o tema quando o componente que usa o composable é montado
  onMounted(() => {
    applyTheme(currentTheme.value);
  });

  // Observa mudanças em currentTheme e aplica-as ao DOM
  // watch é mais apropriado aqui do que watchEffect se quisermos apenas reagir à mudança de currentTheme.
  // No entanto, watchEffect também funciona bem se applyTheme só depender de currentTheme.value.
  watchEffect(() => {
    applyTheme(currentTheme.value);
  });
  // Alternativa com watch, mais explícito sobre a dependência:
  // watch(currentTheme, (newTheme) => {
  //   applyTheme(newTheme);
  // });


  return {
    currentTheme, // ref para o tema atual (reativo)
    toggleTheme,  // função para alternar o tema
    setTheme,     // função para definir um tema específico (ex: 'light' ou 'dark')
  };
}