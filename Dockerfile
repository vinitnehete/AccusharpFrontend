# syntax=docker/dockerfile:1

# ---- build ----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# npm ci, not npm install: installs exactly the lockfile, so a build is
# reproducible and a transitive dependency cannot drift between environments.
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
# INLINE_RUNTIME_CHUNK=false keeps CRA from inlining the webpack runtime into
# index.html. That is what lets nginx.conf use script-src 'self' with no
# 'unsafe-inline' - the single most valuable directive in the CSP.
ENV INLINE_RUNTIME_CHUNK=false
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# ---- serve ----------------------------------------------------------------
FROM nginx/nginx-unprivileged:1.30.6-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY security-headers.conf /etc/nginx/security-headers.conf

RUN rm -f /usr/share/nginx/html/*.map

# Render overrides PORT with 10000. Keeping a non-privileged local default
# makes `docker run -p 8080:8080 ...` work outside Render as well.
ENV PORT=8080
# Only substitute deployment variables in nginx.conf. Without this filter the
# image entrypoint also expands Nginx runtime variables such as $host and
# $scheme to empty strings before Nginx starts.
ENV NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_URL)$"
EXPOSE 8080
