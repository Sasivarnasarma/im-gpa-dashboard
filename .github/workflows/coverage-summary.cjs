const fs = require('fs');
const path = require('path');

const jsonPath = path.join(process.cwd(), '.vitest/coverage/coverage-summary.json');
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!summaryPath) {
  console.error('GITHUB_STEP_SUMMARY env variable is not set');
  process.exit(0);
}

// Same file vitest.config.js reads, so the gate and this report agree.
const THRESHOLDS = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'coverage-thresholds.json'), 'utf8')
);

const bar = (pct) => {
  const filled = Math.round(pct / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
};

if (!fs.existsSync(jsonPath)) {
  fs.appendFileSync(summaryPath, '\n### 📊 Coverage\n⚠️ No coverage summary was found.\n');
  process.exit(0);
}

try {
  const { total } = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let markdown = '\n### 📊 Coverage\n\n';
  markdown += '| Metric | Covered | Coverage | Threshold | |\n';
  markdown += '| :--- | :--- | :--- | :--- | :--- |\n';

  Object.entries(THRESHOLDS).forEach(([metric, threshold]) => {
    const { pct, covered, total: count } = total[metric];
    const mark = pct >= threshold ? '✅' : '❌';
    const label = metric.charAt(0).toUpperCase() + metric.slice(1);
    markdown += `| **${label}** | \`${covered}/${count}\` | \`${bar(pct)}\` ${pct.toFixed(2)}% | ${threshold}% | ${mark} |\n`;
  });

  markdown +=
    '\nThe full HTML report is uploaded as the **coverage-report** artifact at the bottom of this run summary page.\n';

  fs.appendFileSync(summaryPath, markdown);
} catch (err) {
  fs.appendFileSync(
    summaryPath,
    `\n### 📊 Coverage\n⚠️ Error parsing coverage summary JSON: ${err.message}\n`
  );
}
