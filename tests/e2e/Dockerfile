# syntax=docker/dockerfile:1-labs
FROM node:24.10-bookworm
WORKDIR /home/node

RUN npx -y playwright@1.56.1 install --with-deps && \
  npm install -g bun

COPY --parents bun.lock package.json */*/package.json ./

RUN bun install --ignore-scripts --frozen-lockfile --filter "@boots/test-e2e"

COPY tests/e2e/src ./tests/e2e/src
COPY tests/e2e/playwright.config.mts ./tests/e2e/playwright.config.mts

ENTRYPOINT [ "playwright", "test" ]
