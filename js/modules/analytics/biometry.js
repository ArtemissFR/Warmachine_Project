/**
 * CORE OPS - BIOMETRY ANALYTICS (ES Module)
 * Handles muscle engagement logic, SVG heatmap updates, and neural balance.
 */

import { State } from '../core/state.js';

export const MUSCLE_MAP = {
  "Développé Couché": { primary: "chest", secondary: ["shoulders-l", "shoulders-r", "triceps-l", "triceps-r"], category: "PUSH" },
  "Squat": { primary: "quads-r", secondary: ["quads-l", "glutes", "abs"], category: "LEGS" },
  "Soulevé de Terre": { primary: "back", secondary: ["glutes", "hams-l", "hams-r", "abs"], category: "PULL" },
  "Développé Militaire": { primary: "shoulders-l", secondary: ["shoulders-r", "triceps-l", "triceps-r"], category: "PUSH" },
  "Dips": { primary: "triceps-l", secondary: ["triceps-r", "chest"], category: "PUSH" },
  "Tractions": { primary: "back", secondary: ["traps", "biceps-l", "biceps-r"], category: "PULL" },
  "Rowing Barre": { primary: "back", secondary: ["traps", "biceps-l", "biceps-r"], category: "PULL" },
  "Curl Biceps": { primary: "biceps-l", secondary: ["biceps-r"], category: "PULL" },
  "Extensions Triceps": { primary: "triceps-l", secondary: ["triceps-r"], category: "PUSH" },
  "Leg Extension": { primary: "quads-l", secondary: ["quads-r"], category: "LEGS" },
  "Leg Curl": { primary: "hams-l", secondary: ["hams-r"], category: "LEGS" },
  "Élévations Latérales": { primary: "shoulders-l", secondary: ["shoulders-r"], category: "PUSH" },
  "Oiseau Poulie": { primary: "shoulders-l", secondary: ["shoulders-r", "traps"], category: "PULL" },
  "Presse à Cuisses": { primary: "quads-l", secondary: ["quads-r", "glutes"], category: "LEGS" },
  "Abdominaux": { primary: "abs", secondary: [], category: "CORE" }
};

export class Biometrie {
  static getEngagement() {
    const perfs = State.get('nexus-perf-history', []);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const muscleScores = {};
    const categoryScores = { "PUSH": 0, "PULL": 0, "LEGS": 0, "CORE": 0 };
    
    perfs.forEach(p => {
      // Parse date DD/MM/YYYY
      const parts = p.date.split('/');
      const pDate = new Date(parts[2], parts[1] - 1, parts[0]);
      if (pDate < thirtyDaysAgo) return;

      const mapping = MUSCLE_MAP[p.exo];
      if (!mapping) return;

      const vol = (p.weight || 1) * (p.sets || 1) * (p.reps || 1);
      
      muscleScores[mapping.primary] = (muscleScores[mapping.primary] || 0) + vol;
      mapping.secondary.forEach(m => {
        muscleScores[m] = (muscleScores[m] || 0) + (vol * 0.3);
      });
      categoryScores[mapping.category] = (categoryScores[mapping.category] || 0) + vol;
    });

    return { muscleScores, categoryScores };
  }

  static updateHeatmap() {
    const { muscleScores } = this.getEngagement();
    const maxScore = Math.max(...Object.values(muscleScores), 1000);

    Object.keys(muscleScores).forEach(mId => {
      const score = muscleScores[mId];
      const pct = Math.min((score / maxScore) * 100, 100);
      const paths = document.querySelectorAll(`#muscle-${mId}`);
      
      paths.forEach(p => {
        const hue = 120 - (pct * 1.2); 
        p.style.fill = `hsla(${hue}, 80%, 50%, 0.3)`;
        p.style.stroke = `hsla(${hue}, 100%, 50%, 0.6)`;
        p.dataset.pct = Math.round(pct);
        p.dataset.score = Math.round(score);
      });
    });
  }

  static getMuscleHistory(muscleId) {
      const perfs = State.get('nexus-perf-history', []);
      return perfs.filter(p => {
          const mapping = MUSCLE_MAP[p.exo];
          if (!mapping) return false;
          return mapping.primary === muscleId || mapping.secondary.includes(muscleId);
      }).slice(-5); // Last 5 sessions for this muscle
  }
}
