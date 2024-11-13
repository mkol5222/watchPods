https://chatgpt.com/share/6732fa09-dc54-800a-864a-b747a39ffe4d

```shell
bun init -y
bun add typescript @kubernetes/client-node
bunx tsc --init

bun install
bun run index.ts
NODE_TLS_REJECT_UNAUTHORIZED=0 bun run index.ts
bun build ./index.ts --compile --outfile watchPods
NODE_TLS_REJECT_UNAUTHORIZED=0 ./watchPods