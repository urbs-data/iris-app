#!/usr/bin/env bash
set -euo pipefail

RG=iris-app
APP=iris-app
REGISTRY=irisappcontainer
IMAGE="$REGISTRY.azurecr.io/iris-app"

cd "$(dirname "$0")/.."

ASSUME_YES=0
[ "${1:-}" = "-y" ] && ASSUME_YES=1

confirm() {
  [ "$ASSUME_YES" = "1" ] && return 0
  [ -t 0 ] || { echo "No es una terminal interactiva, usá -y para confirmar." >&2; exit 1; }
  read -r -p "$1 [y/N] " answer
  [ "$answer" = "y" ] || [ "$answer" = "Y" ]
}

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

[ -f .env ] || { echo "Falta .env: docker compose lo necesita para los build args." >&2; exit 1; }

TAG=$(git rev-parse --short HEAD)

# La tag es el commit. Con cambios sin commitear la imagen no se corresponde con
# ningún punto del historial y el rollback deja de ser confiable.
if [ -n "$(git status --porcelain)" ]; then
  echo "Hay cambios sin commitear:"
  git status --short
  confirm "Deployar igual? la imagen se va a llamar $TAG pero no es ese commit." || exit 1
fi

step "Chequeos locales"
npx tsc --noEmit
npx tsx --tsconfig tsconfig.json scripts/test-split.ts

step "Login al ACR"
if ! az acr login --name "$REGISTRY"; then
  echo "Si falló con 'item already exists in the keychain (-25299)':" >&2
  echo "  security delete-internet-password -s $REGISTRY.azurecr.io" >&2
  exit 1
fi

step "Build ($TAG)"
docker compose build app
docker tag "$IMAGE:latest" "$IMAGE:$TAG"

step "Push"
docker push "$IMAGE:$TAG"
docker push "$IMAGE:latest"

step "Deploy"
# Pushear no dispara nada por sí solo: Container Apps crea una revisión cuando
# cambia el template, y con :latest el template nunca cambia. La tag inmutable
# es lo que hace que --image sea un cambio real.
az containerapp update -g "$RG" -n "$APP" --image "$IMAGE:$TAG" --output none

step "Verificación"
RUNNING=$(az containerapp show -g "$RG" -n "$APP" \
  --query "properties.template.containers[0].image" -o tsv)
echo "imagen en el template: $RUNNING"
[ "$RUNNING" = "$IMAGE:$TAG" ] || { echo "No coincide con $IMAGE:$TAG" >&2; exit 1; }

az containerapp revision list -g "$RG" -n "$APP" \
  --query "[?properties.active].{revision:name,estado:properties.runningState,replicas:properties.replicas}" \
  -o table

FQDN=$(az containerapp show -g "$RG" -n "$APP" \
  --query "properties.configuration.ingress.fqdn" -o tsv)
printf '\nDeployado %s en https://%s\n' "$TAG" "$FQDN"
printf 'Rollback: az containerapp update -g %s -n %s --image %s:<tag-anterior>\n' "$RG" "$APP" "$IMAGE"
