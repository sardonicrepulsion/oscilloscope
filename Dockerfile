FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY . /srv/
RUN rm -f /srv/Dockerfile /srv/.gitignore
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s \
    CMD wget -qO- http://127.0.0.1/health || exit 1
LABEL version="0.3.0"
EXPOSE 80
