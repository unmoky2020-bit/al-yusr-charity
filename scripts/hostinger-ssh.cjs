const { Client } = require('ssh2');

if (!process.env.HOSTINGER_PASSWORD) {
  console.error('[FATAL] Set HOSTINGER_PASSWORD before running this script.');
  process.exit(1);
}

function runRemoteCommand(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';

    conn.on('ready', () => {
      console.log('[SSH] Connected to Hostinger successfully!');
      conn.exec(cmd, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        stream.on('close', (code, signal) => {
          conn.end();
          resolve({ code, stdout, stderr });
        }).on('data', (data) => {
          stdout += data.toString();
        }).stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    }).on('error', (err) => {
      console.error('[SSH] Connection error:', err.message);
      reject(err);
    }).connect({
      host: '195.35.26.214',
      port: 65002,
      username: 'u389354171',
      password: process.env.HOSTINGER_PASSWORD,
      readyTimeout: 20000,
      algorithms: {
        serverHostKey: ['ssh-ed25519', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521', 'rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa']
      }
    });
  });
}

(async () => {
  try {
    const cmd = process.argv[2] || 'pwd && ls -la && ls -la domains/elyusr.org/public_html || ls -la public_html';
    console.log('[SSH] Running command:', cmd);
    const result = await runRemoteCommand(cmd);
    console.log('[SSH] Exit Code:', result.code);
    if (result.stdout) console.log('[STDOUT]:\n' + result.stdout);
    if (result.stderr) console.error('[STDERR]:\n' + result.stderr);
  } catch (e) {
    console.error('[FATAL]:', e.message);
    process.exit(1);
  }
})();
