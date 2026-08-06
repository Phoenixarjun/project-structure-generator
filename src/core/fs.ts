import { access, lstat, mkdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { constants } from "node:fs";
import { StructgenError } from "./errors.js";

export async function pathExists(value: string): Promise<boolean> {
  try {
    await access(value);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(value: string): Promise<boolean> {
  try {
    return (await stat(value)).isDirectory();
  } catch {
    return false;
  }
}

export async function readJsonFile<T>(value: string): Promise<T> {
  let content: string;

  try {
    content = await readFile(value, "utf8");
  } catch (error) {
    throw new StructgenError("FILE_READ_FAILED", `Unable to read ${value}`, error);
  }

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new StructgenError("INVALID_JSON", `Invalid JSON in ${value}`, error);
  }
}

export async function writeJsonFile(value: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(value), { recursive: true });
  await writeFile(value, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function assertSafeRelativePath(value: string, label: string): string {
  if (!value || value.trim() === "") {
    throw new StructgenError("UNSAFE_PATH", `${label} cannot be empty`);
  }

  if (path.isAbsolute(value)) {
    throw new StructgenError("UNSAFE_PATH", `${label} must be relative: ${value}`);
  }

  const normalized = path.normalize(value);
  const segments = normalized.split(path.sep);

  if (normalized === ".." || segments.includes("..")) {
    throw new StructgenError("UNSAFE_PATH", `${label} cannot escape its root: ${value}`);
  }

  if (normalized === ".") {
    throw new StructgenError("UNSAFE_PATH", `${label} cannot resolve to the root directory`);
  }

  const reservedPattern = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i;
  for (const segment of segments) {
    if (reservedPattern.test(segment) || segment.endsWith(".") || segment.endsWith(" ")) {
      throw new StructgenError("UNSAFE_PATH", `${label} contains invalid or reserved filename: ${segment}`);
    }
  }

  return normalized;
}

export function resolveInside(root: string, relative: string, label: string): string {
  const safe = assertSafeRelativePath(relative, label);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, safe);
  const prefix = `${resolvedRoot}${path.sep}`;

  if (resolved !== resolvedRoot && !resolved.startsWith(prefix)) {
    throw new StructgenError("UNSAFE_PATH", `${label} escapes its root: ${relative}`);
  }

  return resolved;
}

export async function assertNoSymlinkAncestors(root: string, destination: string): Promise<void> {
  const resolvedRoot = path.resolve(root);
  const resolvedDestination = path.resolve(destination);
  const relative = path.relative(resolvedRoot, resolvedDestination);

  try {
    const rootInfo = await lstat(resolvedRoot);
    if (rootInfo.isSymbolicLink()) {
      throw new StructgenError("SYMLINK_REJECTED", `Refusing to write through symlink root: ${resolvedRoot}`);
    }
  } catch (error) {
    if (error instanceof StructgenError) {
      throw error;
    }
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      throw error;
    }
  }

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new StructgenError("UNSAFE_PATH", `Destination escapes target root: ${destination}`);
  }

  const segments = relative.split(path.sep).filter(Boolean);
  let current = resolvedRoot;

  for (const segment of segments.slice(0, -1)) {
    current = path.join(current, segment);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) {
        throw new StructgenError("SYMLINK_REJECTED", `Refusing to write through symlink: ${current}`);
      }
    } catch (error) {
      if (error instanceof StructgenError) {
        throw error;
      }
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw error;
      }
    }
  }
}

export async function ensureWritableDirectory(value: string): Promise<void> {
  await mkdir(value, { recursive: true });
  try {
    await access(value, constants.W_OK);
  } catch (error) {
    throw new StructgenError("NOT_WRITABLE", `Directory is not writable: ${value}`, error);
  }
}

export async function canonicalPath(value: string): Promise<string> {
  try {
    return await realpath(value);
  } catch {
    return path.resolve(value);
  }
}
