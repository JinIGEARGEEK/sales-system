FROM node:22.12.0-alpine AS release
COPY . .
CMD [ "node", ".output/server/index.mjs" ]
