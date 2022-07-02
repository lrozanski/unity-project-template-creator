import rimraf from "rimraf";

export const rmDir = (dir: string) => rimraf(dir, error => error && console.log(`Could not delete directory ${dir}/: ${error.message || ""}`));
