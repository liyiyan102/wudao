#!/usr/bin/env bash
# 远端：安装依赖、PM2、Caddy /wudao 反代
set -euo pipefail
mkdir -p /opt/wudao/data/uploads
cd /opt/wudao

if [ ! -f .env ]; then
  JWT=$(openssl rand -hex 24)
  cat > .env <<ENV
PORT=3100
PUBLIC_BASE_PATH=/wudao
ADMIN_PASSWORD=wudao-admin
JWT_SECRET=${JWT}
NODE_ENV=production
ENV
  echo "[setup] created .env ADMIN_PASSWORD=wudao-admin"
else
  grep -q '^PUBLIC_BASE_PATH=' .env || echo 'PUBLIC_BASE_PATH=/wudao' >> .env
  sed -i 's|^PUBLIC_BASE_PATH=.*|PUBLIC_BASE_PATH=/wudao|' .env
  echo "[setup] kept existing .env"
fi

if [ ! -f /opt/wudao/data/store.json ]; then
  echo '{"posts":[],"activities":[],"users":[],"buddyRequests":[],"applications":[]}' > /opt/wudao/data/store.json
  echo "[setup] created empty store.json"
fi

npm install --omit=dev

pm2 delete wudao >/dev/null 2>&1 || true
pm2 start /opt/wudao/app.js --name wudao --cwd /opt/wudao
pm2 save

TS=$(date +%Y%m%d%H%M%S)
cp -a /etc/Caddyfile "/etc/Caddyfile.bak.${TS}" 2>/dev/null || true
cat > /etc/Caddyfile <<'CADDY'
daitto.site, www.daitto.site {
	handle_path /wudao/* {
		reverse_proxy 127.0.0.1:3100
	}
	handle {
		reverse_proxy 127.0.0.1:3000
	}
}
CADDY

for pid in $(pidof caddy 2>/dev/null); do kill -9 "$pid" 2>/dev/null || true; done
sleep 1
/usr/local/bin/caddy start --config /etc/Caddyfile
sleep 2
pgrep -a caddy || true

echo -n "[check] local :3100 → "
curl -sS -m 5 http://127.0.0.1:3100/ || true
echo
echo -n "[check] https://daitto.site/wudao/ → "
curl -sk -m 10 https://daitto.site/wudao/ || true
echo
echo "[setup] done"
