/**
 * ISFEC B2B Pilot — Graphiques Chart.js
 */

// Configuration globale Chart.js
Chart.defaults.font.family = "'Open Sans', sans-serif";
Chart.defaults.color = '#333333';

// Palette de couleurs ISFEC
const ISFEC_COLORS = {
  bordeaux: '#722F37',
  bordeauxLight: '#8B4049',
  bordeauxLighter: '#A65560',
  bordeauxPale: '#C47A82',
  success: '#2E7D32',
  warning: '#F57C00',
};

// Initialiser tous les graphiques de la page
function initCharts() {
  if (typeof window.etudeGraphiques === 'undefined' || !window.etudeGraphiques.length) {
    return;
  }

  window.etudeGraphiques.forEach(graph => {
    const canvas = document.getElementById(`canvas-${graph.id}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const config = buildChartConfig(graph);

    new Chart(ctx, config);
  });
}

// Construire la configuration Chart.js à partir des données JSON
function buildChartConfig(graph) {
  const baseConfig = {
    data: graph.data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: 'bold',
          },
          bodyFont: {
            size: 13,
          },
        },
      },
    },
  };

  switch (graph.type) {
    case 'bar':
      return {
        type: 'bar',
        ...baseConfig,
        options: {
          ...baseConfig.options,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
        },
      };

    case 'line':
      return {
        type: 'line',
        ...baseConfig,
        options: {
          ...baseConfig.options,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
          elements: {
            line: {
              tension: 0.3,
            },
            point: {
              radius: 6,
              hoverRadius: 8,
            },
          },
        },
      };

    case 'doughnut':
    case 'pie':
      return {
        type: graph.type,
        ...baseConfig,
        options: {
          ...baseConfig.options,
          cutout: graph.type === 'doughnut' ? '60%' : 0,
          plugins: {
            ...baseConfig.options.plugins,
            tooltip: {
              ...baseConfig.options.plugins.tooltip,
              callbacks: {
                label: function(context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const value = context.raw;
                  const percentage = Math.round((value / total) * 100);
                  return `${context.label}: ${formatNumber(value)} (${percentage}%)`;
                },
              },
            },
          },
        },
      };

    default:
      return baseConfig;
  }
}

// Formater les nombres pour l'affichage
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + ' M€';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + ' K€';
  }
  return num.toLocaleString('fr-FR');
}

// Graphique de progression (utilisé sur le dashboard)
function createProgressChart(elementId, value, max = 100) {
  const canvas = document.getElementById(elementId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const percentage = Math.min(100, Math.round((value / max) * 100));

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [percentage, 100 - percentage],
        backgroundColor: [ISFEC_COLORS.bordeaux, '#E5E5E5'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '75%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    },
  });
}

// Graphique funnel (pour la stratégie commerciale)
function createFunnelChart(elementId, data) {
  const canvas = document.getElementById(elementId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.values,
        backgroundColor: [
          ISFEC_COLORS.bordeaux,
          ISFEC_COLORS.bordeauxLight,
          ISFEC_COLORS.bordeauxLighter,
          ISFEC_COLORS.bordeauxPale,
          ISFEC_COLORS.success,
        ],
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
        y: {
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

// Initialiser les graphiques au chargement de la page
document.addEventListener('DOMContentLoaded', initCharts);

// Export pour utilisation externe
window.ISFECCharts = {
  init: initCharts,
  createProgressChart,
  createFunnelChart,
  COLORS: ISFEC_COLORS,
};
