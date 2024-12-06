const b = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "bun",
  sourcemap: "inline",
  minify: {
    identifiers: true,
    syntax: true,
    whitespace: true,
  },
});

if (!b.success) {
  console.log(b.logs.join("\n"));
  console.log("Build failed");
}
