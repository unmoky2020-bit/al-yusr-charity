/**
 * deploy-hostinger-fast.cjs
 * رفع نسخة الإنتاج إلى Hostinger عبر SFTP بطريقة tar stream
 * يرسل الـ tar.gz مرة واحدة ثم يفكه على السيرفر — أسرع بكثير من رفع ملف لملف
 */
const { Client } = require('ssh2');
const fs   = require('fs');
const path = require('path');

const HOST     = '195.35.26.214';
const PORT     = 65002;
const USER     = 'u389354171';
const PASS     = process.env.HOSTINGER_PASSWORD;
const ARCHIVE  = path.resolve('deploy-dist.tar.gz');
const REMOTE   = '/home/u389354171/domains/elyusr.org/public_html';

if (!PASS) {
  console.error('[FATAL] Set HOSTINGER_PASSWORD before running this script.');
  process.exit(1);
}

const SIZE = fs.statSync(ARCHIVE).size;
console.log(`[DEPLOY] Archive: ${ARCHIVE} (${(SIZE/1024/1024).toFixed(1)} MB)`);

function humanBytes(b) {
  if (b > 1024*1024) return (b/1024/1024).toFixed(1) + ' MB';
  if (b > 1024)      return (b/1024).toFixed(0) + ' KB';
  return b + ' B';
}

const conn = new Client();

conn.on('ready', () => {
  console.log('[SSH] Connected — uploading archive via SFTP then extracting...');

  conn.sftp((err, sftp) => {
    if (err) { console.error('[SFTP err]', err.message); conn.end(); return; }

    const remoteTar = `/home/u389354171/deploy-dist.tar.gz`;
    const writeStream = sftp.createWriteStream(remoteTar);

    let sent = 0;
    const readStream = fs.createReadStream(ARCHIVE);

    readStream.on('data', chunk => {
      sent += chunk.length;
      process.stdout.write(`\r[SFTP] Uploaded ${humanBytes(sent)} / ${humanBytes(SIZE)}   `);
    });

    readStream.on('error', e => { console.error('\n[READ err]', e.message); conn.end(); });

    writeStream.on('error', e => { console.error('\n[WRITE err]', e.message); conn.end(); });

    writeStream.on('close', () => {
      console.log('\n[SFTP] Archive uploaded. Extracting on server...');

      // Extract the archive directly into public_html, then remove it
      const extractCmd = [
        `tar -xzf ${remoteTar} -C ${REMOTE}`,
        `rm -f ${remoteTar}`,
        `echo "[DONE] Extraction complete"`,
      ].join(' && ');

      conn.exec(extractCmd, (err, stream) => {
        if (err) { console.error('[EXEC err]', err.message); conn.end(); return; }

        stream.on('close', (code) => {
          console.log(`[SSH] Exit code: ${code}`);
          conn.end();
        });
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
      });
    });

    readStream.pipe(writeStream);
  });

}).on('error', err => {
  console.error('[SSH Error]:', err.message);
}).connect({
  host: HOST, port: PORT, username: USER, password: PASS,
  readyTimeout: 30000,
  algorithms: {
    serverHostKey: ['ssh-ed25519','ecdsa-sha2-nistp256','rsa-sha2-512','rsa-sha2-256','ssh-rsa']
  }
});
