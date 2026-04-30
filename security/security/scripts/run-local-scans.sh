#!/usr/bin/env bash
# Run before every PR. Same checks CI runs, locally.
# Tuned for waliFit's pnpm monorepo (apps/mobile, apps/backend, packages/shared).

set -u
cd "$(dirname "$0")/../.."  # repo root

RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[1;33m'; NC='\033[0m'
FAILED=0

header() { echo -e "\n${YLW}━━━ $1 ━━━${NC}"; }
pass()   { echo -e "${GRN}✓ $1${NC}"; }
fail()   { echo -e "${RED}✗ $1${NC}"; FAILED=1; }

# ── 1. Secrets scan ──────────────────────────────────────────────────
header "Secrets scan (gitleaks)"
if command -v gitleaks >/dev/null 2>&1; then
    if gitleaks detect --source . --no-banner --exit-code 1 --redact; then
        pass "No secrets detected"
    else
        fail "Secrets found — rotate and remove from history"
    fi
else
    echo "  gitleaks not installed — brew install gitleaks"
fi

# ── 2. Dependency audit per workspace ────────────────────────────────
header "Dependency audit (pnpm)"
if command -v pnpm >/dev/null 2>&1; then
    if pnpm audit --prod --audit-level high; then
        pass "No high/critical CVEs"
    else
        fail "High or critical CVEs in dependencies"
    fi
else
    echo "  pnpm not installed — brew install pnpm"
fi

# ── 3. waliFit-specific anti-patterns ────────────────────────────────
header "waliFit anti-patterns"

check_grep() {
    local pattern="$1"; local label="$2"; local path="${3:-apps}"
    if [ -d "$path" ] && grep -rEn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "$pattern" "$path" 2>/dev/null | grep -v "node_modules" | grep -q .; then
        echo "    matches:"
        grep -rEn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "$pattern" "$path" 2>/dev/null | grep -v "node_modules" | head -5 | sed 's/^/      /'
        fail "$label"
    else
        pass "$label — clean"
    fi
}

# Raw MMKV without encryption key
check_grep "new MMKV\(\)"                            "MMKV instantiated without encryption key"
check_grep "new MMKV\(\{[^}]*\}\)"                   "MMKV instantiated — verify encryptionKey is set"

# Auth tokens in MMKV (should be in Keychain)
check_grep "MMKV.*setString.*[Tt]oken"               "Auth token written to MMKV (use Keychain instead)"
check_grep "storage\.set.*[Tt]oken"                  "Token written to plain storage"

# Direct Supabase auth calls in middleware
check_grep "supabase\.auth\.getUser"                 "Supabase auth.getUser in code (use JWT verify in middleware)"

# AI SDK imports outside src/waliAI/
if [ -d apps/backend/src ]; then
    BAD=$(grep -rEn --include="*.ts" "from '@anthropic-ai/sdk'|from '@google/generative-ai'" apps/backend/src 2>/dev/null | grep -v "src/waliAI/" | grep -v "node_modules")
    if [ -n "$BAD" ]; then
        echo "$BAD" | head -5 | sed 's/^/      /'
        fail "AI SDK imported outside src/waliAI/"
    else
        pass "AI SDKs only used inside src/waliAI/ — clean"
    fi
fi

# Disabled TLS validation
check_grep "rejectUnauthorized\s*:\s*false"          "Disabled TLS validation"
check_grep "NSAllowsArbitraryLoads.*true"            "ATS arbitrary loads enabled" .

# Console.log of sensitive data
check_grep "console\.log.*[Pp]assword"               "Password in console.log"
check_grep "console\.log.*[Tt]oken"                  "Token in console.log"

# Hardcoded JWT secret defaults
check_grep "JWT_SECRET\s*=\s*['\"][^'\"]+['\"]"      "JWT_SECRET hardcoded" apps/backend

# AsyncStorage usage (the architecture says MMKV only)
check_grep "from '@react-native-async-storage"       "AsyncStorage import (architecture says MMKV only)"

# ── 4. Release build sanity ──────────────────────────────────────────
header "Release config sanity"

if [ -f apps/mobile/app.json ]; then
    # Check that EXPO_PUBLIC_* env vars don't include obvious secrets
    if grep -E "EXPO_PUBLIC_.*(SECRET|KEY)" apps/mobile/app.json 2>/dev/null | grep -vE "EXPO_PUBLIC_API_URL|EXPO_PUBLIC_PUBLISHABLE" >/dev/null; then
        fail "EXPO_PUBLIC_ var with SECRET/KEY in name — these are bundled into the JS"
    else
        pass "No obvious secrets in EXPO_PUBLIC_ env vars"
    fi
fi

if [ -f apps/mobile/android/app/build.gradle ]; then
    if grep -q "minifyEnabled true" apps/mobile/android/app/build.gradle; then
        pass "R8/minify enabled on Android release"
    else
        fail "R8/minify not enabled in apps/mobile/android/app/build.gradle"
    fi
fi

# ── 5. Webhook verification check (V2.5+) ────────────────────────────
if [ -f apps/backend/src/routes/webhooks.ts ]; then
    header "Webhook signature verification"
    if grep -q "constructEvent" apps/backend/src/routes/webhooks.ts; then
        pass "Stripe webhook uses constructEvent (verifies signature)"
    else
        fail "Stripe webhook handler missing signature verification"
    fi
fi

# ── Summary ──────────────────────────────────────────────────────────
header "Summary"
if [ "$FAILED" -eq 0 ]; then
    echo -e "${GRN}All local checks passed.${NC}"
    echo "Next: run MobSF on a release build before submitting."
    exit 0
else
    echo -e "${RED}Checks failed. Fix before pushing.${NC}"
    exit 1
fi
