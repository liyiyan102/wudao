#!/usr/bin/env bash
# 本机执行：DEPLOY_PASS=xxx ./deploy.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
HOST="${DEPLOY_HOST:-43.155.128.236}"
USER="${DEPLOY_USER:-root}"
REMOTE="/opt/wudao"
PASS="${DEPLOY_PASS:?请设置 DEPLOY_PASS}"

echo "==> 1/3 rsync → ${USER}@${HOST}:${REMOTE}"
expect << EOF
set timeout 600
spawn rsync -az --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .env \
  --exclude data/store.json \
  --exclude data/uploads \
  --exclude "*.log" \
  -e "ssh -o StrictHostKeyChecking=accept-new" \
  ${ROOT}/ ${USER}@${HOST}:${REMOTE}/
expect {
  -re "(?i)password:" { send "${PASS}\r"; exp_continue }
  eof
}
catch wait result
set code [lindex \$result 3]
if {\$code != 0} { exit \$code }
EOF

echo "==> 2/3 上传并执行远端脚本"
expect << EOF
set timeout 30
spawn scp -o StrictHostKeyChecking=accept-new ${ROOT}/scripts/remote-setup.sh ${USER}@${HOST}:/tmp/wudao-setup.sh
expect {
  -re "(?i)password:" { send "${PASS}\r"; exp_continue }
  eof
}
catch wait result
set code [lindex \$result 3]
if {\$code != 0} { exit \$code }
EOF

echo "==> 3/3 remote setup + Caddy"
expect << EOF
set timeout 300
spawn ssh -o StrictHostKeyChecking=accept-new ${USER}@${HOST} {bash /tmp/wudao-setup.sh}
expect {
  -re "(?i)password:" { send "${PASS}\r" }
}
expect eof
catch wait result
exit [lindex \$result 3]
EOF

echo ""
echo "部署完成"
echo "  API:   https://daitto.site/wudao/"
echo "  后台:  https://daitto.site/wudao/admin/"
echo "  口令:  见服务器 /opt/wudao/.env 的 ADMIN_PASSWORD（首次默认 wudao-admin）"
