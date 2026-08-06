#!/usr/bin/env node
import { runHello } from "./cli/commands/hello.js";

const name = process.argv[2] ?? "World";
console.log(runHello(name));
