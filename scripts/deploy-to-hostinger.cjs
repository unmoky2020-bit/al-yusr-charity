const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const REMOTE_DIR = '/home/u389354171/domains/elyusr.org/public_html';

if (!process.env.HOSTINGER_PASSWORD) {
  console.error('[FATAL] Set HOSTINGER_PASSWORD before running this script.');
  process.exit(1);
}

const conn = new Client();

conn.on('ready', () => {
  console.log('[SSH] Connected to Hostinger for deployment.');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('[SFTP Error]:', err.message);
      conn.end();
      return;
    }

    // List of critical SEO and config files to upload immediately
    const filesToUpload = [
      { local: path.resolve('dist/.htaccess'), remote: `${REMOTE_DIR}/.htaccess` },
      { local: path.resolve('dist/index.html'), remote: `${REMOTE_DIR}/index.html` },
      { local: path.resolve('dist/image-sitemap.xml'), remote: `${REMOTE_DIR}/image-sitemap.xml` },
      { local: path.resolve('dist/sitemap.xml'), remote: `${REMOTE_DIR}/sitemap.xml` },
    ];

    let completed = 0;

    function uploadNext(index) {
      if (index >= filesToUpload.length) {
        console.log('[SFTP] All core SEO files uploaded successfully!');
        uploadGalleryFolder(sftp);
        return;
      }

      const item = filesToUpload[index];
      console.log(`[SFTP] Uploading ${path.basename(item.local)} (${fs.statSync(item.local).size} bytes)...`);
      sftp.fastPut(item.local, item.remote, (putErr) => {
        if (putErr) {
          console.error(`[SFTP] Error uploading ${item.local}:`, putErr.message);
        } else {
          console.log(`[SFTP] Finished: ${path.basename(item.local)}`);
        }
        uploadNext(index + 1);
      });
    }

    function uploadGalleryFolder(sftp) {
      const localGallery = path.resolve('dist/images/gallery');
      const remoteGallery = `${REMOTE_DIR}/images/gallery`;
      const remoteImages = `${REMOTE_DIR}/images`;

      // ensure remote directories exist
      sftp.mkdir(remoteImages, () => {
        sftp.mkdir(remoteGallery, () => {
          if (!fs.existsSync(localGallery)) {
            console.log('[SFTP] No local gallery folder found.');
            uploadAssets(sftp);
            return;
          }
          const galleryFiles = fs.readdirSync(localGallery);
          console.log(`[SFTP] Uploading ${galleryFiles.length} gallery images...`);

          let count = 0;
          galleryFiles.forEach((file) => {
            const loc = path.join(localGallery, file);
            const rem = `${remoteGallery}/${file}`;
            sftp.fastPut(loc, rem, (err) => {
              count++;
              if (err) console.error(`[SFTP] Error image ${file}:`, err.message);
              else console.log(`[SFTP] Image uploaded: ${file}`);
              if (count === galleryFiles.length) {
                console.log('[SFTP] Gallery images uploaded.');
                uploadAssets(sftp);
              }
            });
          });
        });
      });
    }

    function uploadAssets(sftp) {
      const localAssets = path.resolve('dist/assets');
      const remoteAssets = `${REMOTE_DIR}/assets`;
      if (!fs.existsSync(localAssets)) {
        conn.end();
        return;
      }

      const files = fs.readdirSync(localAssets);
      console.log(`[SFTP] Syncing ${files.length} built asset bundles...`);
      let done = 0;
      files.forEach((f) => {
        const l = path.join(localAssets, f);
        const r = `${remoteAssets}/${f}`;
        sftp.fastPut(l, r, (e) => {
          done++;
          if (done % 20 === 0 || done === files.length) {
            console.log(`[SFTP] Asset progress: ${done}/${files.length}`);
          }
          if (done === files.length) {
            console.log('[SFTP] All assets deployed successfully to Hostinger!');
            conn.end();
          }
        });
      });
    }

    uploadNext(0);
  });
}).on('error', (err) => {
  console.error('[SSH] Connection error:', err.message);
}).connect({
  host: '195.35.26.214',
  port: 65002,
  username: 'u389354171',
  password: process.env.HOSTINGER_PASSWORD,
  readyTimeout: 30000,
  algorithms: {
    serverHostKey: ['ssh-ed25519', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521', 'rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa']
  }
});
