@_default:
    just --list --list-prefix '  '

alias l := lint
# Format project files
lint:
    bunx --bun oxfmt@latest --ignore-path .oxfmtignore

# Pull and run the web container
up:
    docker compose up --detach --pull always --quiet-pull --remove-orphans

# Tear down project
down:
    docker compose down --remove-orphans
