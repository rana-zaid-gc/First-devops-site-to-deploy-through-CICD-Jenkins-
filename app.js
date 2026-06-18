document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  const toggleIcon = themeToggle.querySelector('.toggle-icon');
  
  // Check local storage or system preferences
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    if (theme === 'light') {
      toggleIcon.textContent = '☀️';
    } else {
      toggleIcon.textContent = '🌙';
    }
  }

  // 2. Auto-Update Copyright Year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 3. Simulated VM Metrics Update
  const cpuVal = document.getElementById('cpu-val');
  const cpuBar = document.getElementById('cpu-bar');
  const ramVal = document.getElementById('ram-val');
  const ramBar = document.getElementById('ram-bar');
  const netVal = document.getElementById('net-val');
  const sparklineContainer = document.getElementById('sparkline-container');

  // Initialize sparkline bars
  const maxSparklinePoints = 12;
  const sparklineHeights = Array(maxSparklinePoints).fill(10);
  
  function renderSparkline() {
    sparklineContainer.innerHTML = '';
    sparklineHeights.forEach(h => {
      const bar = document.createElement('div');
      bar.className = 'sparkline-bar';
      bar.style.height = `${h}%`;
      sparklineContainer.appendChild(bar);
    });
  }
  renderSparkline();

  setInterval(() => {
    // Randomize metrics slightly
    const currentCpu = Math.floor(Math.random() * 45) + 10; // 10% to 55%
    const currentRam = parseFloat((Math.random() * 2.5 + 3.5).toFixed(1)); // 3.5 to 6.0 GB
    const currentNet = parseFloat((Math.random() * 40 + 5).toFixed(1)); // 5.0 to 45.0 MB/s

    // Update CPU
    cpuVal.textContent = currentCpu;
    cpuBar.style.width = `${currentCpu}%`;

    // Update RAM (8GB Total)
    ramVal.textContent = currentRam;
    const ramPct = (currentRam / 8) * 100;
    ramBar.style.width = `${ramPct}%`;

    // Update Network & Sparkline graph
    netElTextUpdate(currentNet);
    const netPct = Math.min(100, Math.floor((currentNet / 50) * 100));
    sparklineHeights.shift();
    sparklineHeights.push(netPct);
    renderSparkline();
  }, 1800);

  function netElTextUpdate(val) {
    netVal.textContent = val;
  }

  // 4. Simulated Server Log Feed
  const consoleLog = document.getElementById('console-log');
  const logMessages = [
    { type: 'text-success', msg: 'GET /index.html 200 OK - 2.4ms' },
    { type: 'text-success', msg: 'GET /style.css 200 OK - 1.1ms' },
    { type: 'text-success', msg: 'GET /app.js 200 OK - 0.9ms' },
    { type: 'text-mute', msg: 'Agent handshake successful. Monitoring cpu, memory, and bandwidth.' },
    { type: 'text-warning', msg: 'Disk read operations spike: +15% alert cleared.' },
    { type: 'text-mute', msg: 'Periodic memory compaction routine executed.' },
    { type: 'text-success', msg: 'Healthcheck heartbeat received: status OK' },
    { type: 'text-success', msg: 'GET /api/metrics 200 OK - 4.8ms' }
  ];

  setInterval(() => {
    // 30% chance to append a new log entry
    if (Math.random() > 0.4) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const randomLog = logMessages[Math.floor(Math.random() * logMessages.length)];
      
      const newLogLine = document.createElement('p');
      newLogLine.className = `console-line ${randomLog.type}`;
      newLogLine.innerHTML = `<span class="text-mute">[${timeStr}]</span> ${randomLog.msg}`;
      
      consoleLog.appendChild(newLogLine);
      
      // Auto scroll console to bottom
      consoleLog.scrollTop = consoleLog.scrollHeight;

      // Keep only last 10 logs
      while (consoleLog.children.length > 10) {
        consoleLog.removeChild(consoleLog.firstChild);
      }
    }
  }, 3000);

  // 5. Copy Secrets to Clipboard
  const copyBtn = document.getElementById('copy-btn');
  copyBtn.addEventListener('click', () => {
    const textToCopy = `VM_HOST\nVM_USER\nVM_SSH_KEY`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('btn-primary');
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.classList.remove('btn-primary');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  });
});
