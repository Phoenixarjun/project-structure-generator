#!/usr/bin/env node
import { hello } from "./commands/hello.js";

process.stdout.write(`${hello(process.argv[2] ?? "world")}\n`);
