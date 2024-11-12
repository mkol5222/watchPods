https://chatgpt.com/share/6732fa09-dc54-800a-864a-b747a39ffe4d

```shell
bun init -y
bun add typescript @kubernetes/client-node
bunx tsc --init

bun run index.ts

bun build ./index.ts --compile --outfile watchPods
./watchPods