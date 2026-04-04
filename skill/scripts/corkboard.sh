#!/bin/bash
# Corkboard CLI - Post pins to your Corkboard Dashboard
# Usage: corkboard <action> <type> <title> [content] [priority]
#
# Environment:
#   CORKBOARD_API      - API endpoint (default: http://localhost:3010)
#   CORKBOARD_ALERT_URL - Alert server for focus+sound (optional)

API_URL="${CORKBOARD_API:-http://localhost:3010}/api/pins"
ALERT_URL="${CORKBOARD_ALERT_URL:-}"

show_help() {
    cat << 'EOF'
corkboard - Post pins to your Corkboard Dashboard

USAGE:
    corkboard add <type> <title> [content] [priority]
    corkboard list
    corkboard complete <id>
    corkboard delete <id>
    corkboard alert              # Focus window + play sound (requires alert server)

TYPES:
    task         - Action item (white card)
    note         - Reference note (yellow sticky)
    link         - URL bookmark (blue card) - use content for URL
    event        - Calendar event (purple card)
    alert        - Urgent notice (red card)
    email        - Email notification (coral card)
    opportunity  - Flagged opportunity
    briefing     - Morning briefing (spans 2 columns)
    github       - GitHub repo card (terminal style)
    idea         - Incubated idea with scores
    tracking     - Package tracking
    article      - Article summary with reader
    twitter      - X/Twitter post preview
    reddit       - Reddit post preview

SPECIAL COMMANDS:
    corkboard add-email <from> <subject> [preview] [email_id]
    corkboard add-github <repo> <description> [stars] [forks]
    corkboard add-idea <title> [verdict] [summary] [scores_json] [competitors] [effort]
    corkboard add-tracking <number> <carrier> [status] [eta] [url]
    corkboard add-article <title> <url> <source> <tldr> [bullets_json] [tags_json]
    corkboard add-opportunity <title> [content] [priority]
    corkboard add-briefing <title> <content>
    corkboard add-twitter <title> <content> [url]
    corkboard add-reddit <title> <content> [url]

VERDICTS (for ideas):
    hot | warm | cold | pass

TRACKING STATUS:
    pre-transit | in-transit | out-for-delivery | delivered | exception | unknown

PRIORITY:
    1 = High (urgent)
    2 = Medium (default)
    3 = Low

ENVIRONMENT:
    CORKBOARD_API       API endpoint (default: http://localhost:3010)
    CORKBOARD_ALERT_URL Alert server URL (optional)

EXAMPLES:
    corkboard add task "Test login flow" "After auth refactor" 1
    corkboard add note "Meeting notes" "Discussed API design"
    corkboard add link "Autoshop Demo" "https://autoshop.example.com"
    corkboard add alert "Server down" "503 errors in prod" 1
    corkboard add-email "boss@company.com" "Q4 Review" "Please review..." "msg-123"
    corkboard add-github "owner/repo" "Description here" 42 5
    corkboard add-idea "My SaaS" "hot" "Great market fit" '{"viability":8}' 3 "~2 weeks"
    corkboard add-tracking "1Z999AA10123456784" "UPS" "in-transit" "2026-03-30" "https://ups.com/track?num=..."
    corkboard add-article "AI Advances" "https://example.com/article" "TechCrunch" "Major AI breakthrough" '["Point 1","Point 2"]' '["ai","tech"]'
    corkboard add-opportunity "Wholesale lead" "Reply with pricing sheet" 2
    corkboard add-briefing "Morning briefing" "## Today\n- Ship the fix\n- Email the supplier"
    corkboard add-twitter "Interesting thread" "Thread about AI agents..." "https://x.com/user/status/123"
    corkboard add-reddit "Show HN" "New project launch..." "https://reddit.com/r/programming/..."
    corkboard list
    corkboard complete abc-123-def
EOF
}

case "$1" in
    add)
        TYPE="$2"
        TITLE="$3"
        CONTENT="${4:-}"
        PRIORITY="${5:-2}"

        if [[ -z "$TYPE" || -z "$TITLE" ]]; then
            echo "Error: type and title required"
            echo "Usage: corkboard add <type> <title> [content] [priority]"
            exit 1
        fi

        # Build JSON payload
        if [[ "$TYPE" == "link" && -n "$CONTENT" ]]; then
            JSON=$(jq -n \
                --arg type "$TYPE" \
                --arg title "$TITLE" \
                --arg url "$CONTENT" \
                --argjson priority "$PRIORITY" \
                '{type: $type, title: $title, url: $url, priority: $priority}')
        else
            JSON=$(jq -n \
                --arg type "$TYPE" \
                --arg title "$TITLE" \
                --arg content "$CONTENT" \
                --argjson priority "$PRIORITY" \
                '{type: $type, title: $title, content: $content, priority: $priority}')
        fi

        RESULT=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "$JSON")

        echo "$RESULT" | jq -r '"Created: \(.title) [\(.type)] (id: \(.id))"' 2>/dev/null || echo "$RESULT"
        ;;

    list)
        curl -s "$API_URL" | jq -r '.[] | "[\(.type)] \(.title) (\(.status)) - \(.id)"' 2>/dev/null
        ;;

    complete)
        ID="$2"
        if [[ -z "$ID" ]]; then
            echo "Error: id required"
            exit 1
        fi
        curl -s -X PATCH "$API_URL/$ID" \
            -H "Content-Type: application/json" \
            -d '{"status":"completed"}' | jq -r '"Completed: \(.title)"' 2>/dev/null
        ;;

    delete)
        ID="$2"
        if [[ -z "$ID" ]]; then
            echo "Error: id required"
            exit 1
        fi
        curl -s -X DELETE "$API_URL/$ID"
        echo "Deleted: $ID"
        ;;

    alert)
        if [[ -z "$ALERT_URL" ]]; then
            echo "CORKBOARD_ALERT_URL not set"
            exit 1
        fi
        RESULT=$(curl -s -X POST "$ALERT_URL/alert" 2>/dev/null)
        if echo "$RESULT" | grep -q '"triggered":true'; then
            echo "Alert triggered (window focused + sound played)"
        else
            echo "Alert may have failed - check alert server"
        fi
        ;;

    add-github)
        REPO="$2"
        CONTENT="${3:-}"
        STARS="${4:-0}"
        FORKS="${5:-0}"

        if [[ -z "$REPO" ]]; then
            echo "Error: repo required"
            echo "Usage: corkboard add-github <repo> [description] [stars] [forks]"
            exit 1
        fi

        TITLE="${REPO##*/}"
        URL="https://github.com/$REPO"

        JSON=$(jq -n \
            --arg type "github" \
            --arg title "$TITLE" \
            --arg content "$CONTENT" \
            --arg repo "$REPO" \
            --arg url "$URL" \
            --argjson stars "$STARS" \
            --argjson forks "$FORKS" \
            '{type: $type, title: $title, content: $content, repo: $repo, url: $url, stars: $stars, forks: $forks}')

        RESULT=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "$JSON")

        echo "$RESULT" | jq -r '"Created: \(.title) [github] (id: \(.id))"' 2>/dev/null || echo "$RESULT"
        ;;

    add-idea)
        TITLE="$2"
        VERDICT="${3:-warm}"
        SUMMARY="${4:-}"
        SCORES_JSON="${5:-}"
        COMPETITORS="${6:-0}"
        EFFORT="${7:-}"

        if [[ -z "$TITLE" ]]; then
            echo "Error: title required"
            echo "Usage: corkboard add-idea <title> [verdict] [summary] [scores_json] [competitors] [effort]"
            exit 1
        fi

        JSON=$(jq -n \
            --arg type "idea" \
            --arg title "$TITLE" \
            --arg verdict "$VERDICT" \
            --arg summary "$SUMMARY" \
            --argjson scores "${SCORES_JSON:-null}" \
            --argjson competitors "$COMPETITORS" \
            --arg effort "$EFFORT" \
            '{type: $type, title: $title, ideaVerdict: $verdict, ideaResearchSummary: $summary, ideaScores: $scores, ideaCompetitors: $competitors, ideaEffortEstimate: $effort}')

        RESULT=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "$JSON")

        echo "$RESULT" | jq -r '"Created: \(.title) [idea] verdict=\(.ideaVerdict) (id: \(.id))"' 2>/dev/null || echo "$RESULT"
        ;;

    add-email)
        FROM="$2"
        SUBJECT="$3"
        PREVIEW="${4:-}"
        EMAIL_ID="${5:-}"

        if [[ -z "$FROM" || -z "$SUBJECT" ]]; then
            echo "Error: from and subject required"
            echo "Usage: corkboard add-email <from> <subject> [preview] [email_id]"
            exit 1
        fi

        JSON=$(jq -n \
            --arg type "email" \
            --arg title "$SUBJECT" \
            --arg content "$PREVIEW" \
            --arg emailFrom "$FROM" \
            --arg emailId "$EMAIL_ID" \
            '{type: $type, title: $title, content: $content, emailFrom: $emailFrom, emailId: $emailId, priority: 2}')

        RESULT=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "$JSON")

        echo "$RESULT" | jq -r '"Created: \(.title) [email] from \(.emailFrom) (id: \(.id))"' 2>/dev/null || echo "$RESULT"
        ;;

    add-tracking)
        NUMBER="$2"
        CARRIER="$3"
        STATUS="${4:-unknown}"
        ETA="${5:-}"
        URL="${6:-}"

        if [[ -z "$NUMBER" || -z "$CARRIER" ]]; then
            echo "Error: tracking number and carrier required"
            echo "Usage: corkboard add-tracking <number> <carrier> [status] [eta] [url]"
            exit 1
        fi

        TITLE="$CARRIER $NUMBER"

        JSON=$(jq -n \
            --arg type "tracking" \
            --arg title "$TITLE" \
            --arg trackingNumber "$NUMBER" \
            --arg trackingCarrier "$CARRIER" \
            --arg trackingStatus "$STATUS" \
            --arg trackingEta "$ETA" \
            --arg trackingUrl "$URL" \
            '{type: $type, title: $title, trackingNumber: $trackingNumber, trackingCarrier: $trackingCarrier, trackingStatus: $trackingStatus, trackingEta: $trackingEta, trackingUrl: $trackingUrl}')

        RESULT=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "$JSON")

        echo "$RESULT" | jq -r '"Created: \(.title) [tracking] status=\(.trackingStatus) (id: \(.id))"' 2>/dev/null || echo "$RESULT"
        ;;

    add-article)
        TITLE="$2"
        URL="$3"
        SOURCE="$4"
        TLDR="$5"
        BULLETS_JSON="${6:-[]}"
        TAGS_JSON="${7:-[]}"

        if [[ -z "$TITLE" || -z "$URL" || -z "$SOURCE" || -z "$TLDR" ]]; then
            echo "Error: title, url, source, and tldr required"
            echo "Usage: corkboard add-article <title> <url> <source> <tldr> [bullets_json] [tags_json]"
            exit 1
        fi

        JSON=$(jq -n \
            --arg type "article" \
            --arg title "$TITLE" \
            --arg url "$URL" \
            --arg source "$SOURCE" \
            --arg tldr "$TLDR" \
            --argjson bullets "$BULLETS_JSON" \
            --argjson tags "$TAGS_JSON" \
            '{type: $type, title: $title, url: $url, articleData: {url: $url, source: $source, tldr: $tldr, bullets: $bullets, tags: $tags}}')

        RESULT=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "$JSON")

        echo "$RESULT" | jq -r '"Created: \(.title) [article] (id: \(.id))"' 2>/dev/null || echo "$RESULT"
        ;;

    add-twitter)
        TITLE="$2"
        CONTENT="$3"
        URL="${4:-}"

        if [[ -z "$TITLE" || -z "$CONTENT" ]]; then
            echo "Error: title and content required"
            echo "Usage: corkboard add-twitter <title> <content> [url]"
            exit 1
        fi

        JSON=$(jq -n \
            --arg type "twitter" \
            --arg title "$TITLE" \
            --arg content "$CONTENT" \
            --arg url "$URL" \
            '{type: $type, title: $title, content: $content, url: $url}')

        RESULT=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "$JSON")

        echo "$RESULT" | jq -r '"Created: \(.title) [twitter] (id: \(.id))"' 2>/dev/null || echo "$RESULT"
        ;;

    add-reddit)
        TITLE="$2"
        CONTENT="$3"
        URL="${4:-}"

        if [[ -z "$TITLE" || -z "$CONTENT" ]]; then
            echo "Error: title and content required"
            echo "Usage: corkboard add-reddit <title> <content> [url]"
            exit 1
        fi

        JSON=$(jq -n \
            --arg type "reddit" \
            --arg title "$TITLE" \
            --arg content "$CONTENT" \
            --arg url "$URL" \
            '{type: $type, title: $title, content: $content, url: $url}')

        RESULT=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "$JSON")

        echo "$RESULT" | jq -r '"Created: \(.title) [reddit] (id: \(.id))"' 2>/dev/null || echo "$RESULT"
        ;;

    add-opportunity)
        TITLE="$2"
        CONTENT="${3:-}"
        PRIORITY="${4:-2}"

        if [[ -z "$TITLE" ]]; then
            echo "Error: title required"
            echo "Usage: corkboard add-opportunity <title> [content] [priority]"
            exit 1
        fi

        JSON=$(jq -n \
            --arg type "opportunity" \
            --arg title "$TITLE" \
            --arg content "$CONTENT" \
            --argjson priority "$PRIORITY" \
            '{type: $type, title: $title, content: $content, priority: $priority}')

        RESULT=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "$JSON")

        echo "$RESULT" | jq -r '"Created: \(.title) [opportunity] (id: \(.id))"' 2>/dev/null || echo "$RESULT"
        ;;

    add-briefing)
        TITLE="$2"
        CONTENT="${3:-}"

        if [[ -z "$TITLE" ]]; then
            echo "Error: title required"
            echo "Usage: corkboard add-briefing <title> <content>"
            exit 1
        fi

        JSON=$(jq -n \
            --arg type "briefing" \
            --arg title "$TITLE" \
            --arg content "$CONTENT" \
            '{type: $type, title: $title, content: $content}')

        RESULT=$(curl -s -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "$JSON")

        echo "$RESULT" | jq -r '"Created: \(.title) [briefing] (id: \(.id))"' 2>/dev/null || echo "$RESULT"
        ;;

    help|--help|-h)
        show_help
        ;;

    *)
        show_help
        exit 1
        ;;
esac
