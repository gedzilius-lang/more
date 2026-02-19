#!/usr/bin/env bash
set -euo pipefail
BASE="https://more.peoplewelike.club"
USERNAME="${1:-oscarzillini}"
FAILED=0
pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ FAIL: $1"; FAILED=1; }

echo "=== PWL-MORE VERIFICATION === $(date)"
echo "Testing $BASE | Card: $USERNAME"
echo ""

echo "[1] Root redirect to radio"
LOC=$(curl -sI "$BASE/" | grep -i '^location:' | tr -d '\r\n' | sed 's/location: //i')
if echo "$LOC" | grep -qi "radio.peoplewelike.club"; then pass "/ → $LOC"; else fail "/ did not redirect to radio (got: $LOC)"; fi

echo "[2] Health endpoint"
H=$(curl -fsS "$BASE/health" 2>/dev/null || echo 'FAIL')
if echo "$H" | grep -q '"ok":true'; then pass "/health ok"; else fail "/health: $H"; fi

echo "[3] Public card"
S=$(curl -o /dev/null -s -w "%{http_code}" "$BASE/more/$USERNAME")
if [ "$S" = "200" ]; then pass "/more/$USERNAME 200"; else fail "/more/$USERNAME → $S"; fi

echo "[4] QR endpoint"
CT=$(curl -sI "$BASE/more/$USERNAME/qr" | grep -i content-type | head -1)
if echo "$CT" | grep -qi "svg"; then pass "/qr returns SVG"; else fail "/qr content-type: $CT"; fi

echo "[5] Login page"
S=$(curl -o /dev/null -s -w "%{http_code}" "$BASE/more/$USERNAME/login")
if [ "$S" = "200" ]; then pass "/login 200"; else fail "/login → $S"; fi

echo "[6] Tracked redirect (no 500)"
S=$(curl -o /dev/null -s -w "%{http_code}" "$BASE/more/$USERNAME/l/testkey")
if [ "$S" != "500" ]; then pass "/l/testkey → $S (not 500)"; else fail "/l/testkey → 500"; fi

echo "[7] Docker isolation"
RADIO=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -c 'radio-' || echo 0)
MORE=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -c 'pwl-more-' || echo 0)
echo "     Radio: $RADIO containers | PWL-More: $MORE containers"
[ "$RADIO" -ge 4 ] && pass "Radio intact" || fail "Radio containers missing!"
[ "$MORE" -ge 2 ] && pass "PWL-More running" || fail "PWL-More not running"

echo ""
[ "$FAILED" = "0" ] && echo "ALL CHECKS PASSED ✓" || { echo "SOME CHECKS FAILED"; exit 1; }
