/**
 * CORE OPS - MISSION REPORT (ES Module)
 * Compiles a visual summary of progress, milestones, and stats.
 */

import { State } from '../core/state.js';

export class MissionReport {
  static generate() {
    const perfs = State.get('nexus-perf-history', []);
    const weights = State.get('nexus-weight-history', []);
    const meals = State.get('nexus-daily-meals', []);
    const username = localStorage.getItem('nexus-username') || 'SOLDAT';
    
    // Calculate Volume (Session)
    const today = new Date().toLocaleDateString('fr-FR');
    const sessionPerfs = perfs.filter(p => p.date === today);
    const sessionVolume = sessionPerfs.reduce((acc, p) => acc + ((p.weight || 0) * (p.sets || 0) * (p.reps || 0)), 0);
    
    // Calculate Weight Diff
    let weightDiff = 0;
    if (weights.length >= 2) {
      weightDiff = weights[weights.length - 1].val - weights[0].val;
    }

    // Top Exercise
    const counts = {};
    perfs.forEach(p => { counts[p.exo] = (counts[p.exo] || 0) + 1; });
    const topExo = Object.entries(counts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      username,
      date: today,
      volume: sessionVolume,
      weightDiff: weightDiff.toFixed(1),
      topExo,
      rank: document.getElementById('userRank')?.textContent || 'CITOYEN',
      success: sessionVolume > 0 || meals.length > 0
    };
  }

  static renderUI(container) {
    const data = this.generate();
    if (!container) return;

    container.innerHTML = `
      <div class="report-content">
        <div class="report-header">
          <div class="report-stamp">CONFIDENTIEL</div>
          <div class="report-title">RAPPORT DE MISSION — CORE OPS</div>
          <div class="report-id">OPERATIVE: ${data.username} | REF: ${Date.now().toString().slice(-6)}</div>
        </div>
        
        <div class="report-grid">
          <div class="report-entry">
            <label>STATUT GLOBAL</label>
            <div class="report-val" style="color:var(--neon-blue)">${data.success ? 'MISSION ACCOMPLIE' : 'EN ATTENTE'}</div>
          </div>
          <div class="report-entry">
            <label>CHARGE TOTALE DÉPLACÉE</label>
            <div class="report-val">${data.volume.toLocaleString()} KG</div>
          </div>
          <div class="report-entry">
            <label>ÉVOLUTION PONDÉRALE</label>
            <div class="report-val">${data.weightDiff > 0 ? '+' : ''}${data.weightDiff} KG</div>
          </div>
          <div class="report-entry">
            <label>ZONE D'INTERVENTION CIBLE</label>
            <div class="report-val">${data.topExo}</div>
          </div>
        </div>

        <div class="report-footer">
          <div class="footer-rank">NIVEAU D'ACCRÉDITATION : ${data.rank}</div>
          <div class="footer-date">DATA LOGGED: ${data.date}</div>
        </div>
      </div>
    `;
  }
}
