// O app instalado (PWA) usa a barra de navegação inferior sempre que a janela
// não ocupa a tela toda, e não só quando fica muito estreita.

/** Abaixo desta fração da largura útil da tela, a janela é considerada "em janela". */
export const WINDOWED_APP_RATIO = 0.95;

export function isWindowedApp(options: { installedApp: boolean; innerWidth: number; availWidth: number }) {
  const { installedApp, innerWidth, availWidth } = options;
  if (!installedApp) return false;
  if (!Number.isFinite(availWidth) || availWidth <= 0) return false;
  return innerWidth < availWidth * WINDOWED_APP_RATIO;
}
