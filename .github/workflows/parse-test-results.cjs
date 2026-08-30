const fs = require('fs');
const path = require('path');

const jsonPath = path.join(process.cwd(), '.vitest/test-results.json');
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!summaryPath) {
  console.error('GITHUB_STEP_SUMMARY env variable is not set');
  process.exit(0);
}

if (fs.existsSync(jsonPath)) {
  try {
    const r = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const total = r.numTotalTests || 0;
    const passed = r.numPassedTests || 0;
    const failed = r.numFailedTests || 0;

    let markdown = '\n### 🧪 Test Suite Results\n';
    markdown += `* **Total Tests:** \`${total}\`\n`;
    markdown += `* **Passed:** \`${passed}\` ✅\n`;
    markdown += `* **Failed:** \`${failed}\` ${failed > 0 ? '❌' : ''}\n\n`;

    if (failed > 0) {
      markdown += '#### ❌ Failed Test Cases\n\n';
      markdown += '| Test Case | Error Summary |\n';
      markdown += '| :--- | :--- |\n';

      const failures = [];

      if (Array.isArray(r.testResults)) {
        r.testResults.forEach((tr) => {
          if (Array.isArray(tr.assertionResults)) {
            tr.assertionResults.forEach((ar) => {
              if (ar.status === 'failed') {
                const cleanMsg = (ar.failureMessages || [])
                  .join('\n')
                  .replace(/\u001b\[[0-9;]*m/g, '') // strip ansi colors
                  .replace(/\x1b\[[0-9;]*m/g, '');

                // Grab first line as summary
                const firstLine = cleanMsg.split('\n')[0] || 'Unknown Error';
                markdown += '| `';
                markdown += ar.fullName.replace(/`/g, '\\`').replace(/\|/g, '\\|');
                markdown += '` | `';
                markdown += firstLine.replace(/`/g, '\\`').replace(/\|/g, '\\|');
                markdown += '` |\n';

                failures.push({
                  name: ar.fullName,
                  trace: cleanMsg,
                });
              }
            });
          }
        });
      }

      markdown += '\n#### 🔍 Detailed Failure Traces\n';
      failures.forEach((f) => {
        markdown += `<details>\n<summary><b>${f.name}</b></summary>\n\n\`\`\`text\n${f.trace}\n\`\`\`\n\n</details>\n`;
      });
    } else {
      markdown += '🎉 **All unit and integration tests passed successfully!**\n';
    }

    fs.appendFileSync(summaryPath, markdown);
  } catch (err) {
    fs.appendFileSync(
      summaryPath,
      `\n### 🧪 Test Suite Results\n⚠️ Error parsing test results JSON: ${err.message}\n`
    );
  }
} else {
  fs.appendFileSync(
    summaryPath,
    '\n### 🧪 Test Suite Results\n⚠️ No test results JSON report was found.\n'
  );
}
