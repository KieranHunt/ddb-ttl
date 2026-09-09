# → [DynamoDB's TTL Latency — Kieran Hunt](https://kieran.casa/ddb-ttl/)

![](https://ddbttlstack-bucket83908e77-ymypyzt7abf1.s3.us-east-1.amazonaws.com/ttl-latency.png)

## Setup

`mise trust && mise install` installs the pinned Node version from `mise.toml`.

Upgrading Node: bump `node` in `mise.toml` and regenerate the lockfile with `mise lock` in the same commit. jdx/mise-action installs `--locked` from `mise.lock`, so editing `mise.toml` alone breaks CI.