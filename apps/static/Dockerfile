FROM caddy:2.10-alpine
WORKDIR /usr/share/caddy

RUN mkdir /home/app

COPY "apps/static/public" .
COPY "apps/static/docker/*" /home/app/

ENTRYPOINT [ "caddy", "run", "--config", "/home/app/Caddyfile", "--adapter", "caddyfile" ]
CMD []
