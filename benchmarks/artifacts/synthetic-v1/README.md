# Frozen preliminary synthetic evaluation: synthetic-v1

These retained local outputs back the preliminary manuscript tables: replay/queue measurements on 1 October 2026 and sensitivity on 2 October 2026. They are not Telegram traffic, channel measurements or VPS benchmarks. The source snapshot was assembled on 4 October 2026; it is provided for reproducibility, not claimed to be a historical Git commit. The replay trace digest is `8afcf45907de6ece6a6de35abb0bb60e5426219cb9adb1c12bacef47ffa39e51`.

From `source/`, in a clean terminal without production credentials:

```bash
npm ci --ignore-scripts
npm run benchmark
npm run benchmark:queue
npm run benchmark:sensitivity
```

Run only the offline benchmark commands in this snapshot. Generated reports go to `source/benchmarks/results/`, preserving the frozen reports alongside this README. Compare trace digest, classification counts and queue-model outputs. CPU/RAM/wall-clock timings depend on the host and need not match the frozen Windows run. The package lockfile pins the runtime dependencies; no bot entrypoint or credentials are included.

`SHA256SUMS.txt` covers retained outputs and source files. Verify with `sha256sum -c SHA256SUMS.txt` on Linux from this directory. The current framework's channel authorization extension has separate mocked tests and requires live evaluation; it does not change the interpretation of these traces.
