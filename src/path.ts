import isWsl from "is-wsl";

export function resolvePath(path: string) {
    return isWsl
        ? path.replaceAll("C:", "/mnt/c").replaceAll("\\", "/")
        : path.replaceAll("\\", "/");
}

export const appData = process.env["APPDATA"];
